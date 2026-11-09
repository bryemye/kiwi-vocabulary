"""
Kiwi Vocab Etymological & Morphological Integrity Audit System.

Scans the vocabulary database and fixtures for:
1. Words that do not contain any variant of their assigned root morpheme.
2. Words whose genuine root is already in the database under another Root object (Candidate Reassignments).
3. Words whose genuine root is entirely missing from the system (Missing Root Families).
4. Errant/artificial affix notes that attempt to justify a misallocated root.
5. Allomorphic / historical sound shifts (e.g. Latin vowel changes or French cognates).

Usage:
    python scripts/audit_vocab_integrity.py
    python scripts/audit_vocab_integrity.py --details
    python scripts/audit_vocab_integrity.py --json audit_report.json
"""

import os
import sys
import re
import argparse
import json
import django

# Setup Django environment
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from kiwi_vocab.models import Root, VocabularyWord

# Known legitimate historical allomorphs and Romance phonetic shifts
KNOWN_SOUND_SHIFTS = {
    # word -> (expected_root_contains, explanation)
    "consecrate": ("sacr", "Latin vowel weakening: sacr -> secr (con- + sacrare -> consecrare)"),
    "desecrate": ("sacr", "Latin vowel weakening: sacr -> secr (de- + sacrare -> desecrare)"),
    "ascension": ("scend", "Phonological simplification: scend + tion -> ascension"),
    "torment": ("tort", "Latin contraction: torquere/tortum -> tormentum"),
    "premise": ("mit", "Latin participle: mittere -> missa / praemissa"),
    "confound": ("fus", "Via Anglo-Norman confondre < Latin confundere (fus/fund)"),
    "strain": ("string", "Old French estreindre < Latin stringere (string/strict)"),
    "ponderous": ("pend", "Latin pondus/ponderis (weight), cognate to pendere (to hang/weigh)"),
    "cinema": ("kin", "Truncation from cinematography < Greek kinema (kin/kinet)"),
    "emblem": ("bol", "Greek emblema < emballein (ball/bol: throw/put in)"),
    "parable": ("bol", "Greek parabole < paraballein (ball/bol: throw beside, compare)"),
    "problem": ("bol", "Greek problema < proballein (ball/bol: throw forward)"),
    "reminisce": ("mem", "Latin reminisci (mem/mne: recall to mind)"),
    "contiguous": ("tact", "Latin contiguus < contingere (tact/tang/ting)"),
    "savor": ("sap", "Old French savor < Latin sapere (sap/sag: taste/sense)"),
    "savory": ("sap", "Old French savouree < Latin sapere (sap/sag: taste/sense)"),
    "insipid": ("sap", "Latin insipidus < in- + sapere (vowel shift sap -> sip)"),
    "somber": ("umbr", "French sombre < Latin sub-umbrare (umbr: shadow)"),
    "courage": ("cord", "Old French corage < Latin cor/cordis (cord/card: heart)"),
    "creed": ("cred", "Old English creda < Latin credo (cred: believe)"),
    "benign": ("bene", "Latin benignus < bene + genus (bene: well-born)"),
    "bountiful": ("bene", "Old French bonte < Latin bonitas (bene/bon)"),
    "appease": ("pac", "Anglo-French apeser < Latin ad-pacare (pac/peac: peace)"),
    "pliant": ("plic", "Old French plier < Latin plicare (plic/plex/ply: fold/bend)"),
    "brief": ("brev", "Old French brief < Latin brevis (brev: short)"),
    "briefness": ("brev", "Derivative of brief < Latin brevis (brev: short)"),
    "grief": ("grav", "Old French grief < Latin gravare (grav/griev: heavy)"),
    "vanquish": ("vinc", "Anglo-French vainquir < Latin vincere (vinc/vict: conquer)"),
    "cloister": ("clud", "Old French cloistre < Latin claustrum (clud/clus/claus: shut)"),
    "complaisant": ("plac", "French complaisant < Latin complacere (plac/placat: please)"),
    "amble": ("ambul", "Old French ambler < Latin ambulare (ambul: walk)"),
    "preamble": ("ambul", "Medieval Latin praeambulum < ambulare (ambul: walk)"),
    "poignant": ("pung", "Old French poignant < Latin pungere (pung/punct: prick/sting)"),
    "clairvoyance": ("clar", "French clair (clar: clear) + voyance (see)"),
    "exult": ("sal", "Latin exsilire / exsultare < salire (sal/sil/sult: leap)"),
    "assail": ("sal", "Old French asaillir < Latin assilire < salire (sal/sil/sult: leap)"),
    "quarrel": ("queri", "Old French querele < Latin querela < queri (queri/querul: complain)"),
    "quarrelsome": ("queri", "Derivative of quarrel < Latin queri (queri/querul)"),
    "rebel": ("bell", "Latin rebellare < re- + bellum (bell: war, single 'l' in English verb)"),
}


def parse_morpheme_variants(morpheme_str):
    """Splits 'cur / curs / cour' into ['cur', 'curs', 'cour']."""
    return [v.strip().lower() for v in re.split(r'[/,]', morpheme_str) if v.strip()]


def run_audit():
    all_roots = list(Root.objects.all())
    root_variant_map = {}
    for r in all_roots:
        variants = parse_morpheme_variants(r.morpheme)
        for v in variants:
            if len(v) >= 3:
                root_variant_map.setdefault(v, []).append(r)

    all_words = VocabularyWord.objects.select_related("root").all()

    category_reassignments = []
    category_missing_roots = []
    category_sound_shifts = []
    category_suspicious_affixes = []

    for word_obj in all_words:
        w_clean = word_obj.word.lower().strip()
        assigned_root = word_obj.root
        assigned_variants = parse_morpheme_variants(assigned_root.morpheme)

        # 1. Does word contain any variant of its assigned root?
        has_direct_variant = any(
            v in w_clean for v in assigned_variants if len(v) >= 2
        )

        if has_direct_variant:
            continue

        # Check known legitimate sound shifts
        if w_clean in KNOWN_SOUND_SHIFTS:
            expected_stem, reason = KNOWN_SOUND_SHIFTS[w_clean]
            category_sound_shifts.append({
                "word": w_clean,
                "assigned_root": assigned_root.morpheme,
                "reason": reason,
                "review": word_obj.review,
            })
            continue

        # Check if the word contains a variant of ANOTHER root already in the system
        candidate_matches = []
        for variant_stem, matched_roots in root_variant_map.items():
            if variant_stem in w_clean:
                for mr in matched_roots:
                    if mr.id != assigned_root.id and mr not in candidate_matches:
                        candidate_matches.append(mr)

        # Check if prefix or suffix has an artificial embedded stem (e.g. '+ klyzein', '-cumb')
        affix_text = f"{word_obj.prefix} {word_obj.suffix}".lower()
        has_forced_affix = any(
            hint in affix_text for hint in ["+", "(", ")", "meaning", "wash", "story", "silly", "view"]
        )

        item = {
            "word": w_clean,
            "assigned_root": f"{assigned_root.morpheme} (id: {assigned_root.id})",
            "prefix": word_obj.prefix,
            "suffix": word_obj.suffix,
            "definition": word_obj.definition,
            "review": word_obj.review,
            "candidate_roots": [f"{cr.morpheme} (id: {cr.id})" for cr in candidate_matches],
        }

        if candidate_matches:
            category_reassignments.append(item)
        else:
            category_missing_roots.append(item)

        if has_forced_affix:
            category_suspicious_affixes.append(item)

    return {
        "total_words_audited": len(all_words),
        "total_roots_audited": len(all_roots),
        "reassignments_found": category_reassignments,
        "missing_roots_found": category_missing_roots,
        "known_sound_shifts": category_sound_shifts,
        "suspicious_affixes": category_suspicious_affixes,
    }


def main():
    parser = argparse.ArgumentParser(description="Audit vocabulary etymological integrity.")
    parser.add_argument("--details", action="store_true", help="Print detailed list of flagged words.")
    parser.add_argument("--json", type=str, default="", help="Path to write JSON audit report.")
    args = parser.parse_args()

    print("=" * 80)
    print(" KIWI VOCABULARY ETYMOLOGICAL & MORPHOLOGICAL AUDIT")
    print("=" * 80)

    report = run_audit()

    print(f"Total Roots Audited : {report['total_roots_audited']}")
    print(f"Total Words Audited : {report['total_words_audited']}")
    print("-" * 80)
    print(f"1. Candidate Reassignments (Word fits another existing Root) : {len(report['reassignments_found'])}")
    print(f"2. Missing Root Families (Word's genuine root not in system) : {len(report['missing_roots_found'])}")
    print(f"3. Valid Historical Allomorphs & Sound Shifts               : {len(report['known_sound_shifts'])}")
    print(f"4. Suspicious / Forced Affix Justifications                 : {len(report['suspicious_affixes'])}")
    print("=" * 80)

    if args.details:
        if report["reassignments_found"]:
            print("\n[CATEGORY 1: CANDIDATE REASSIGNMENTS TO EXISTING ROOTS]")
            for r in report["reassignments_found"]:
                cand_str = ", ".join(r["candidate_roots"]) if r["candidate_roots"] else "None"
                print(f"  * WORD: {r['word'].upper()}")
                print(f"    Current Root  : {r['assigned_root']}")
                print(f"    Candidate Root: {cand_str}")
                print(f"    Definition    : {r['definition']}")
                print()

        if report["missing_roots_found"]:
            print("\n[CATEGORY 2: UNLISTED / MISSING ROOTS]")
            for m in report["missing_roots_found"]:
                print(f"  * WORD: {m['word'].upper()}")
                print(f"    Assigned Root : {m['assigned_root']}")
                print(f"    Prefix / Suffix: '{m['prefix']}' / '{m['suffix']}'")
                print(f"    Definition    : {m['definition']}")
                print()

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\nWrote full audit JSON to: {args.json}")


if __name__ == "__main__":
    main()
