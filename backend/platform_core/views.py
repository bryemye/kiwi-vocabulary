import random
import secrets
from urllib.parse import urlparse
from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import StudyLog, MagicLoginToken
from .serializers import StudyLogSerializer, UserSerializer
from .mail import send_magic_link_email

User = get_user_model()


def clean_token(raw_token: str) -> str:
    """
    Cleans raw tokens, handling terminal copy-paste edge cases:
    - Quoted-printable =3D artifact
    - Soft line breaks ('=\r\n', '=\n') and newlines/spaces
    - Full URLs accidentally pasted into token fields
    """
    if not raw_token or not isinstance(raw_token, str):
        return ""
    token = raw_token.strip()

    if 'token=' in token:
        token = token.split('token=')[-1].split('&')[0]

    token = token.replace('=\r\n', '').replace('=\n', '').replace('=\r', '')
    token = token.replace('\r', '').replace('\n', '').replace(' ', '')

    if token.startswith('=3D'):
        token = token[3:]
    elif token.startswith('3D') and not MagicLoginToken.objects.filter(token=token).exists():
        candidate = token[2:]
        if MagicLoginToken.objects.filter(token=candidate).exists():
            token = candidate

    return token


class RequestMagicLinkView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        if not isinstance(email, str):
            return Response({'error': 'Invalid email format.'}, status=status.HTTP_400_BAD_REQUEST)

        email = email.strip().lower()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(email)
        except ValidationError:
            return Response({'error': 'Please enter a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Registration & Login in One Flow
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            base_username = email.split('@')[0][:30]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            user = User.objects.create_user(username=username, email=email)
            user.set_unusable_password()
            user.save()

        # 2. Cryptographically signed token using TimestampSigner
        signer = TimestampSigner(salt='kiwi-magic-link')
        nonce = secrets.token_urlsafe(16)
        payload = f"{user.id}:{nonce}"
        token = signer.sign(payload)

        MagicLoginToken.objects.create(user=user, token=token)

        # 3. Generate verification magic link matching the active client origin
        origin = request.META.get('HTTP_ORIGIN') or request.META.get('HTTP_REFERER')
        if origin:
            parsed = urlparse(origin)
            frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        else:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')

        magic_link = f"{frontend_url}/auth/verify?token={token}"

        # 4. Dispatch email via configured EMAIL_BACKEND (Resend SMTP or Console)
        send_magic_link_email(to_email=user.email, magic_link=magic_link)

        print(f"\n{'='*80}\n[KIWI MAGIC LOGIN LINK] (DIRECT CLICK / SINGLE-LINE COPY):\n-> {magic_link}\n{'='*80}\n", flush=True)

        return Response({
            "success": True,
            "message": "Login link sent to your email."
        }, status=status.HTTP_200_OK)


class VerifyMagicLinkView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.data.get('token', '')
        if not raw_token or not isinstance(raw_token, str):
            return Response({'error': 'Verification token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        token = clean_token(raw_token)
        if not token:
            return Response({'error': 'Verification token is invalid or empty.'}, status=status.HTTP_400_BAD_REQUEST)

        signer = TimestampSigner(salt='kiwi-magic-link')

        try:
            payload = signer.unsign(token, max_age=15 * 60)
        except SignatureExpired:
            return Response({'error': 'Login link has expired (valid for 15 minutes). Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
            return Response({
                'error': (
                    'Invalid login link. If you copied from the terminal console, '
                    'ensure the entire link was selected without line-wrapping, or use the direct link banner.'
                )
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            token_record = MagicLoginToken.objects.select_for_update().filter(token=token).first()
            if not token_record or token_record.is_used:
                return Response({'error': 'This login link has already been used or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user_id = int(payload.split(':')[0])
                if token_record.user_id != user_id:
                    return Response({'error': 'Token user mismatch.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, IndexError):
                return Response({'error': 'Malformed token payload.'}, status=status.HTTP_400_BAD_REQUEST)

            token_record.is_used = True
            token_record.used_at = timezone.now()
            token_record.save(update_fields=['is_used', 'used_at'])

            user = token_record.user
            req = request._request if hasattr(request, '_request') else request
            login(req, user)

            return Response({
                "id": user.id,
                "email": user.email,
                "username": user.username,
            }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        req = request._request if hasattr(request, '_request') else request
        logout(req)
        return Response({
            "success": True,
            "message": "Successfully logged out."
        }, status=status.HTTP_200_OK)


class StudyLogViewSet(viewsets.ModelViewSet):
    """
    Centralized API for creating and querying study logs across all platform products.
    """
    queryset = StudyLog.objects.select_related('word', 'word__root').all()
    serializer_class = StudyLogSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        item_type = self.request.query_params.get('item_type')
        if item_type:
            queryset = queryset.filter(item_type=item_type.upper())
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(username='demo_student', email='scholar@example.com')
        serializer.save(user=user)


class PlatformDashboardStatsView(APIView):
    """
    Unified platform metrics combining activity across Kiwi Vocabulary, Kiwi Math, and Kiwi Reading.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()

        if user:
            logs = StudyLog.objects.filter(user=user).select_related('word', 'word__root').all()
            if not logs.exists():
                logs = StudyLog.objects.select_related('word', 'word__root').all()
        else:
            logs = StudyLog.objects.select_related('word', 'word__root').all()

        total_attempts = logs.count()
        total_correct = logs.filter(is_correct=True).count()
        overall_accuracy = round((total_correct / total_attempts * 100), 1) if total_attempts > 0 else 0.0
        total_seconds = logs.aggregate(total=Sum('seconds_spent'))['total'] or 0

        # Section breakdown
        vocab_logs = logs.filter(item_type='WORD')
        vocab_total = vocab_logs.count()
        vocab_correct = vocab_logs.filter(is_correct=True).count()
        vocab_accuracy = round((vocab_correct / vocab_total * 100), 1) if vocab_total > 0 else 0.0
        unique_words_reviewed = vocab_logs.values('word_id').distinct().count()

        math_logs = logs.filter(Q(item_type='MATH') | Q(item_type='QUESTION', section='MATH'))
        if not math_logs.exists():
            math_logs = logs.filter(item_type='QUESTION')
        math_total = math_logs.count()
        math_correct = math_logs.filter(is_correct=True).count()
        math_accuracy = round((math_correct / math_total * 100), 1) if math_total > 0 else 0.0

        read_logs = logs.filter(Q(item_type='READING') | Q(item_type='QUESTION', section='READ'))
        read_total = read_logs.count()
        read_correct = read_logs.filter(is_correct=True).count()
        read_accuracy = round((read_correct / read_total * 100), 1) if read_total > 0 else 0.0

        # Etymology Root Mastery index from kiwi_vocab
        root_mastery_list = []
        recommended_roots = []
        try:
            from kiwi_vocab.models import Root
            roots = Root.objects.prefetch_related('words').all()
            for root in roots:
                root_words = root.words.all()
                total_root_words = root_words.count()
                root_logs = logs.filter(item_type='WORD', word__root=root)
                r_attempts = root_logs.count()
                r_correct = root_logs.filter(is_correct=True).count()
                r_accuracy = round((r_correct / r_attempts * 100), 1) if r_attempts > 0 else 0.0

                words_mastered_count = 0
                for w in root_words:
                    w_logs = root_logs.filter(word=w).order_by('-created_at')
                    if w_logs.exists() and w_logs.first().is_correct:
                        words_mastered_count += 1

                mastery_percentage = round((words_mastered_count / total_root_words * 100), 1) if total_root_words > 0 else 0.0

                root_mastery_list.append({
                    'id': root.id,
                    'morpheme': root.morpheme,
                    'language': root.language,
                    'core_meaning': root.core_meaning,
                    'mnemonic': root.mnemonic,
                    'thematic_cluster': getattr(root, 'thematic_cluster', 'Movement'),
                    'sat_tier': getattr(root, 'sat_tier', 'Tier 1 High-Yield'),
                    'total_words': total_root_words,
                    'mastered_words': words_mastered_count,
                    'mastery_percentage': mastery_percentage,
                    'accuracy_percentage': r_accuracy,
                    'attempts': r_attempts,
                    'words': [
                        {
                            'id': w.id,
                            'word': w.word,
                            'is_mastered': (root_logs.filter(word=w).order_by('-created_at').first().is_correct if root_logs.filter(word=w).exists() else False)
                        }
                        for w in root_words
                    ]
                })

            recommended_roots = sorted(
                root_mastery_list,
                key=lambda r: (r['mastery_percentage'], r['accuracy_percentage'], -r['total_words'])
            )[:3]
        except Exception as e:
            print("Notice: kiwi_vocab metrics integration note:", e)

        return Response({
            'overall': {
                'total_attempts': total_attempts,
                'total_correct': total_correct,
                'accuracy_percentage': overall_accuracy,
                'total_seconds_spent': total_seconds,
                'unique_words_reviewed': unique_words_reviewed,
            },
            'sections': {
                'vocab': {
                    'total': vocab_total,
                    'correct': vocab_correct,
                    'accuracy_percentage': vocab_accuracy,
                    'unique_reviewed': unique_words_reviewed,
                },
                'math': {
                    'total': math_total,
                    'correct': math_correct,
                    'accuracy_percentage': math_accuracy,
                },
                'reading': {
                    'total': read_total,
                    'correct': read_correct,
                    'accuracy_percentage': read_accuracy,
                }
            },
            'root_mastery': root_mastery_list,
            'recommendations': recommended_roots,
            'recent_logs': StudyLogSerializer(logs[:10], many=True).data
        })
