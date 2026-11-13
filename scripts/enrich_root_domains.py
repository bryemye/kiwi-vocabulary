"""
Enrich kiwi_vocab roots with balanced, accurate thematic clusters.
Distributes roots across 11 semantic clusters in both the SQLite database
and the sat_vocab_seed.json fixture files.
"""

import json
import os
import re
import sqlite3

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(REPO_ROOT, "backend", "kiwi_platform.sqlite3")
FIXTURE_PATHS = [
    os.path.join(REPO_ROOT, "backend", "kiwi_vocab", "fixtures", "sat_vocab_seed.json"),
    os.path.join(REPO_ROOT, "backend", "core", "fixtures", "sat_vocab_seed.json"),
    os.path.join(REPO_ROOT, "core", "fixtures", "sat_vocab_seed.json"),
]

# Explicit curated mapping for all 226 SAT/ACT morpheme families
CURATED_ROOT_CLUSTERS = {
    # 1. Motion & Travel (locomotion, velocity, flow, approach, departure)
    "ced / cess": "Motion & Travel",
    "cur / curs / cour": "Motion & Travel",
    "grad / gress": "Motion & Travel",
    "mot / mov": "Motion & Travel",
    "fer / lat": "Motion & Travel",
    "mit / miss": "Motion & Travel",
    "ven / vent": "Motion & Travel",
    "vad / vas": "Motion & Travel",
    "flu / flux": "Motion & Travel",
    "scend / scent": "Motion & Travel",
    "err": "Motion & Travel",
    "kin / kinet": "Motion & Travel",
    "tach / tachy": "Motion & Travel",
    "duc / duct": "Motion & Travel",
    "ambul": "Motion & Travel",
    "pet / petit": "Motion & Travel",
    "sal / sil / sult": "Motion & Travel",
    "und / unda": "Motion & Travel",
    "fug / fugit": "Motion & Travel",
    "sequ / secut": "Motion & Travel",
    "avatar": "Motion & Travel",

    # 2. Force & Transformation (push/pull, throw, break, cut, bend, make, alter)
    "tract": "Force & Transformation",
    "pel / puls": "Force & Transformation",
    "jac / ject": "Force & Transformation",
    "rupt": "Force & Transformation",
    "tort / tors": "Force & Transformation",
    "fract / frag": "Force & Transformation",
    "sec / sect / seg": "Force & Transformation",
    "fus / fund": "Force & Transformation",
    "cid / cis": "Force & Transformation",
    "vert / vers": "Force & Transformation",
    "stroph": "Force & Transformation",
    "ball / bol": "Force & Transformation",
    "mut": "Force & Transformation",
    "plic / plex / ply": "Force & Transformation",
    "lev": "Force & Transformation",
    "fac / fec / fic / fect": "Force & Transformation",
    "pung / punct": "Force & Transformation",
    "turb": "Force & Transformation",
    "flect / flex": "Force & Transformation",
    "sinu": "Force & Transformation",
    "trench / trunc": "Force & Transformation",
    "misc / mixt": "Force & Transformation",
    "solv / solu": "Force & Transformation",
    "kimiya / alchem": "Force & Transformation",

    # 3. Position & Holding (stand, sit, lie, cling, bind, seize, place, shut)
    "cliv / clin": "Position & Holding",
    "her / hes": "Position & Holding",
    "string / strict": "Position & Holding",
    "pend / pens": "Position & Holding",
    "tend / tens / tent": "Position & Holding",
    "sta / sist / stit": "Position & Holding",
    "cap / cept / cip": "Position & Holding",
    "pon / pos / posit": "Position & Holding",
    "ten / tin / tain": "Position & Holding",
    "sed / sid / sess": "Position & Holding",
    "clud / clus / claus": "Position & Holding",
    "man / manu": "Position & Holding",
    "cub / cumb": "Position & Holding",
    "apt / ept": "Position & Holding",

    # 4. Senses & Perception (sight, hearing, touch, taste, smell, light, shadow, clarity)
    "spec / spic": "Senses & Perception",
    "vid / vis": "Senses & Perception",
    "sent / sens": "Senses & Perception",
    "aud": "Senses & Perception",
    "tact / tang / ting": "Senses & Perception",
    "sap / sag": "Senses & Perception",
    "gust": "Senses & Perception",
    "olfact / odor": "Senses & Perception",
    "luc / lum / lus": "Senses & Perception",
    "umbr": "Senses & Perception",
    "cand": "Senses & Perception",
    "son": "Senses & Perception",
    "palp": "Senses & Perception",
    "clar": "Senses & Perception",
    "fulg / flagr": "Senses & Perception",
    "scintill": "Senses & Perception",
    "vig / veg": "Senses & Perception",
    "heed": "Senses & Perception",

    # 5. Cognition (knowledge, mind, memory, belief, teaching, inquiry, logic, secret)
    "cogn / gnos": "Cognition",
    "sci": "Cognition",
    "anim": "Cognition",
    "mem / mne": "Cognition",
    "cred": "Cognition",
    "fatu": "Cognition",
    "soph": "Cognition",
    "psych": "Cognition",
    "dox / dog": "Cognition",
    "crit / cris": "Cognition",
    "mon / monit": "Cognition",
    "doc / doct": "Cognition",
    "crypt / cryph": "Cognition",
    "fall / fals": "Cognition",
    "quer / quest / quir / quis": "Cognition",
    "reck": "Cognition",
    "sifr / cipher": "Cognition",
    "jabr / algor": "Cognition",
    "pandit / pundit": "Cognition",

    # 6. Communication (speech, voice, writing, names, asking, silence, omens)
    "loqu / loc": "Communication",
    "voc / vok": "Communication",
    "dict": "Communication",
    "clam / claim": "Communication",
    "phon": "Communication",
    "leg / lect / log": "Communication",
    "nom / nym": "Communication",
    "scrib / script": "Communication",
    "tac / tic": "Communication",
    "verb": "Communication",
    "queri / querul": "Communication",
    "parl": "Communication",
    "rog / rogat": "Communication",
    "vituper": "Communication",
    "gain": "Communication",
    "bode": "Communication",

    # 7. Emotion (feeling, passion, love, fear, grief, humor, rest, temperament)
    "path": "Emotion",
    "cord / card": "Emotion",
    "phil": "Emotion",
    "phob": "Emotion",
    "mania": "Emotion",
    "plac / placat": "Emotion",
    "am / amat / amor": "Emotion",
    "grat / grac": "Emotion",
    "acri / acr / acer": "Emotion",
    "pass / pati": "Emotion",
    "ferv": "Emotion",
    "torp": "Emotion",
    "trep": "Emotion",
    "quie / quit": "Emotion",
    "av / avar": "Emotion",
    "ard / ars": "Emotion",
    "nois / noie": "Emotion",
    "plaint": "Emotion",
    "dol": "Emotion",
    "lud / lus": "Emotion",
    "joc": "Emotion",
    "audac": "Emotion",
    "fret": "Emotion",
    "blithe": "Emotion",
    "ruth": "Emotion",

    # 8. Power & Conflict (war, combat, contest, rule, leadership, strength)
    "pugn / pug": "Power & Conflict",
    "bell / belli": "Power & Conflict",
    "agon": "Power & Conflict",
    "polem": "Power & Conflict",
    "pac / peac": "Power & Conflict",
    "pot / poss": "Power & Conflict",
    "val / vail": "Power & Conflict",
    "arch / archi": "Power & Conflict",
    "crat / cracy": "Power & Conflict",
    "dem / demo": "Power & Conflict",
    "vinc / vict": "Power & Conflict",
    "chev / chief": "Power & Conflict",
    "milit": "Power & Conflict",
    "juggernaut / jag": "Power & Conflict",

    # 9. Law & Morality (justice, truth, faith, ethics, sacredness, guilt, status)
    "fid": "Law & Morality",
    "bene / bon": "Law & Morality",
    "mal / mis": "Law & Morality",
    "jur / jud / just": "Law & Morality",
    "ver / veri": "Law & Morality",
    "rect": "Law & Morality",
    "theo / the": "Law & Morality",
    "prob / prov": "Law & Morality",
    "culp": "Law & Morality",
    "noc / noxi / noce": "Law & Morality",
    "pecc": "Law & Morality",
    "sanct / sacr": "Law & Morality",
    "mend": "Law & Morality",
    "lit / litig": "Law & Morality",
    "cast / chast": "Law & Morality",
    "gage / wage": "Law & Morality",
    "trai / treach": "Law & Morality",
    "franch / frank": "Law & Morality",
    "spond / spons": "Law & Morality",
    "prop / propri": "Law & Morality",
    "pariah": "Law & Morality",
    "karm / dhar": "Law & Morality",

    # 10. Form & Nature (life, body, birth, death, sleep, health, elements, texture)
    "morph": "Form & Nature",
    "gen": "Form & Nature",
    "anthrop": "Form & Nature",
    "dur": "Form & Nature",
    "mor / mort": "Form & Nature",
    "corp / corpor": "Form & Nature",
    "vor / vour": "Form & Nature",
    "bio": "Form & Nature",
    "mit / miti": "Form & Nature",
    "pyr / pyro": "Form & Nature",
    "dorm": "Form & Nature",
    "moll": "Form & Nature",
    "somn / sopor": "Form & Nature",
    "nasc / nat": "Form & Nature",
    "tenu": "Form & Nature",
    "salu / salv": "Form & Nature",
    "cal / chal": "Form & Nature",
    "ghul / ghoul": "Form & Nature",

    # 11. Quantity & Relation (time, size, degree, number, equality, spatial prefixes)
    "chron": "Quantity & Relation",
    "temp / tempor": "Quantity & Relation",
    "magn / maj": "Quantity & Relation",
    "brev": "Quantity & Relation",
    "hyper": "Quantity & Relation",
    "hypo": "Quantity & Relation",
    "auto": "Quantity & Relation",
    "anti / ant": "Quantity & Relation",
    "syn / sym": "Quantity & Relation",
    "aequ / equi": "Quantity & Relation",
    "grav / griev": "Quantity & Relation",
    "plen / plet": "Quantity & Relation",
    "vac / van / void": "Quantity & Relation",
    "nov / neo": "Quantity & Relation",
    "prim / proto": "Quantity & Relation",
    "omni": "Quantity & Relation",
    "pan": "Quantity & Relation",
    "greg": "Quantity & Relation",
    "ann / enn": "Quantity & Relation",
    "poly": "Quantity & Relation",
    "oner / onus": "Quantity & Relation",
    "di / dia": "Quantity & Relation",
    "vet / veter": "Quantity & Relation",
    "hetero": "Quantity & Relation",
    "homo / homeo": "Quantity & Relation",
    "pau / pauc": "Quantity & Relation",
    "peri": "Quantity & Relation",
    "cata": "Quantity & Relation",
    "lucr": "Quantity & Relation",
    "sur / surfeit": "Quantity & Relation",
    "parag / peer": "Quantity & Relation",
    "be-": "Quantity & Relation",
    "for / fore": "Quantity & Relation",
    "wan / wane": "Quantity & Relation",
    "samt / zenith": "Quantity & Relation",
}

# Focused 80/20 pyramid across SAT/ACT yield tiers:
# - Tier 1 High-Yield (~24%): Essential 80/20 Latin & Greek test foundation
# - Tier 2 Multipliers (~43%): High-leverage academic, scientific & literary roots
# - Tier 3 Advanced (~33%): 99th-percentile nuanced, rare & specialized roots
TIER_1_ROOTS = {
    "ced / cess", "cur / curs / cour", "grad / gress", "mot / mov", "tract",
    "fer / lat", "pel / puls", "jac / ject", "rupt", "fract / frag",
    "sec / sect / seg", "mit / miss", "ven / vent", "vert / vers", "sta / sist / stit",
    "cogn / gnos", "sci", "spec / spic", "vid / vis", "sent / sens",
    "path", "loqu / loc", "voc / vok", "dict", "aud",
    "cred", "fid", "leg / lect / log", "bene / bon", "mal / mis",
    "pot / poss", "val / vail", "mut", "morph", "gen",
    "chron", "temp / tempor", "magn / maj", "hyper", "hypo",
    "auto", "anti / ant", "syn / sym", "jur / jud / just", "ver / veri",
    "aequ / equi", "cap / cept / cip", "scrib / script", "duc / duct", "pon / pos / posit",
    "ten / tin / tain", "fac / fec / fic / fect", "bio", "poly",
}

TIER_2_ROOTS = {
    "pugn / pug", "bell / belli", "tort / tors", "vad / vas", "flu / flux",
    "fus / fund", "cid / cis", "scend / scent", "cliv / clin", "err",
    "her / hes", "string / strict", "pend / pens", "tend / tens / tent", "kin / kinet",
    "agon", "polem", "ball / bol", "anim", "mem / mne",
    "clam / claim", "phon", "tact / tang / ting", "luc / lum / lus", "cand",
    "cord / card", "soph", "phil", "phob", "psych",
    "dox / dog", "crit / cris", "nom / nym", "mon / monit", "pac / peac",
    "plic / plex / ply", "brev", "anthrop", "rect", "grav / griev",
    "lev", "plen / plet", "vac / van / void", "nov / neo", "prim / proto",
    "omni", "pan", "arch / archi", "crat / cracy", "dem / demo",
    "dur", "vinc / vict", "doc / doct", "sed / sid / sess", "greg",
    "theo / the", "clud / clus / claus", "mor / mort", "plac / placat", "am / amat / amor",
    "grat / grac", "corp / corpor", "ambul", "crypt / cryph", "acri / acr / acer",
    "fall / fals", "quer / quest / quir / quis", "tac / tic", "prob / prov", "turb",
    "ann / enn", "culp", "noc / noxi / noce", "flect / flex", "son",
    "pass / pati", "sanct / sacr", "mit / miti", "trep", "pet / petit",
    "verb", "man / manu", "clar", "sal / sil / sult", "und / unda",
    "hetero", "homo / homeo", "peri", "cata", "rog / rogat",
    "fug / fugit", "sequ / secut", "lud / lus", "nasc / nat", "apt / ept",
    "vig / veg", "solv / solu",
}

TIER_3_ROOTS = {
    "stroph", "tach / tachy", "sap / sag", "gust", "olfact / odor",
    "umbr", "fatu", "mania", "vor / vour", "pung / punct",
    "oner / onus", "pecc", "ferv", "di / dia", "torp",
    "mend", "lit / litig", "pyr / pyro", "dorm", "palp",
    "quie / quit", "sinu", "fulg / flagr", "moll", "av / avar",
    "vet / veter", "ard / ars", "queri / querul", "cast / chast", "pau / pauc",
    "scintill", "lucr", "cub / cumb", "trench / trunc", "parl",
    "chev / chief", "gage / wage", "nois / noie", "sur / surfeit", "trai / treach",
    "franch / frank", "parag / peer", "plaint", "dol", "somn / sopor",
    "spond / spons", "joc", "tenu", "vituper", "milit",
    "misc / mixt", "prop / propri", "salu / salv", "cal / chal", "audac",
    "be-", "gain", "for / fore", "bode", "heed",
    "wan / wane", "fret", "reck", "blithe", "ruth",
    "sifr / cipher", "samt / zenith", "kimiya / alchem", "jabr / algor", "ghul / ghoul",
    "pandit / pundit", "avatar", "pariah", "karm / dhar", "juggernaut / jag",
}

CURATED_ROOT_TIERS = {
    **{m: "Tier 1 High-Yield" for m in TIER_1_ROOTS},
    **{m: "Tier 2 Multipliers" for m in TIER_2_ROOTS},
    **{m: "Tier 3 Advanced" for m in TIER_3_ROOTS},
}

FALLBACK_RULES = [
    ("Motion & Travel", r"\b(walk|run|go|come|arrive|flee|escape|follow|climb|leap|wander|flow|motion|speed|swift|carry|send|lead)\b"),
    ("Force & Transformation", r"\b(pull|drag|push|drive|throw|cast|break|shatter|cut|divide|twist|bend|curve|fold|make|do|produce|change|alter|dissolve|pierce)\b"),
    ("Position & Holding", r"\b(stand|sit|lie|recline|hang|stretch|bind|stick|cling|hold|seize|keep|place|put|shut|close|slope|lean)\b"),
    ("Senses & Perception", r"\b(see|look|watch|hear|listen|touch|taste|smell|scent|sound|light|shine|glow|bright|shadow|shade|alert|watchful)\b"),
    ("Cognition", r"\b(think|know|mind|learn|memory|remember|believe|trust|wise|wisdom|teach|judge|decide|inquire|seek|ask|secret|hidden|calculate)\b"),
    ("Communication", r"\b(speak|talk|say|word|voice|call|shout|write|read|name|silent|quiet|ask|request|complain|announce)\b"),
    ("Emotion", r"\b(feel|love|fear|dread|heart|suffer|grief|sorrow|passion|joy|joke|calm|please|anger|worry|pity|eager)\b"),
    ("Power & Conflict", r"\b(war|fight|combat|force|conquer|rule|power|chief|leader|soldier|peace|strength|contest|struggle)\b"),
    ("Law & Morality", r"\b(law|right|truth|true|swear|pledge|promise|sacred|holy|god|divine|faith|guilt|blame|sin|fault|harm|betray|free)\b"),
    ("Form & Nature", r"\b(life|living|birth|born|death|die|sleep|body|flesh|health|earth|water|fire|heat|form|shape|soft|hard)\b"),
    ("Quantity & Relation", r"\b(time|year|old|new|first|number|measure|equal|same|other|all|many|few|full|empty|heavy|great|short|above|below|around|against|together)\b"),
]


def classify_cluster(morpheme, meaning):
    """Return curated cluster for known morphemes or word-boundary classification for new ones."""
    if morpheme in CURATED_ROOT_CLUSTERS:
        return CURATED_ROOT_CLUSTERS[morpheme]
    txt = f"{morpheme} {meaning}".lower()
    for cluster, pattern in FALLBACK_RULES:
        if re.search(pattern, txt):
            return cluster
    return "Form & Nature"


def classify_tier(morpheme, language):
    """Return curated SAT/ACT yield tier for known morphemes or origin-based fallback."""
    if morpheme in CURATED_ROOT_TIERS:
        return CURATED_ROOT_TIERS[morpheme]
    lang = (language or "").lower()
    if lang.startswith("latin") or lang.startswith("greek"):
        return "Tier 2 Multipliers"
    return "Tier 3 Advanced"


def enrich_database():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}; skipping SQLite update.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, morpheme, language, core_meaning FROM kiwi_vocab_root")
    roots = cur.fetchall()

    cluster_counts = {}
    tier_counts = {}

    for r_id, morpheme, language, meaning in roots:
        cluster = classify_cluster(morpheme, meaning)
        tier = classify_tier(morpheme, language)
        cluster_counts[cluster] = cluster_counts.get(cluster, 0) + 1
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
        cur.execute(
            "UPDATE kiwi_vocab_root SET thematic_cluster = ?, sat_tier = ? WHERE id = ?",
            (cluster, tier, r_id),
        )

    conn.commit()
    conn.close()
    print(f"Updated {len(roots)} roots in {DB_PATH}:")
    print("  Thematic clusters:")
    for k, v in sorted(cluster_counts.items(), key=lambda item: -item[1]):
        print(f"    {k}: {v}")
    print("  SAT yield tiers:")
    for k, v in sorted(tier_counts.items()):
        print(f"    {k}: {v}")


def sync_fixtures():
    for path in FIXTURE_PATHS:
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for entry in data:
            root_meta = entry["root"]
            root_meta["thematic_cluster"] = classify_cluster(
                root_meta["morpheme"], root_meta.get("core_meaning", "")
            )
            root_meta["sat_tier"] = classify_tier(
                root_meta["morpheme"], root_meta.get("language", "")
            )
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Synced {len(data)} fixture roots in {path}")


if __name__ == "__main__":
    enrich_database()
    sync_fixtures()
