import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from kiwi_vocab.models import Root, VocabularyWord
from kiwi_math.models import MathQuestion
from kiwi_reading.models import ReadingPassage
from platform_core.models import StudyLog

client = APIClient()

print("=" * 60)
print("VERIFICATION SUITE: STUDY LOGS & DYNAMIC DASHBOARD STATS")
print("=" * 60)

# Step 0: Clean baseline
StudyLog.objects.all().delete()
stats_0 = client.get('/api/dashboard/stats/').data
initial_attempts = stats_0['overall']['total_attempts']
initial_correct = stats_0['overall']['total_correct']
print(f"\n[Baseline] Initial Total Attempts: {initial_attempts}, Total Correct: {initial_correct}, Accuracy: {stats_0['overall']['accuracy_percentage']}%")

# Step 1: Submit Vocab Study Log (Mode 1)
test_word = VocabularyWord.objects.first()
print(f"\n[Mode 1: Vocab] Submitting attempt for word '{test_word.word}' (Root: {test_word.root.morpheme}) - is_correct=True, seconds=15")
vocab_res = client.post('/api/study-logs/', {
    'item_type': 'WORD',
    'word': test_word.id,
    'is_correct': True,
    'seconds_spent': 15
}, format='json')
assert vocab_res.status_code == 201, f"Expected 201, got {vocab_res.status_code}"
print("-> Vocab StudyLog successfully created:", vocab_res.data['id'])

stats_1 = client.get('/api/dashboard/stats/').data
print(f"-> Updated Overall Attempts: {stats_1['overall']['total_attempts']} (was {initial_attempts})")
print(f"-> Vocab Attempts: {stats_1['sections']['vocab']['total']}, Vocab Accuracy: {stats_1['sections']['vocab']['accuracy_percentage']}%")
assert stats_1['overall']['total_attempts'] == initial_attempts + 1

# Step 2: Submit Math Question Study Log (Mode 2)
math_q = MathQuestion.objects.first()
print(f"\n[Mode 2: Math] Submitting attempt for Math Question ID {math_q.id} - is_correct=True, seconds=35")
math_res = client.post('/api/study-logs/', {
    'item_type': 'QUESTION',
    'section': 'MATH',
    'question': math_q.id,
    'is_correct': True,
    'seconds_spent': 35
}, format='json')
assert math_res.status_code == 201, f"Expected 201, got {math_res.status_code}"
print("-> Math StudyLog successfully created:", math_res.data['id'])

stats_2 = client.get('/api/dashboard/stats/').data
print(f"-> Updated Math Attempts: {stats_2['sections']['math']['total']}, Math Accuracy: {stats_2['sections']['math']['accuracy_percentage']}%")
assert stats_2['sections']['math']['total'] == stats_0['sections']['math']['total'] + 1

# Step 3: Submit Reading Question Study Log (Mode 3)
read_q = ReadingPassage.objects.first().questions.first()
print(f"\n[Mode 3: Reading] Submitting attempt for Reading Question ID {read_q.id} - is_correct=False, seconds=45")
read_res = client.post('/api/study-logs/', {
    'item_type': 'QUESTION',
    'section': 'READ',
    'question': read_q.id,
    'is_correct': False,
    'seconds_spent': 45
}, format='json')
assert read_res.status_code == 201, f"Expected 201, got {read_res.status_code}"
print("-> Reading StudyLog successfully created:", read_res.data['id'])

stats_3 = client.get('/api/dashboard/stats/').data
print(f"-> Updated Reading Attempts: {stats_3['sections']['reading']['total']}, Reading Accuracy: {stats_3['sections']['reading']['accuracy_percentage']}%")
assert stats_3['sections']['reading']['total'] == stats_0['sections']['reading']['total'] + 1

# Step 4: Check Root Mastery Index
print("\n[Root Mastery Verification]")
root_item = next(r for r in stats_3['root_mastery'] if r['id'] == test_word.root.id)
print(f"Root: {root_item['morpheme']} ({root_item['language']}) - Mastery: {root_item['mastery_percentage']}%, Attempts: {root_item['attempts']}")
print(f"Mastered Words in Root: {root_item['mastered_words']}/{root_item['total_words']}")

print("\n" + "=" * 60)
print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("=" * 60)
