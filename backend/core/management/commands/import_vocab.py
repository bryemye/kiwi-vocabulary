import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from core.models import Root, VocabularyWord


class Command(BaseCommand):
    help = "Bulk import vocabulary words and roots from a JSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="core/fixtures/sat_vocab_seed.json",
            help="Path to vocab JSON file"
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        if not os.path.isabs(file_path):
            if not os.path.exists(file_path):
                file_path = os.path.join(settings.BASE_DIR, file_path)

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        roots_created, words_created = 0, 0

        for entry in data:
            root_data = entry["root"]
            root, created = Root.objects.get_or_create(
                morpheme=root_data["morpheme"],
                defaults={
                    "language": root_data.get("language", "Latin"),
                    "core_meaning": root_data["core_meaning"],
                    "mnemonic": root_data.get("mnemonic", "")
                }
            )
            if created:
                roots_created += 1

            for w in entry.get("words", []):
                _, w_created = VocabularyWord.objects.update_or_create(
                    word=w["word"].lower().strip(),
                    defaults={
                        "root": root,
                        "prefix": w.get("prefix", ""),
                        "suffix": w.get("suffix", ""),
                        "definition": w["definition"],
                        "sat_sentence": w["sat_sentence"],
                        "connotation": w.get("connotation", "neutral")
                    }
                )
                if w_created:
                    words_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully synced: {roots_created} roots created, {words_created} words created/updated."
        ))
