"""
Programmatic Vocabulary Suffix Cleanup Script for Kiwi Learning.

Cleans up words where:
1. Words without a suffix have the root morpheme repeated as the suffix
   (e.g., 'abstract' with '-tract', 'digress' with '-gress', 'disrupt' with '-rupt')
   -> Suffix is cleared to "" (empty string).
2. Words with a legitimate suffix that had the root prepended to it
   (e.g., 'hyperkinetic' with '-kinetic', 'suicidal' with '-cidal')
   -> Suffix is corrected to the genuine affix (e.g. '-ic (adjective)', '-al (adjective)').

Usage:
  python scripts/clean_vocab_suffixes.py --dry-run
  python scripts/clean_vocab_suffixes.py --apply
"""

import os
import sys
import json
import sqlite3
import argparse
import re

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FIXTURE_PATHS = [
    os.path.join(PROJECT_ROOT, "backend", "kiwi_vocab", "fixtures", "sat_vocab_seed.json"),
    os.path.join(PROJECT_ROOT, "backend", "core", "fixtures", "sat_vocab_seed.json"),
    os.path.join(PROJECT_ROOT, "core", "fixtures", "sat_vocab_seed.json"),
]

DB_PATHS = [
    os.path.join(PROJECT_ROOT, "backend", "kiwi_platform.sqlite3"),
    os.path.join(PROJECT_ROOT, "backend", "db.sqlite3"),
]

# Standard genuine English affixes
STANDARD_SUFFIXES = {
    'tion': '-tion (noun)',
    'ation': '-ation (noun)',
    'ition': '-ition (noun)',
    'sion': '-sion (noun)',
    'ion': '-ion (noun)',
    'able': '-able (adjective)',
    'ible': '-ible (adjective)',
    'ive': '-ive (adjective)',
    'itive': '-itive (adjective)',
    'ative': '-ative (adjective)',
    'ous': '-ous (adjective)',
    'ious': '-ious (adjective)',
    'eous': '-eous (adjective)',
    'ity': '-ity (noun)',
    'ty': '-ty (noun)',
    'ate': '-ate (verb)',
    'ize': '-ize (verb)',
    'ise': '-ise (verb)',
    'ify': '-ify (verb)',
    'ic': '-ic (adjective)',
    'ical': '-ical (adjective)',
    'al': '-al (adjective)',
    'ial': '-ial (adjective)',
    'ent': '-ent (adjective)',
    'ant': '-ant (adjective)',
    'ence': '-ence (noun)',
    'ance': '-ance (noun)',
    'ism': '-ism (noun)',
    'ist': '-ist (noun)',
    'ment': '-ment (noun)',
    'ure': '-ure (noun)',
    'ory': '-ory (adjective/noun)',
    'ary': '-ary (adjective/noun)',
    'ual': '-ual (adjective)',
    'ly': '-ly (adverb)',
    'ness': '-ness (noun)',
    'or': '-or (noun: agent)',
    'er': '-er (noun: agent)',
    'sis': '-sis (noun: process)',
    'ia': '-ia (noun: condition)',
}

REAL_SUFFIX_TOKENS = set(STANDARD_SUFFIXES.keys()) | {
    'e', 'y', 'is', 'itis', 'osis', 'um', 'us', 'a'
}


def classify_suffix(word_str, morpheme_str, pref_str, suff_str):
    """
    Determines if suff_str is an errant repetition of root morpheme_str.
    Returns: (action, new_suffix, reason)
      action: 'CLEAR', 'FIX', or 'KEEP'
    """
    w = word_str.strip().lower()
    s = suff_str.strip()
    
    if not s:
        return 'KEEP', s, 'already_empty'
        
    m = re.match(r'^-?([a-zA-Z]+)', s)
    if not m:
        return 'KEEP', s, 'no_token'
    st = m.group(1).lower()
    
    variants = [v.strip().lower() for v in re.split(r'[/,]', morpheme_str) if v.strip()]
    
    # 1. Exact match with any root variant
    # e.g., 'abstract' with '-tract', 'digress' with '-gress', 'disrupt' with '-rupt'
    if any(st == v for v in variants):
        return 'CLEAR', '', f'exact_root_match ({st})'
        
    # 2. Suffix starts with a root variant (>=3 chars)
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and st.startswith(v):
            remainder = st[len(v):]
            if not remainder:
                return 'CLEAR', '', f'exact_variant ({v})'
            # Inflectional or combining endings without real derivational suffix
            if remainder in ['e', 'um', 'us', 'a', 'ia', 'y']:
                return 'CLEAR', '', f'root_inflection ({v}+{remainder})'
            # Real derivational suffix attached
            if remainder in STANDARD_SUFFIXES:
                return 'FIX', STANDARD_SUFFIXES[remainder], f'root_prepended_to_suffix ({v}+{remainder})'

    # If suffix token is already a known genuine suffix, keep it
    if st in REAL_SUFFIX_TOKENS:
        return 'KEEP', s, 'valid_affix'
        
    # 3. Truncated or allomorphic root stems where the word has no suffix
    # e.g. 'concur' with '-ur', 'compel' with '-el', 'demote' with '-ote', 'convene' with '-ene'
    for v in variants:
        if len(st) >= 2 and (st in v or (len(v) >= 3 and v[:2] == st[:2])):
            if w.endswith(st) and st not in REAL_SUFFIX_TOKENS:
                return 'CLEAR', '', f'allomorphic_root ({v} -> {st})'
                
    return 'KEEP', s, 'keep'


def clean_fixtures(apply_changes=False):
    primary_fixture = None
    for p in FIXTURE_PATHS:
        if os.path.exists(p):
            primary_fixture = p
            break
            
    if not primary_fixture:
        print("No vocabulary fixture file found!")
        return {}

    with open(primary_fixture, "r", encoding="utf-8") as f:
        data = json.load(f)

    changes = {}
    stats = {'CLEAR': 0, 'FIX': 0, 'KEEP': 0}

    for cluster in data:
        root_morpheme = cluster["root"]["morpheme"]
        for word_entry in cluster.get("words", []):
            w = word_entry["word"]
            p = word_entry.get("prefix", "")
            s = word_entry.get("suffix", "")
            
            action, new_s, reason = classify_suffix(w, root_morpheme, p, s)
            stats[action] += 1
            
            if action in ('CLEAR', 'FIX'):
                changes[w.lower().strip()] = {
                    'old_suffix': s,
                    'new_suffix': new_s,
                    'root': root_morpheme,
                    'reason': reason,
                    'action': action,
                }
                if apply_changes:
                    word_entry["suffix"] = new_s

    print(f"\n--- Fixture Scan Analysis ---")
    print(f"Total words scanned: {sum(stats.values())}")
    print(f"Words to CLEAR (no suffix): {stats['CLEAR']}")
    print(f"Words to FIX (root prepended to real suffix): {stats['FIX']}")
    print(f"Words to KEEP (already correct): {stats['KEEP']}")

    if apply_changes:
        for p in FIXTURE_PATHS:
            if os.path.exists(p):
                with open(p, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"[APPLIED] Updated fixture: {p}")
                
    return changes


def clean_database(changes, apply_changes=False):
    if not changes:
        return

    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            continue
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check table name
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall()]
        
        table = None
        for candidate in ['kiwi_vocab_vocabularyword', 'core_vocabularyword']:
            if candidate in tables:
                table = candidate
                break
                
        if not table:
            conn.close()
            continue

        updated_count = 0
        for word, info in changes.items():
            if apply_changes:
                cursor.execute(
                    f"UPDATE {table} SET suffix = ? WHERE LOWER(word) = ?",
                    (info['new_suffix'], word)
                )
                if cursor.rowcount > 0:
                    updated_count += 1
            else:
                cursor.execute(
                    f"SELECT id, word, suffix FROM {table} WHERE LOWER(word) = ?",
                    (word,)
                )
                if cursor.fetchone():
                    updated_count += 1

        if apply_changes:
            conn.commit()
            print(f"[APPLIED] Database {os.path.basename(db_path)}: Updated {updated_count} rows in {table}")
        else:
            print(f"[DRY-RUN] Database {os.path.basename(db_path)}: Would update {updated_count} rows in {table}")
            
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Clean up errant suffix root repetitions.")
    parser.add_argument("--apply", action="store_true", help="Apply changes to fixtures and database.")
    parser.add_argument("--dry-run", action="store_true", help="Preview proposed changes (default).")
    args = parser.parse_args()

    apply_changes = args.apply and not args.dry_run

    mode = "APPLY (WRITING CHANGES)" if apply_changes else "DRY-RUN (PREVIEW ONLY)"
    print(f"==================================================")
    print(f" Kiwi Vocabulary Suffix Cleanup: {mode}")
    print(f"==================================================")

    changes = clean_fixtures(apply_changes=apply_changes)
    clean_database(changes, apply_changes=apply_changes)

    print("\nSample of affected words:")
    for w, info in list(changes.items())[:20]:
        action_label = "CLEARED -> ''" if info['action'] == 'CLEAR' else f"FIXED -> '{info['new_suffix']}'"
        print(f"  * {w:18} (Root: {info['root']:15}): '{info['old_suffix']}'  ==>  {action_label}")

    if not apply_changes:
        print("\n[NOTE] This was a dry run. Run with --apply to commit these updates.")


if __name__ == "__main__":
    main()
