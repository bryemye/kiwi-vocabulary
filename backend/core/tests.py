import time
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.signing import TimestampSigner, b62_encode
from rest_framework.test import APIClient
from rest_framework import status
from platform_core.models import MagicLoginToken

User = get_user_model()


class MagicLinkAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_request_magic_link_new_user(self):
        """Requesting a magic link for a new email automatically registers the user."""
        email = "new_student@example.com"
        response = self.client.post('/api/auth/magic-link/', {'email': email}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data.get('message'), "Login link sent to your email.")

        # User created in database
        user = User.objects.filter(email=email).first()
        self.assertIsNotNone(user)
        self.assertFalse(user.has_usable_password())

        # Email sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn("Your Kiwi Learning Magic Login Link", sent_email.subject)
        self.assertIn(email, sent_email.to)
        self.assertIn("/auth/verify?token=", sent_email.body)

        # MagicLoginToken created
        token_record = MagicLoginToken.objects.filter(user=user).first()
        self.assertIsNotNone(token_record)
        self.assertFalse(token_record.is_used)

    def test_request_magic_link_existing_user(self):
        """Requesting a magic link for an existing user reuses their account."""
        user = User.objects.create_user(username="scholar", email="scholar@example.com")
        initial_count = User.objects.count()

        response = self.client.post('/api/auth/magic-link/', {'email': 'scholar@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), initial_count)

    def test_request_magic_link_invalid_email(self):
        """Invalid or missing email returns 400 Bad Request."""
        res_empty = self.client.post('/api/auth/magic-link/', {'email': ''}, format='json')
        self.assertEqual(res_empty.status_code, status.HTTP_400_BAD_REQUEST)

        res_invalid = self.client.post('/api/auth/magic-link/', {'email': 'not-an-email'}, format='json')
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_magic_link_success_and_single_use(self):
        """Verifying a valid token logs the user in; reusing the token fails."""
        email = "verify_test@example.com"
        self.client.post('/api/auth/magic-link/', {'email': email}, format='json')
        token_record = MagicLoginToken.objects.filter(user__email=email).first()
        token = token_record.token

        # Verify token
        res_verify = self.client.post('/api/auth/verify-magic-link/', {'token': token}, format='json')
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertEqual(res_verify.data['email'], email)
        self.assertEqual(res_verify.data['id'], token_record.user.id)

        # Session should now be active
        res_me = self.client.get('/api/auth/me/')
        self.assertEqual(res_me.status_code, status.HTTP_200_OK)
        self.assertEqual(res_me.data['email'], email)

        # Attempt to reuse the token (Single-use test)
        res_reuse = self.client.post('/api/auth/verify-magic-link/', {'token': token}, format='json')
        self.assertEqual(res_reuse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been used or is invalid", res_reuse.data.get('error', ''))

    def test_verify_magic_link_quoted_printable_mangled(self):
        """Tokens mangled by terminal quoted-printable wrapping are automatically cleaned and verified."""
        email = "qp_test@example.com"
        self.client.post('/api/auth/magic-link/', {'email': email}, format='json')
        token_record = MagicLoginToken.objects.filter(user__email=email).first()
        raw_token = token_record.token

        # Simulate console quoted-printable wrapping: leading 3D and soft line break =\r\n
        split_idx = len(raw_token) // 2
        mangled_token = f"3D{raw_token[:split_idx]}=\r\n{raw_token[split_idx:]}"

        res_verify = self.client.post('/api/auth/verify-magic-link/', {'token': mangled_token}, format='json')
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertEqual(res_verify.data['email'], email)

    def test_verify_magic_link_tampered_token(self):
        """Tampered token fails verification."""
        res = self.client.post('/api/auth/verify-magic-link/', {'token': 'fake:token:tampered'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_magic_link_expired_token(self):
        """Tokens older than 15 minutes (900 seconds) are rejected."""
        user = User.objects.create_user(username="timetraveler", email="time@example.com")
        signer = TimestampSigner(salt='kiwi-magic-link')
        past_time = time.time() - 950
        old_ts = b62_encode(int(past_time))
        value = f"{user.id}:old_nonce"
        sig = signer.signature(f"{value}:{old_ts}")
        expired_token = f"{value}:{old_ts}:{sig}"

        MagicLoginToken.objects.create(user=user, token=expired_token)

        res = self.client.post('/api/auth/verify-magic-link/', {'token': expired_token}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res.data.get('error', '').lower())

    def test_auth_me_unauthenticated(self):
        """Unauthenticated GET /api/auth/me/ returns 401."""
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        """POST /api/auth/logout/ terminates the session."""
        user = User.objects.create_user(username="logout_user", email="logout@example.com")
        self.client.force_login(user)

        res_me_before = self.client.get('/api/auth/me/')
        self.assertEqual(res_me_before.status_code, status.HTTP_200_OK)

        res_logout = self.client.post('/api/auth/logout/')
        self.assertEqual(res_logout.status_code, status.HTTP_200_OK)
        self.assertTrue(res_logout.data.get('success'))

        res_me_after = self.client.get('/api/auth/me/')
        self.assertEqual(res_me_after.status_code, status.HTTP_401_UNAUTHORIZED)
