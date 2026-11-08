from importlib import import_module
from django.core.management.base import BaseCommand
from kiwi_vocab.models import VocabularyWord

_mig = import_module("kiwi_vocab.migrations.0005_clean_vocabulary_prefixes")
_classify_prefix = _mig._classify_prefix


class Command(BaseCommand):
    help = "Programmatically clean vocabulary words that repeat the root morpheme as a prefix."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview proposed changes without saving."
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        mode = "DRY-RUN" if dry_run else "APPLYING"
        self.stdout.write(f"Scanning vocabulary words [{mode}]...")

        words = VocabularyWord.objects.select_related("root").all()
        to_update = []

        for word_obj in words:
            root_morpheme = word_obj.root.morpheme if word_obj.root else ""
            new_prefix = _classify_prefix(word_obj.word, root_morpheme, word_obj.prefix)
            if new_prefix is not None:
                to_update.append((word_obj, word_obj.prefix, new_prefix))

        self.stdout.write(f"Found {len(to_update)} words requiring prefix cleanup.")

        for word_obj, old_p, new_p in to_update[:15]:
            action = f"CLEARED -> ''" if new_p == "" else f"FIXED -> '{new_p}'"
            self.stdout.write(f"  * {word_obj.word:18}: '{old_p}' ==> {action}")

        if len(to_update) > 15:
            self.stdout.write(f"  ... and {len(to_update) - 15} more.")

        if not dry_run and to_update:
            updated_objs = []
            for word_obj, _, new_p in to_update:
                word_obj.prefix = new_p
                updated_objs.append(word_obj)
            VocabularyWord.objects.bulk_update(updated_objs, ["prefix"])
            self.stdout.write(self.style.SUCCESS(f"Successfully cleaned prefixes for {len(updated_objs)} words."))
        elif dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete. No database rows were modified."))
        else:
            self.stdout.write(self.style.SUCCESS("All vocabulary prefixes are already clean!"))
