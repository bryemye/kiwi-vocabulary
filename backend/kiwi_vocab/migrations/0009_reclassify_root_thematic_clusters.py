import json
import os
from django.db import migrations


def reclassify_root_clusters(apps, schema_editor):
    """Update only Root.thematic_cluster from sat_vocab_seed.json without touching words."""
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
        cluster = root_data.get('thematic_cluster')
        if morpheme and cluster:
            Root.objects.filter(morpheme=morpheme).update(thematic_cluster=cluster)


class Migration(migrations.Migration):

    dependencies = [
        ('kiwi_vocab', '0008_alter_root_thematic_cluster'),
    ]

    operations = [
        migrations.RunPython(reclassify_root_clusters, migrations.RunPython.noop),
    ]
