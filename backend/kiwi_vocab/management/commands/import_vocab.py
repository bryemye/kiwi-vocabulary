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
        roots_by_morpheme = {}
        entry_root_pairs = []

        # Pass 1: Create/update all Root records so cross-links & extra_roots can resolve
        for entry in data:
            root_data = entry["root"]
            root, created = Root.objects.update_or_create(
                morpheme=root_data["morpheme"],
                defaults={
                    "language": root_data.get("language", "Latin"),
                    "core_meaning": root_data["core_meaning"],
                    "mnemonic": root_data.get("mnemonic", ""),
                    "thematic_cluster": root_data.get("thematic_cluster", "Motion & Travel"),
                    "sat_tier": root_data.get("sat_tier", "Tier 1 High-Yield"),
                }
            )
            if created:
                roots_created += 1
            roots_by_morpheme[root.morpheme.lower().strip()] = root
            entry_root_pairs.append((root, entry.get("words", [])))

        def resolve_root_ref(ref):
            if not ref:
                return None
            key = str(ref).lower().strip()
            return roots_by_morpheme.get(key) or Root.objects.filter(morpheme__iexact=key).first()

        # Pass 2: Create/update VocabularyWord records and link ordered roots + affix roots
        for root, words in entry_root_pairs:
            for w in words:
                word_clean = w["word"].lower().strip()
                existing_word = VocabularyWord.objects.filter(word=word_clean).first()

                # Protect existing editorial reviews and word-level mnemonics on DB
                incoming_review = w.get("review") or {}
                if existing_word and existing_word.review and not incoming_review:
                    effective_review = existing_word.review
                else:
                    effective_review = incoming_review

                if existing_word and existing_word.mnemonic and "mnemonic" not in w:
                    effective_mnemonic = existing_word.mnemonic
                else:
                    effective_mnemonic = w.get("mnemonic", "")

                if "is_published" in w:
                    effective_published = bool(w["is_published"])
                elif existing_word is not None:
                    effective_published = existing_word.is_published
                else:
                    effective_published = True

                prefix_root_obj = resolve_root_ref(w.get("prefix_root"))
                suffix_root_obj = resolve_root_ref(w.get("suffix_root"))

                word_obj, w_created = VocabularyWord.objects.update_or_create(
                    word=word_clean,
                    defaults={
                        "root": root,
                        "prefix": w.get("prefix", ""),
                        "prefix_root": prefix_root_obj,
                        "suffix": w.get("suffix", ""),
                        "suffix_root": suffix_root_obj,
                        "definition": w.get("definition") or w.get("officialContextDefinition", ""),
                        "sat_sentence": w.get("sat_sentence") or w.get("examContextSentence", ""),
                        "connotation": w.get("connotation", "neutral"),
                        "pronunciation": w.get("pronunciation", ""),
                        "part_of_speech": w.get("part_of_speech") or w.get("partOfSpeech", "adjective"),
                        "mnemonic": effective_mnemonic,
                        "review": effective_review,
                        "is_published": effective_published,
                    }
                )
                extra_root_objs = [
                    r for r in (resolve_root_ref(m) for m in w.get("extra_roots", []))
                    if r is not None
                ]
                word_obj.set_ordered_roots([root, *extra_root_objs])
                if w_created:
                    words_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully synced: {roots_created} roots created, {words_created} words created/updated in kiwi_vocab."
        ))
