import random
import secrets
import uuid
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

        # 3. Generate cross-device session pairing credentials
        session_id = uuid.uuid4()
        device_secret = secrets.token_urlsafe(32)
        match_code = str(secrets.randbelow(90) + 10)  # 2-digit confirmation code: 10 - 99

        MagicLoginToken.objects.create(
            user=user,
            token=token,
            session_id=session_id,
            device_secret=device_secret,
            match_code=match_code,
            status='PENDING'
        )

        # 4. Generate verification magic link matching the active client origin
        origin = request.META.get('HTTP_ORIGIN') or request.META.get('HTTP_REFERER')
        if origin:
            parsed = urlparse(origin)
            frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        else:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')

        magic_link = f"{frontend_url}/auth/verify?token={token}&sid={session_id}"

        # 5. Dispatch email via configured EMAIL_BACKEND (Resend SMTP or Console)
        send_magic_link_email(to_email=user.email, magic_link=magic_link, match_code=match_code)

        print(f"\n{'='*80}\n[KIWI MAGIC LOGIN LINK] (DIRECT CLICK / SINGLE-LINE COPY):\n-> {magic_link}\n[MATCH CODE]: {match_code}\n{'='*80}\n", flush=True)

        return Response({
            "success": True,
            "message": "Login link sent to your email.",
            "session_id": str(session_id),
            "device_secret": device_secret,
            "match_code": match_code,
        }, status=status.HTTP_200_OK)


class PollMagicLinkStatusView(APIView):
    """
    Polling endpoint used by the initiating device (e.g. computer/desktop)
    to wait for confirmation from the secondary device (e.g. mobile phone).
    Once APPROVED, logs in the initiating device and sets its session cookie.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        device_secret = request.data.get('device_secret')

        if not session_id or not device_secret:
            return Response({'error': 'session_id and device_secret are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_record = MagicLoginToken.objects.select_related('user').get(
                session_id=session_id,
                device_secret=device_secret
            )
        except (MagicLoginToken.DoesNotExist, ValidationError, ValueError):
            return Response({'error': 'Invalid or unknown session.'}, status=status.HTTP_404_NOT_FOUND)

        # Check expiration (15 minutes)
        if (timezone.now() - token_record.created_at).total_seconds() > 15 * 60:
            if token_record.status != 'EXPIRED':
                token_record.status = 'EXPIRED'
                token_record.save(update_fields=['status'])
            return Response({'status': 'EXPIRED', 'error': 'Sign-in session expired. Please request a new link.'}, status=status.HTTP_400_BAD_REQUEST)

        if token_record.status == 'PENDING':
            return Response({'status': 'PENDING'}, status=status.HTTP_200_OK)

        if token_record.status == 'DENIED':
            return Response({'status': 'DENIED', 'error': 'Sign-in request was rejected.'}, status=status.HTTP_403_FORBIDDEN)

        if token_record.status == 'APPROVED':
            with transaction.atomic():
                locked = MagicLoginToken.objects.select_for_update().get(id=token_record.id)
                if locked.status != 'APPROVED':
                    return Response({'error': 'Session status has changed.'}, status=status.HTTP_400_BAD_REQUEST)

                locked.status = 'CONSUMED'
                locked.is_used = True
                locked.used_at = timezone.now()
                locked.save(update_fields=['status', 'is_used', 'used_at'])

                user = locked.user
                admin_emails = [e.lower() for e in getattr(settings, 'ADMIN_EMAILS', [])]
                if user.email and user.email.lower() in admin_emails and not user.is_staff:
                    user.is_staff = True
                    user.is_superuser = True
                    user.save(update_fields=['is_staff', 'is_superuser'])

                req = request._request if hasattr(request, '_request') else request
                login(req, user)

                return Response({
                    "status": "APPROVED",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "is_staff": bool(user.is_staff),
                        "is_superuser": bool(user.is_superuser),
                    }
                }, status=status.HTTP_200_OK)

        if token_record.status == 'CONSUMED':
            return Response({'status': 'CONSUMED', 'error': 'Session already completed.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': token_record.status}, status=status.HTTP_200_OK)


class VerifyMagicLinkView(APIView):
    """
    Verification endpoint called when a magic link is accessed:
    - action='check': Checks link validity and returns match code without consuming token (for mobile prompt)
    - action='approve': Marks cross-device session as APPROVED (called by mobile phone)
    - action='deny': Rejects cross-device session
    - action='verify' (default): Validates token, consumes it, and establishes session on current device
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.data.get('token', '')
        session_id = request.data.get('session_id') or request.data.get('sid')
        action = request.data.get('action', 'verify')

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

        token_record = MagicLoginToken.objects.select_related('user').filter(token=token).first()
        if not token_record:
            return Response({'error': 'This login link is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = int(payload.split(':')[0])
            if token_record.user_id != user_id:
                return Response({'error': 'Token user mismatch.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, IndexError):
            return Response({'error': 'Malformed token payload.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. ACTION: CHECK (Mobile inspects request before approving)
        if action == 'check':
            if token_record.is_used and token_record.status != 'APPROVED':
                return Response({'error': 'This login link has already been used.', 'status': token_record.status}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "valid": True,
                "email": token_record.user.email,
                "match_code": token_record.match_code,
                "status": token_record.status,
                "session_id": str(token_record.session_id) if token_record.session_id else None,
            }, status=status.HTTP_200_OK)

        # 2. ACTION: DENY (User explicitly rejects sign-in on phone)
        if action == 'deny':
            with transaction.atomic():
                locked = MagicLoginToken.objects.select_for_update().get(id=token_record.id)
                locked.status = 'DENIED'
                locked.is_used = True
                locked.used_at = timezone.now()
                locked.save(update_fields=['status', 'is_used', 'used_at'])
            return Response({"success": True, "message": "Sign-in request denied."}, status=status.HTTP_200_OK)

        # 3. ACTION: APPROVE (User confirms login from their phone)
        if action == 'approve':
            with transaction.atomic():
                locked = MagicLoginToken.objects.select_for_update().get(id=token_record.id)
                if locked.is_used and locked.status != 'PENDING':
                    return Response({'error': 'This request has already been processed or expired.'}, status=status.HTTP_400_BAD_REQUEST)
                locked.status = 'APPROVED'
                locked.save(update_fields=['status'])
            return Response({
                "success": True,
                "cross_device": True,
                "message": "Authorized! Your computer will log in momentarily."
            }, status=status.HTTP_200_OK)

        # 4. ACTION: VERIFY (Default / Same-Device Direct Login)
        with transaction.atomic():
            locked = MagicLoginToken.objects.select_for_update().get(id=token_record.id)
            if locked.is_used:
                return Response({'error': 'This login link has already been used or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

            locked.is_used = True
            locked.status = 'CONSUMED'
            locked.used_at = timezone.now()
            locked.save(update_fields=['is_used', 'status', 'used_at'])

            user = locked.user
            admin_emails = [e.lower() for e in getattr(settings, 'ADMIN_EMAILS', [])]
            if user.email and user.email.lower() in admin_emails and not user.is_staff:
                user.is_staff = True
                user.is_superuser = True
                user.save(update_fields=['is_staff', 'is_superuser'])

            req = request._request if hasattr(request, '_request') else request
            login(req, user)

            return Response({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_staff": bool(user.is_staff),
                "is_superuser": bool(user.is_superuser),
            }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure staff/superuser status if in configured ADMIN_EMAILS
        admin_emails = [e.lower() for e in getattr(settings, 'ADMIN_EMAILS', [])]
        if user.email and user.email.lower() in admin_emails and not user.is_staff:
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=['is_staff', 'is_superuser'])

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_staff": bool(user.is_staff),
            "is_superuser": bool(user.is_superuser),
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

            # Optimize: Single-pass in-memory dictionary aggregation to eliminate ~3,000 N+1 queries
            vocab_log_entries = list(
                vocab_logs.values('word_id', 'word__root_id', 'is_correct', 'created_at')
                .order_by('created_at')
            )
            latest_word_mastery = {}
            root_attempts = {}
            root_correct = {}

            for entry in vocab_log_entries:
                w_id = entry['word_id']
                r_id = entry['word__root_id']
                latest_word_mastery[w_id] = bool(entry['is_correct'])
                if r_id:
                    root_attempts[r_id] = root_attempts.get(r_id, 0) + 1
                    if entry['is_correct']:
                        root_correct[r_id] = root_correct.get(r_id, 0) + 1

            for root in roots:
                root_words = root.words.all()
                total_root_words = len(root_words)
                r_attempts = root_attempts.get(root.id, 0)
                r_corr = root_correct.get(root.id, 0)
                r_accuracy = round((r_corr / r_attempts * 100), 1) if r_attempts > 0 else 0.0

                words_data = []
                words_mastered_count = 0
                for w in root_words:
                    is_m = latest_word_mastery.get(w.id, False)
                    if is_m:
                        words_mastered_count += 1
                    words_data.append({
                        'id': w.id,
                        'word': w.word,
                        'is_mastered': is_m
                    })

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
                    'words': words_data
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
