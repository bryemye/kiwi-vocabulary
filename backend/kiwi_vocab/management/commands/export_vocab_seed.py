import os
import json
from django.conf import settings
from django.core.management.base import BaseCommand
from kiwi_vocab.models import Root, VocabularyWord


class Command(BaseCommand):
    help = "Export current database roots and words back into sat_vocab_seed.json fixture"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="",
            help="Path to output JSON file"
        )

    def handle(self, *args, **options):
        file_path = options.get("file")
        if not file_path:
            file_path = os.path.join(settings.BASE_DIR, "kiwi_vocab", "fixtures", "sat_vocab_seed.json")

        self.stdout.write(f"Exporting vocabulary database to fixture: {file_path}")

        roots = Root.objects.prefetch_related('words').order_by('id')
        exported_data = []

        total_words = 0
        for root in roots:
            root_dict = {
                "morpheme": root.morpheme,
                "language": root.language,
                "core_meaning": root.core_meaning,
                "mnemonic": root.mnemonic,
                "thematic_cluster": root.thematic_cluster,
                "sat_tier": root.sat_tier,
            }

            words_list = []
            for w in root.words.order_by('id'):
                total_words += 1
                word_dict = {
                    "word": w.word,
                    "prefix": w.prefix,
                    "suffix": w.suffix,
                    "definition": w.definition,
                    "sat_sentence": w.sat_sentence,
                    "connotation": w.connotation,
                }
                if w.review and (w.review.get("verified") or w.review.get("notes")):
                    word_dict["review"] = w.review
                words_list.append(word_dict)

            exported_data.append({
                "root": root_dict,
                "words": words_list
            })

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(exported_data, f, indent=2, ensure_ascii=False)

        # Also sync to core/fixtures/sat_vocab_seed.json if present
        core_fixture = os.path.join(settings.BASE_DIR, "core", "fixtures", "sat_vocab_seed.json")
        if os.path.exists(core_fixture) and os.path.abspath(core_fixture) != os.path.abspath(file_path):
            with open(core_fixture, "w", encoding="utf-8") as f:
                json.dump(exported_data, f, indent=2, ensure_ascii=False)
            self.stdout.write(f"Also synced to core fixture: {core_fixture}")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully exported {len(exported_data)} root families and {total_words} words to {file_path}."
        ))
