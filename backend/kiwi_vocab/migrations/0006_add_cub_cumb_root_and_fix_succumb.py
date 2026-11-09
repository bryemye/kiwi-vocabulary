from django.db import migrations


def add_cub_cumb_root_and_fix_words(apps, schema_editor):
    Root = apps.get_model('kiwi_vocab', 'Root')
    VocabularyWord = apps.get_model('kiwi_vocab', 'VocabularyWord')

    # If database is completely empty (e.g. running test runner creating a blank test DB),
    # data will be seeded via fixtures rather than data migration.
    if not Root.objects.exists():
        return

    # 1. Create or get the authentic 'cub / cumb' root
    cub_root, _ = Root.objects.get_or_create(
        morpheme='cub / cumb',
        defaults={
            'language': 'Latin',
            'core_meaning': 'to lie down, recline, yield',
            'mnemonic': "Think 'incumbent' (leaning on an office) or 'succumb' (yield / lie down under)",
            'thematic_cluster': 'Power & Conflict',
            'sat_tier': 'Tier 1 High-Yield',
        }
    )

    # 2. Get the 'cur / curs / cour' root
    cur_root = Root.objects.filter(morpheme__icontains='curs').first()

    # 3. Reassign 'succumb' to 'cub / cumb' without touching existing review data
    succumb_word = VocabularyWord.objects.filter(word='succumb').first()
    if succumb_word:
        succumb_word.root = cub_root
        succumb_word.prefix = 'sub- (under)'
        succumb_word.suffix = ''
        succumb_word.definition = 'To fail to resist pressure, temptation, or illness; to surrender or yield.'
        succumb_word.save(update_fields=['root', 'prefix', 'suffix', 'definition'])
        print(f"Migration: Successfully reassigned 'succumb' to root '{cub_root.morpheme}'.")
    else:
        VocabularyWord.objects.create(
            word='succumb',
            root=cub_root,
            prefix='sub- (under)',
            suffix='',
            definition='To fail to resist pressure, temptation, or illness; to surrender or yield.',
            sat_sentence='Weakened by dehydration, the explorer finally succumbed to heat exhaustion.',
            connotation='negative',
            part_of_speech='verb',
        )

    # 4. Add sibling words for 'cub / cumb' if they do not exist
    sibling_words = [
        {
            'word': 'incumbent',
            'prefix': 'in- (upon, on)',
            'suffix': '-ent (adjective)',
            'definition': 'Currently holding an office; obligatory as a moral or legal duty.',
            'sat_sentence': 'It is incumbent upon elected representatives to justify significant tax reforms to constituents.',
            'connotation': 'neutral',
            'part_of_speech': 'adjective',
        },
        {
            'word': 'recumbent',
            'prefix': 're- (back)',
            'suffix': '-ent (adjective)',
            'definition': 'Lying down, especially in a position of comfort or rest; reclining.',
            'sat_sentence': 'The museum featured a Roman marble sculpture of a recumbent nymph beside a sacred spring.',
            'connotation': 'neutral',
            'part_of_speech': 'adjective',
        },
        {
            'word': 'incubate',
            'prefix': 'in- (upon)',
            'suffix': '-ate (verb)',
            'definition': 'To maintain favorable conditions for developing; to hatch or nurture ideas slowly.',
            'sat_sentence': 'The university established an innovation accelerator to incubate promising clean-energy technologies.',
            'connotation': 'positive',
            'part_of_speech': 'verb',
        },
    ]

    for item in sibling_words:
        if not VocabularyWord.objects.filter(word=item['word']).exists():
            VocabularyWord.objects.create(
                word=item['word'],
                root=cub_root,
                prefix=item['prefix'],
                suffix=item['suffix'],
                definition=item['definition'],
                sat_sentence=item['sat_sentence'],
                connotation=item['connotation'],
                part_of_speech=item['part_of_speech'],
            )
            print(f"Migration: Created sibling word '{item['word']}' under '{cub_root.morpheme}'.")

    # 5. Backfill 'cur / curs / cour' with 'excursion' if missing
    if cur_root and not VocabularyWord.objects.filter(word='excursion').exists():
        VocabularyWord.objects.create(
            word='excursion',
            root=cur_root,
            prefix='ex- (out, outward)',
            suffix='-ion (noun)',
            definition='A short journey or trip, especially one taken for pleasure; a brief deviation from a main topic or course.',
            sat_sentence='The biology seminar included a weekend excursion to observe tidal pool biodiversity.',
            connotation='positive',
            part_of_speech='noun',
        )
        print(f"Migration: Created backfill word 'excursion' under '{cur_root.morpheme}'.")


def reverse_add_cub_cumb_root_and_fix_words(apps, schema_editor):
    Root = apps.get_model('kiwi_vocab', 'Root')
    VocabularyWord = apps.get_model('kiwi_vocab', 'VocabularyWord')

    cur_root = Root.objects.filter(morpheme__icontains='curs').first()
    succumb_word = VocabularyWord.objects.filter(word='succumb').first()
    if succumb_word and cur_root:
        succumb_word.root = cur_root
        succumb_word.save(update_fields=['root'])

    VocabularyWord.objects.filter(word__in=['incumbent', 'recumbent', 'incubate', 'excursion']).delete()
    Root.objects.filter(morpheme='cub / cumb').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0005_clean_vocabulary_prefixes'),
    ]

    operations = [
        migrations.RunPython(add_cub_cumb_root_and_fix_words, reverse_add_cub_cumb_root_and_fix_words),
    ]
