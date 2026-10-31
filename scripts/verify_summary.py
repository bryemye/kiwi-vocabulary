import os
import sys
import random
import django

# Setup django environment
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Root, VocabularyWord

total_roots = Root.objects.count()
total_words = VocabularyWord.objects.count()

print("\n" + "=" * 80)
print(" DATABASE INGESTION SUMMARY TABLE")
print("=" * 80)
print(f"| {'Metric':<40} | {'Count':<33} |")
print("|" + "-" * 42 + "|" + "-" * 35 + "|")
print(f"| {'Total Unique Roots in Database':<40} | {total_roots:<33} |")
print(f"| {'Total Unique Words in Database':<40} | {total_words:<33} |")
print("=" * 80)

print("\n" + "=" * 80)
print(" SAMPLE OF 5 RANDOMLY SELECTED WORDS & MORPHEME BREAKDOWN")
print("=" * 80)

random.seed(42)
all_ids = list(VocabularyWord.objects.values_list("id", flat=True))
sample_ids = random.sample(all_ids, min(5, len(all_ids)))
samples = VocabularyWord.objects.filter(id__in=sample_ids).select_related("root")

for i, word in enumerate(samples, 1):
    print(f"[{i}] WORD: {word.word.upper()}")
    print(f"    Root Morpheme : {word.root.morpheme} ({word.root.language})")
    print(f"    Root Meaning  : {word.root.core_meaning}")
    print(f"    Prefix/Suffix : Prefix: \"{word.prefix or 'None'}\" | Suffix: \"{word.suffix or 'None'}\"")
    print(f"    Definition    : {word.definition}")
    print(f"    SAT Sentence  : {word.sat_sentence}")
    print(f"    Connotation   : {word.connotation}")
    print("-" * 80)
