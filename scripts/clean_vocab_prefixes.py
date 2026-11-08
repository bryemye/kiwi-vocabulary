"""
Programmatic Vocabulary Prefix Cleanup Script for Kiwi Learning.

Cleans up words where:
1. Words without a prefix have the root morpheme repeated as the prefix
   (e.g., 'motivate' with 'mot- (move)', 'traction' with 'tract- (pull)', 'rupture' with 'rupt- (break)')
   -> Prefix is cleared to "" (empty string).
2. Words with a composite prefix where the root was bundled into the prefix with '+'
   (e.g., 'inerrant' with 'in- (not) + err- (stray)', 'direct' with 'dis- (apart) + rect- (straight)')
   -> Prefix is trimmed to just the genuine prefix (e.g. 'in- (not)', 'dis- (apart)').

Usage:
  python scripts/clean_vocab_prefixes.py --dry-run
  python scripts/clean_vocab_prefixes.py --apply
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


def classify_prefix(word_str, morpheme_str, pref_str):
    """
    Determines if pref_str is an errant repetition of root morpheme_str.
    Returns: (action, new_prefix, reason)
      action: 'CLEAR', 'FIX', or 'KEEP'
    """
    w = word_str.strip().lower()
    p = pref_str.strip()
    
    if not p:
        return 'KEEP', p, 'already_empty'
        
    variants = [v.strip().lower() for v in re.split(r'[/,]', morpheme_str) if v.strip()]
    
    # 1. Handle composite prefixes with '+'
    if '+' in p:
        parts = [part.strip() for part in p.split('+')]
        
        # Check if the FIRST part is the root (e.g. pyro- + techn- where pyro is root, or soph- + moros)
        first = parts[0]
        m_first = re.match(r'^([a-zA-Z]+)[- ]?', first)
        first_tok = m_first.group(1).lower() if m_first else ''
        if any(first_tok == v or (len(v) >= 3 and first_tok.startswith(v)) for v in variants):
            return 'CLEAR', '', f'root_is_first_in_composite ({first_tok})'
            
        # Check if the LAST part is the root or contains root (e.g. dis- + rect- (straight) where rect is root)
        last = parts[-1]
        m_last = re.match(r'^([a-zA-Z]+)[- ]?', last)
        last_tok = m_last.group(1).lower() if m_last else ''
        
        last_is_root = False
        for v in variants:
            if last_tok == v or (len(v) >= 3 and (last_tok.startswith(v) or v.startswith(last_tok))):
                last_is_root = True
                break
            if len(v) >= 3 and v in last.lower():
                last_is_root = True
                break
                
        if last_is_root:
            remaining = ' + '.join(parts[:-1]).strip()
            return 'FIX', remaining, f'trimmed_root_from_composite ({last_tok})'
        else:
            return 'KEEP', p, 'valid_double_prefix'

    # Single prefix token
    m = re.match(r'^([a-zA-Z]+)[- ]?', p)
    if not m:
        return 'KEEP', p, 'no_token'
    pt = m.group(1).lower()
    
    # 2. Check if word starts directly with root morpheme (index 0)
    # e.g., motivate (mot), traction (tract), cognitive (cogn), rupture (rupt), fragile (frag)
    # If the word starts with the root, the word has NO prefix!
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and w.startswith(v):
            return 'CLEAR', '', f'word_starts_with_root ({v})'
        elif len(v) == 2 and w.startswith(v) and len(w) <= 5: # e.g. err
            return 'CLEAR', '', f'word_starts_with_short_root ({v})'

    # 3. Exact match with any root variant
    if any(pt == v for v in variants):
        return 'CLEAR', '', f'exact_root_match ({pt})'
        
    # 4. Prefix starts with root variant (>=3 chars)
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and pt.startswith(v):
            return 'CLEAR', '', f'prefix_starts_with_root ({pt})'

    return 'KEEP', p, 'valid_prefix'


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
            
            action, new_p, reason = classify_prefix(w, root_morpheme, p)
            stats[action] += 1
            
            if action in ('CLEAR', 'FIX'):
                changes[w.lower().strip()] = {
                    'old_prefix': p,
                    'new_prefix': new_p,
                    'root': root_morpheme,
                    'reason': reason,
                    'action': action,
                }
                if apply_changes:
                    word_entry["prefix"] = new_p

    print(f"\n--- Prefix Fixture Scan Analysis ---")
    print(f"Total words scanned: {sum(stats.values())}")
    print(f"Words to CLEAR (no prefix): {stats['CLEAR']}")
    print(f"Words to FIX (trimmed root from composite): {stats['FIX']}")
    print(f"Words to KEEP (already valid prefixes): {stats['KEEP']}")

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
                    f"UPDATE {table} SET prefix = ? WHERE LOWER(word) = ?",
                    (info['new_prefix'], word)
                )
                if cursor.rowcount > 0:
                    updated_count += 1
            else:
                cursor.execute(
                    f"SELECT id, word, prefix FROM {table} WHERE LOWER(word) = ?",
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
    parser = argparse.ArgumentParser(description="Clean up errant prefix root repetitions.")
    parser.add_argument("--apply", action="store_true", help="Apply changes to fixtures and database.")
    parser.add_argument("--dry-run", action="store_true", help="Preview proposed changes (default).")
    args = parser.parse_args()

    apply_changes = args.apply and not args.dry_run

    mode = "APPLY (WRITING CHANGES)" if apply_changes else "DRY-RUN (PREVIEW ONLY)"
    print(f"==================================================")
    print(f" Kiwi Vocabulary Prefix Cleanup: {mode}")
    print(f"==================================================")

    changes = clean_fixtures(apply_changes=apply_changes)
    clean_database(changes, apply_changes=apply_changes)

    print("\nSample of affected words:")
    for w, info in list(changes.items())[:20]:
        action_label = "CLEARED -> ''" if info['action'] == 'CLEAR' else f"FIXED -> '{info['new_prefix']}'"
        print(f"  * {w:18} (Root: {info['root']:15}): '{info['old_prefix']}'  ==>  {action_label}")

    if not apply_changes:
        print("\n[NOTE] This was a dry run. Run with --apply to commit these updates.")


if __name__ == "__main__":
    main()
