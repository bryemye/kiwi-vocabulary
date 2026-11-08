import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from kiwi_vocab.models import Root, VocabularyWord


class Command(BaseCommand):
    help = "Bulk import vocabulary words and roots from a JSON file into kiwi_vocab"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="",
            help="Path to vocab JSON file"
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        if not file_path:
            # Look in standard locations
            candidate_paths = [
                os.path.join(settings.BASE_DIR, "kiwi_vocab", "fixtures", "sat_vocab_seed.json"),
                os.path.join(settings.BASE_DIR, "core", "fixtures", "sat_vocab_seed.json"),
                os.path.join(settings.BASE_DIR, "..", "core", "fixtures", "sat_vocab_seed.json"),
            ]
            for candidate in candidate_paths:
                if os.path.exists(candidate):
                    file_path = candidate
                    break

        if not file_path or not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"Vocabulary fixture file not found at {file_path}"))
            return

        self.stdout.write(f"Importing vocabulary from: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        roots_created, words_created = 0, 0

        for entry in data:
            root_data = entry["root"]
            root, created = Root.objects.update_or_create(
                morpheme=root_data["morpheme"],
                defaults={
                    "language": root_data.get("language", "Latin"),
                    "core_meaning": root_data["core_meaning"],
                    "mnemonic": root_data.get("mnemonic", ""),
                    "thematic_cluster": root_data.get("thematic_cluster", "Movement"),
                    "sat_tier": root_data.get("sat_tier", "Tier 1 High-Yield"),
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
                        "definition": w.get("definition") or w.get("officialContextDefinition", ""),
                        "sat_sentence": w.get("sat_sentence") or w.get("examContextSentence", ""),
                        "connotation": w.get("connotation", "neutral"),
                        "pronunciation": w.get("pronunciation", ""),
                        "part_of_speech": w.get("part_of_speech") or w.get("partOfSpeech", "adjective"),
                        "review": w.get("review", {}),
                    }
                )
                if w_created:
                    words_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully synced: {roots_created} roots created, {words_created} words created/updated in kiwi_vocab."
        ))
