from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, Sum
import random
import secrets
from urllib.parse import urlparse
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from .models import Root, VocabularyWord, ReadingPassage, Question, StudyLog, MagicLoginToken
from .serializers import (
    RootSerializer,
    VocabularyWordSerializer,
    QuestionSerializer,
    ReadingPassageSerializer,
    StudyLogSerializer
)


class RootViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Root.objects.prefetch_related('words').all()
    serializer_class = RootSerializer
    permission_classes = [permissions.AllowAny]


class VocabularyWordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VocabularyWord.objects.select_related('root').all()
    serializer_class = VocabularyWordSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        root_id = self.request.query_params.get('root')
        language = self.request.query_params.get('language')
        search = self.request.query_params.get('search')
        connotation = self.request.query_params.get('connotation')

        if root_id:
            queryset = queryset.filter(root_id=root_id)
        if language and language.upper() != 'ALL':
            queryset = queryset.filter(root__language__iexact=language)
        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(word__icontains=search) | Q(definition__icontains=search)
            )
        if connotation:
            queryset = queryset.filter(connotation=connotation)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        limit = request.query_params.get('limit')
        offset = request.query_params.get('offset', 0)

        if limit is not None:
            try:
                limit = max(1, int(limit))
                offset = max(0, int(offset))
                queryset = queryset[offset:offset + limit]
            except ValueError:
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def session(self, request):
        """
        Return a balanced deck of words (default 15).
        Prioritizes:
        1. Unstudied words
        2. Words with past incorrect StudyLog entries
        3. Random selection to complete the count
        """
        try:
            count = max(1, min(100, int(request.query_params.get('count', 15))))
        except ValueError:
            count = 15

        base_qs = self.get_queryset()
        user = request.user if (request.user and request.user.is_authenticated) else User.objects.first()

        logs = StudyLog.objects.filter(item_type='WORD')
        if user:
            logs = logs.filter(user=user)

        studied_word_ids = set(logs.values_list('word_id', flat=True))

        # 1. Unstudied words
        unstudied_qs = base_qs.exclude(id__in=studied_word_ids).order_by('?')
        unstudied_words = list(unstudied_qs[:count])

        deck = list(unstudied_words)

        # 2. If deck has room, add words with incorrect attempts
        if len(deck) < count:
            remaining = count - len(deck)
            deck_ids = {w.id for w in deck}
            
            incorrect_ids = set(logs.filter(is_correct=False).values_list('word_id', flat=True))
            incorrect_qs = base_qs.filter(id__in=incorrect_ids).exclude(id__in=deck_ids).order_by('?')
            incorrect_words = list(incorrect_qs[:remaining])
            deck.extend(incorrect_words)

        # 3. If deck still has room, fill with random words from base_qs
        if len(deck) < count:
            remaining = count - len(deck)
            deck_ids = {w.id for w in deck}
            fill_qs = base_qs.exclude(id__in=deck_ids).order_by('?')
            fill_words = list(fill_qs[:remaining])
            deck.extend(fill_words)

        # Final shuffle for natural practice flow
        random.shuffle(deck)

        serializer = self.get_serializer(deck, many=True)
        return Response(serializer.data)


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.select_related('passage').all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section.upper())
        return queryset


class ReadingPassageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadingPassage.objects.prefetch_related('questions').all()
    serializer_class = ReadingPassageSerializer
    permission_classes = [permissions.AllowAny]


class StudyLogViewSet(viewsets.ModelViewSet):
    queryset = StudyLog.objects.select_related('word', 'question', 'word__root').all()
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


class DashboardStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()

        # In single-user demo mode, query demo user logs or all records
        if user:
            logs = StudyLog.objects.filter(user=user).select_related('word', 'question', 'word__root').all()
            if not logs.exists():
                logs = StudyLog.objects.select_related('word', 'question', 'word__root').all()
        else:
            logs = StudyLog.objects.select_related('word', 'question', 'word__root').all()

        total_attempts = logs.count()
        total_correct = logs.filter(is_correct=True).count()
        overall_accuracy = round((total_correct / total_attempts * 100), 1) if total_attempts > 0 else 0.0

        total_seconds = logs.aggregate(total=Sum('seconds_spent'))['total'] or 0

        # Section breakdown
        # Vocab: item_type='WORD'
        vocab_logs = logs.filter(item_type='WORD')
        vocab_total = vocab_logs.count()
        vocab_correct = vocab_logs.filter(is_correct=True).count()
        vocab_accuracy = round((vocab_correct / vocab_total * 100), 1) if vocab_total > 0 else 0.0
        unique_words_reviewed = vocab_logs.values('word_id').distinct().count()

        # Math: item_type='QUESTION', question__section='MATH'
        math_logs = logs.filter(item_type='QUESTION', question__section='MATH')
        math_total = math_logs.count()
        math_correct = math_logs.filter(is_correct=True).count()
        math_accuracy = round((math_correct / math_total * 100), 1) if math_total > 0 else 0.0

        # Reading: item_type='QUESTION', question__section='READ'
        read_logs = logs.filter(item_type='QUESTION', question__section='READ')
        read_total = read_logs.count()
        read_correct = read_logs.filter(is_correct=True).count()
        read_accuracy = round((read_correct / read_total * 100), 1) if read_total > 0 else 0.0

        # Etymology Root Mastery index
        roots = Root.objects.prefetch_related('words').all()
        root_mastery_list = []
        
        for root in roots:
            root_words = root.words.all()
            total_root_words = root_words.count()
            
            # Logs for words belonging to this root
            root_logs = logs.filter(item_type='WORD', word__root=root)
            r_attempts = root_logs.count()
            r_correct = root_logs.filter(is_correct=True).count()
            r_accuracy = round((r_correct / r_attempts * 100), 1) if r_attempts > 0 else 0.0
            
            # Words in this root mastered (most recent attempt was correct)
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

        # Recommendations: roots with lowest accuracy or lowest mastery among attempted or unattempted
        recommended_roots = sorted(
            root_mastery_list,
            key=lambda r: (r['mastery_percentage'], r['accuracy_percentage'], -r['total_words'])
        )[:3]

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


def clean_token(raw_token: str) -> str:
    """
    Cleans raw tokens, handling terminal copy-paste edge cases:
    - Quoted-printable =3D artifact (e.g. 'token=3D...' yielding '3D...')
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

        # 1. Registration & Login in One Flow:
        # Get or create user
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

        # 4. Dispatch email via configured EMAIL_BACKEND
        subject = "Your Kiwi Learning Magic Login Link"
        message = (
            f"Hello,\n\n"
            f"Click the link below to sign in or complete your registration for Kiwi Learning:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 15 minutes and can only be used once.\n\n"
            f"If you did not request this link, you can safely ignore this email.\n\n"
            f"-- The Kiwi Learning Team"
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kiwilearning.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )

        # Ensure single-line clean clickable output for terminal/console development (ASCII-safe for Windows cp1252)
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

        # Validate token signature & 15-minute expiration (900s)
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

        # Ensure single-use status atomically
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
            # Login the user via standard session
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
