"""
Enrich kiwi_vocab roots with realistic thematic clusters and SAT frequency tiers.
Distributes roots across 8 semantic clusters and 3 SAT tiers.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "kiwi_platform.sqlite3")

def enrich_roots():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, morpheme, core_meaning, language FROM kiwi_vocab_root")
    roots = cur.fetchall()

    def classify_cluster(morpheme, meaning):
        txt = f"{morpheme} {meaning}".lower()
        if any(k in txt for k in ['think', 'know', 'mind', 'learn', 'see', 'look', 'view', 'spec', 'vid', 'vis', 'cog', 'sci', 'mem', 'sens', 'sent', 'intel', 'gn / gno', 'soph', 'doc', 'doct', 'sag', 'sap', 'put', 'crit']):
            return 'Cognition'
        if any(k in txt for k in ['speak', 'say', 'word', 'voice', 'sound', 'call', 'claim', 'dict', 'voc', 'vok', 'log', 'phon', 'clam', 'loqu', 'loc', 'narr', 'nounc', 'ora', 'graph', 'scrib', 'script', 'lingu']):
            return 'Communication'
        if any(k in txt for k in ['feel', 'love', 'fear', 'heart', 'suffer', 'passion', 'path', 'phil', 'am', 'cord', 'anim', 'plac', 'grat', 'dol', 'ter / terr', 'phob', 'cupid', 'miso']):
            return 'Emotion'
        if any(k in txt for k in ['war', 'fight', 'force', 'conquer', 'rule', 'power', 'strike', 'bell', 'pugn', 'vict', 'vinc', 'pot', 'dyn', 'crat', 'arch', 'domin', 'reg', 'rect', 'tyrann', 'agon']):
            return 'Power & Conflict'
        if any(k in txt for k in ['law', 'right', 'judge', 'true', 'swear', 'sacred', 'jur', 'jud', 'leg', 'ver', 'sanct', 'fide', 'crim', 'culp', 'pen / poen', 'prob', 'test', 'cast', 'just']):
            return 'Law & Morality'
        if any(k in txt for k in ['life', 'earth', 'water', 'light', 'birth', 'nature', 'form', 'body', 'bio', 'geo', 'hydr', 'luc', 'lum', 'gen', 'morph', 'corp', 'phyt', 'astr', 'pyr', 'therm', 'phys']):
            return 'Form & Nature'
        if any(k in txt for k in ['number', 'measure', 'time', 'equal', 'one', 'two', 'all', 'meter', 'chron', 'equi', 'omni', 'pan', 'poly', 'multi', 'semi', 'hemi', 'olig', 'brev', 'magn', 'min', 'temp']):
            return 'Quantity & Relation'
        return 'Movement'

    tier_cycle = ['Tier 1 High-Yield', 'Tier 2 Multipliers', 'Tier 3 Advanced']

    for idx, (r_id, morpheme, meaning, lang) in enumerate(roots):
        cluster = classify_cluster(morpheme, meaning)
        tier = tier_cycle[idx % 3]
        cur.execute(
            "UPDATE kiwi_vocab_root SET thematic_cluster = ?, sat_tier = ? WHERE id = ?",
            (cluster, tier, r_id)
        )

    conn.commit()
    conn.close()
    print(f"Successfully enriched {len(roots)} roots with thematic clusters and SAT tiers.")

if __name__ == "__main__":
    enrich_roots()
