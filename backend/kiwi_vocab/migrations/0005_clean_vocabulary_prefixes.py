from django.db import migrations
import re


def _classify_prefix(w, morpheme_str, p):
    w = w.strip().lower()
    p = p.strip()
    if not p:
        return None
    variants = [v.strip().lower() for v in re.split(r'[/,]', morpheme_str) if v.strip()]

    # 1. Handle composite prefixes with '+'
    if '+' in p:
        parts = [part.strip() for part in p.split('+')]
        first = parts[0]
        m_first = re.match(r'^([a-zA-Z]+)[- ]?', first)
        first_tok = m_first.group(1).lower() if m_first else ''
        if any(first_tok == v or (len(v) >= 3 and first_tok.startswith(v)) for v in variants):
            return ''

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
            return ' + '.join(parts[:-1]).strip()
        else:
            return None

    # Single prefix
    m = re.match(r'^([a-zA-Z]+)[- ]?', p)
    if not m:
        return None
    pt = m.group(1).lower()

    # 2. Check if word starts directly with root morpheme (index 0)
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and w.startswith(v):
            return ''
        elif len(v) == 2 and w.startswith(v) and len(w) <= 5:
            return ''

    # 3. Exact match with any root variant
    if any(pt == v for v in variants):
        return ''

    # 4. Prefix starts with root variant
    for v in sorted(variants, key=len, reverse=True):
        if len(v) >= 3 and pt.startswith(v):
            return ''

    return None


def clean_vocabulary_prefixes(apps, schema_editor):
    VocabularyWord = apps.get_model('kiwi_vocab', 'VocabularyWord')

    words_to_update = []
    for word_obj in VocabularyWord.objects.select_related('root').all():
        root_morpheme = word_obj.root.morpheme if word_obj.root else ''
        new_prefix = _classify_prefix(word_obj.word, root_morpheme, word_obj.prefix)
        if new_prefix is not None:
            word_obj.prefix = new_prefix
            words_to_update.append(word_obj)

    if words_to_update:
        VocabularyWord.objects.bulk_update(words_to_update, ['prefix'])
        print(f"Migration: cleaned prefixes for {len(words_to_update)} vocabulary words.")


def reverse_clean_vocabulary_prefixes(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0004_clean_vocabulary_suffixes'),
    ]

    operations = [
        migrations.RunPython(clean_vocabulary_prefixes, reverse_clean_vocabulary_prefixes),
    ]
