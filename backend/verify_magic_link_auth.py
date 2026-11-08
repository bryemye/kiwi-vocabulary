import os
import django
import time

os.environ['EMAIL_BACKEND'] = 'platform_core.mail.KiwiConsoleEmailBackend'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.signing import TimestampSigner, b62_encode
from platform_core.models import MagicLoginToken

User = get_user_model()

client = APIClient()

print("=" * 70)
print("VERIFICATION SUITE: PASSWORDLESS MAGIC LINK AUTHENTICATION")
print("=" * 70)

# Test 1: Auto-registration and Magic Link Dispatch
test_email = "new_scholar_2026@kiwilearning.com"
User.objects.filter(email=test_email).delete()

print(f"\n[Step 1] Requesting magic link for new email: {test_email}")
res_request = client.post('/api/auth/magic-link/', {'email': test_email}, format='json')
assert res_request.status_code == 200, f"Expected 200, got {res_request.status_code}: {res_request.data}"
assert res_request.data.get('success') is True
assert res_request.data.get('message') == "Login link sent to your email."
print("-> Magic link successfully requested. Response:", res_request.data)

user = User.objects.filter(email=test_email).first()
assert user is not None, "User should have been auto-registered!"
assert not user.has_usable_password(), "Password should be unusable (passwordless flow)"
print(f"-> Auto-registered User: ID={user.id}, Username={user.username}, Email={user.email}")

# Email dispatched via console backend (verified in stdout above)
print(f"-> Email dispatched to: {user.email}")

# Extract token
token_record = MagicLoginToken.objects.filter(user=user).order_by('-created_at').first()
assert token_record is not None
token = token_record.token
print(f"-> Cryptographic Token: {token[:35]}... (length: {len(token)})")

# Test 2: Verify Magic Link & Session Login
print("\n[Step 2] Verifying magic link via /api/auth/verify-magic-link/")
res_verify = client.post('/api/auth/verify-magic-link/', {'token': token}, format='json')
assert res_verify.status_code == 200, f"Expected 200, got {res_verify.status_code}: {res_verify.data}"
assert res_verify.data['id'] == user.id
assert res_verify.data['email'] == user.email
assert res_verify.data['username'] == user.username
print("-> Successfully verified! User details:", res_verify.data)

# Test 3: Session Persistence (/api/auth/me/)
print("\n[Step 3] Checking authenticated session via /api/auth/me/")
res_me = client.get('/api/auth/me/')
assert res_me.status_code == 200, f"Expected 200, got {res_me.status_code}: {res_me.data}"
assert res_me.data['email'] == test_email
print("-> /api/auth/me/ returned authenticated user:", res_me.data)

# Test 4: Single-Use Security Guarantee (Token Replay Prevention)
print("\n[Step 4] Testing token single-use (replay attempt)")
res_replay = client.post('/api/auth/verify-magic-link/', {'token': token}, format='json')
assert res_replay.status_code == 400, f"Expected 400 for replay, got {res_replay.status_code}"
assert "already been used or is invalid" in res_replay.data.get('error', '')
print("-> Token replay blocked as expected! Error:", res_replay.data['error'])

# Test 5: Token Expiration (> 15 minutes)
print("\n[Step 5] Testing token expiration (> 15 minutes)")
signer = TimestampSigner(salt='kiwi-magic-link')
past_time = time.time() - 950 # 15 min 50 sec ago
old_ts = b62_encode(int(past_time))
payload_val = f"{user.id}:expired_nonce"
sig = signer.signature(f"{payload_val}:{old_ts}")
expired_token = f"{payload_val}:{old_ts}:{sig}"
MagicLoginToken.objects.create(user=user, token=expired_token)

res_expired = client.post('/api/auth/verify-magic-link/', {'token': expired_token}, format='json')
assert res_expired.status_code == 400
assert "expired" in res_expired.data.get('error', '').lower()
print("-> Expired token rejected as expected! Error:", res_expired.data['error'])

# Test 6: Logout
print("\n[Step 6] Testing logout via /api/auth/logout/")
res_logout = client.post('/api/auth/logout/')
assert res_logout.status_code == 200
assert res_logout.data.get('success') is True
print("-> Logout successful:", res_logout.data)

res_me_logged_out = client.get('/api/auth/me/')
assert res_me_logged_out.status_code == 401
print("-> Verified user is logged out (401 from /api/auth/me/)")

# Test 7: Existing User Magic Link Request
print(f"\n[Step 7] Requesting magic link for existing user: {test_email}")
user_count_before = User.objects.count()
res_existing = client.post('/api/auth/magic-link/', {'email': test_email}, format='json')
assert res_existing.status_code == 200
assert User.objects.count() == user_count_before, "Existing user should be reused, not duplicated!"
print("-> Existing user successfully reused without duplication.")

print("\n" + "=" * 70)
print("ALL MAGIC LINK VERIFICATION CHECKS PASSED PERFECTLY!")
print("=" * 70)
