from django.db import migrations
import re


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


def _classify_suffix(w, morpheme_str, s):
    w = w.strip().lower()
    s = s.strip()
    if not s:
        return None
    m = re.match(r'^-?([a-zA-Z]+)', s)
    if not m:
        return None
    st = m.group(1).lower()
    variants = [v.strip().lower() for v in re.split(r'[/,]', morpheme_str) if v.strip()]
    if any(st == v for v in variants):
        return ''
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and st.startswith(v):
            remainder = st[len(v):]
            if not remainder or remainder in ['e', 'um', 'us', 'a', 'ia', 'y']:
                return ''
            if remainder in STANDARD_SUFFIXES:
                return STANDARD_SUFFIXES[remainder]
    if st in REAL_SUFFIX_TOKENS:
        return None
    for v in variants:
        if len(st) >= 2 and (st in v or (len(v) >= 3 and v[:2] == st[:2])):
            if w.endswith(st) and st not in REAL_SUFFIX_TOKENS:
                return ''
    return None


def clean_vocabulary_suffixes(apps, schema_editor):
    VocabularyWord = apps.get_model('kiwi_vocab', 'VocabularyWord')
    
    words_to_update = []
    for word_obj in VocabularyWord.objects.select_related('root').all():
        root_morpheme = word_obj.root.morpheme if word_obj.root else ''
        new_suffix = _classify_suffix(word_obj.word, root_morpheme, word_obj.suffix)
        if new_suffix is not None:
            word_obj.suffix = new_suffix
            words_to_update.append(word_obj)

    if words_to_update:
        VocabularyWord.objects.bulk_update(words_to_update, ['suffix'])
        print(f"Migration: cleaned suffixes for {len(words_to_update)} vocabulary words.")


def reverse_clean_vocabulary_suffixes(apps, schema_editor):
    # Data cleanup migration is intentionally non-reversible
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0003_root_sat_tier_root_thematic_cluster'),
    ]

    operations = [
        migrations.RunPython(clean_vocabulary_suffixes, reverse_clean_vocabulary_suffixes),
    ]
