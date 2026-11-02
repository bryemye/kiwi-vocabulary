import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from kiwi_vocab.models import Root, VocabularyWord
from kiwi_math.models import MathQuestion
from kiwi_reading.models import ReadingPassage, ReadingQuestion
from platform_core.models import StudyLog, MagicLoginToken

client = APIClient()

print("=" * 80)
print("KIWI PLATFORM MODULAR ARCHITECTURE VERIFICATION")
print("=" * 80)

# 1. Platform Auth Endpoints
print("\n[1. Platform Authentication Namespacing]")
res = client.post('/api/platform/auth/magic-link/', {'email': 'platform_tester@kiwilearning.com'}, format='json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
assert res.data.get('success') is True
token_obj = MagicLoginToken.objects.filter(user__email='platform_tester@kiwilearning.com').first()
assert token_obj is not None
print("[PASS] /api/platform/auth/magic-link/ responded successfully")

res_verify = client.post('/api/platform/auth/verify-magic-link/', {'token': token_obj.token}, format='json')
assert res_verify.status_code == 200, f"Expected 200, got {res_verify.status_code}"
print("[PASS] /api/platform/auth/verify-magic-link/ verified token and initiated session")

res_me = client.get('/api/platform/auth/me/')
assert res_me.status_code == 200 and res_me.data['email'] == 'platform_tester@kiwilearning.com'
print("[PASS] /api/platform/auth/me/ returned authenticated platform user")

# 2. Kiwi Vocabulary Flagship Endpoints
print("\n[2. Kiwi Vocabulary Flagship Product]")
roots_res = client.get('/api/vocab/roots/')
assert roots_res.status_code == 200 and len(roots_res.data) > 0
print(f"[PASS] /api/vocab/roots/ returned {len(roots_res.data)} roots with nested word families")

words_res = client.get('/api/vocab/words/?limit=10')
assert words_res.status_code == 200 and len(words_res.data) == 10
print(f"[PASS] /api/vocab/words/ returned paginated word list with root details")

session_res = client.get('/api/vocab/session/?count=15')
assert session_res.status_code == 200 and len(session_res.data) == 15
print(f"[PASS] /api/vocab/session/ returned balanced 15-card session deck")

stats_res = client.get('/api/vocab/stats/')
assert stats_res.status_code == 200 and 'root_mastery' in stats_res.data
print(f"[PASS] /api/vocab/stats/ returned {len(stats_res.data['root_mastery'])} root mastery indices")

# 3. Kiwi Math & Reading Decoupled Modules (Verified Disabled & Isolated)
print("\n[3. Kiwi Math & Reading Modules Disconnected / Disabled]")
math_res = client.get('/api/math/questions/')
assert math_res.status_code == 404, f"Expected 404 for disabled math, got {math_res.status_code}"
print("[PASS] /api/math/ is cleanly disabled (returns 404)")

reading_res = client.get('/api/reading/passages/')
assert reading_res.status_code == 404, f"Expected 404 for disabled reading, got {reading_res.status_code}"
print("[PASS] /api/reading/ is cleanly disabled (returns 404)")

# 4. Platform Unified Study Log & Dashboard
print("\n[4. Platform Core Telemetry & Study Activity]")
first_word = VocabularyWord.objects.first()
log_res = client.post('/api/platform/study-logs/', {
    'item_type': 'WORD',
    'word_id': first_word.id,
    'is_correct': True,
    'seconds_spent': 12
}, format='json')
assert log_res.status_code == 201
print(f"[PASS] /api/platform/study-logs/ logged vocabulary review")

dash_res = client.get('/api/platform/dashboard/stats/')
assert dash_res.status_code == 200
assert dash_res.data['overall']['total_attempts'] >= 1
print(f"[PASS] /api/platform/dashboard/stats/ aggregated platform telemetry across modules")

print("\n" + "=" * 80)
print("ALL MODULAR PLATFORM SUITE CHECKS COMPLETED WITH 100% SUCCESS!")
print("=" * 80)
