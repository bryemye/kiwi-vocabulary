import json
import os
from django.db import migrations


def reclassify_root_sat_tiers(apps, schema_editor):
    """Update only Root.sat_tier from sat_vocab_seed.json without touching words."""
    Root = apps.get_model('kiwi_vocab', 'Root')
    if not Root.objects.exists():
        return

    fixture_path = os.path.join(
        os.path.dirname(__file__), '..', 'fixtures', 'sat_vocab_seed.json'
    )
    if not os.path.exists(fixture_path):
        return

    with open(fixture_path, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    for entry in entries:
        root_data = entry.get('root', {})
        morpheme = root_data.get('morpheme')
        sat_tier = root_data.get('sat_tier')
        if morpheme and sat_tier:
            Root.objects.filter(morpheme=morpheme).update(sat_tier=sat_tier)


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0009_reclassify_root_thematic_clusters'),
    ]

    operations = [
        migrations.RunPython(reclassify_root_sat_tiers, migrations.RunPython.noop),
    ]
