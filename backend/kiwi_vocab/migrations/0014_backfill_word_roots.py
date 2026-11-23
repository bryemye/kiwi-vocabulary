from django.db import migrations


def backfill_word_roots(apps, schema_editor):
    VocabularyWord = apps.get_model('kiwi_vocab', 'VocabularyWord')
    WordRoot = apps.get_model('kiwi_vocab', 'WordRoot')

    entries = []
    for word in VocabularyWord.objects.exclude(root_id__isnull=True).iterator():
        entries.append(WordRoot(word_id=word.id, root_id=word.root_id, order=0))

    if entries:
        WordRoot.objects.bulk_create(entries, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0013_vocabularyword_prefix_root_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_word_roots, migrations.RunPython.noop),
    ]
