"""
Script to combine data_part1, data_part2, and data_part3 into a unified
SAT/ACT vocabulary seed fixture with 100+ roots and 700+ authentic words.
"""

import os
import sys
import json

# Ensure scripts directory is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
sys.path.insert(0, SCRIPT_DIR)
sys.path.insert(0, PROJECT_ROOT)

from data_part1 import ROOTS_PART1
from data_part2 import ROOTS_PART2
from data_part3 import ROOTS_PART3
try:
    from data_batch1 import ROOTS_BATCH1
except ImportError:
    ROOTS_BATCH1 = []
try:
    from data_batch2 import ROOTS_BATCH2
except ImportError:
    ROOTS_BATCH2 = []
try:
    from data_batch3 import ROOTS_BATCH3
except ImportError:
    ROOTS_BATCH3 = []
try:
    from data_batch4 import ROOTS_BATCH4
except ImportError:
    ROOTS_BATCH4 = []
try:
    from data_batch5 import ROOTS_BATCH5
except ImportError:
    ROOTS_BATCH5 = []
try:
    from data_batch6 import ROOTS_BATCH6
except ImportError:
    ROOTS_BATCH6 = []
try:
    from data_batch7 import ROOTS_BATCH7
except ImportError:
    ROOTS_BATCH7 = []
try:
    from data_batch8 import ROOTS_BATCH8
except ImportError:
    ROOTS_BATCH8 = []
try:
    from data_batch9 import ROOTS_BATCH9
except ImportError:
    ROOTS_BATCH9 = []
try:
    from data_batch10 import ROOTS_BATCH10
except ImportError:
    ROOTS_BATCH10 = []
try:
    from data_batch11 import ROOTS_BATCH11
except ImportError:
    ROOTS_BATCH11 = []
try:
    from data_batch12 import ROOTS_BATCH12
except ImportError:
    ROOTS_BATCH12 = []


def build_unified_fixture(target_paths=None):
    if target_paths is None:
        target_paths = [
            os.path.join(PROJECT_ROOT, "backend", "kiwi_vocab", "fixtures", "sat_vocab_seed.json"),
            os.path.join(PROJECT_ROOT, "backend", "core", "fixtures", "sat_vocab_seed.json"),
            os.path.join(PROJECT_ROOT, "core", "fixtures", "sat_vocab_seed.json"),
        ]

    all_parts = [ROOTS_PART1, ROOTS_PART2, ROOTS_PART3, ROOTS_BATCH1, ROOTS_BATCH2, ROOTS_BATCH3, ROOTS_BATCH4, ROOTS_BATCH5, ROOTS_BATCH6, ROOTS_BATCH7, ROOTS_BATCH8, ROOTS_BATCH9, ROOTS_BATCH10, ROOTS_BATCH11, ROOTS_BATCH12]

    combined_roots = {}
    seen_words = set()

    total_input_words = 0
    total_deduped_words = 0

    for part_idx, part_roots in enumerate(all_parts, 1):
        for root_entry in part_roots:
            root_info = root_entry["root"]
            morpheme = root_info["morpheme"].strip()

            if morpheme not in combined_roots:
                combined_roots[morpheme] = {
                    "root": root_info,
                    "words": []
                }

            for word_obj in root_entry.get("words", []):
                total_input_words += 1
                word_clean = word_obj["word"].strip().lower()

                if word_clean in seen_words:
                    # Deduplicate across the full dataset
                    continue

                seen_words.add(word_clean)
                combined_roots[morpheme]["words"].append(word_obj)
                total_deduped_words += 1

    # Format as list
    unified_data = list(combined_roots.values())

    # Write out to target fixture paths
    for path in target_paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(unified_data, f, indent=2, ensure_ascii=False)
        print(f"Successfully wrote {len(unified_data)} roots and {total_deduped_words} words to {path}")

    return unified_data, total_deduped_words


if __name__ == "__main__":
    unified_data, total_words = build_unified_fixture()
    print("=" * 60)
    print(f"BUILD SUMMARY:")
    print(f"  - Total Roots: {len(unified_data)}")
    print(f"  - Total Words: {total_words}")
    print("=" * 60)
