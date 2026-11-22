import json
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from kiwi_vocab.models import VocabularyWord
from kiwi_vocab.phonetics import get_cmu_dict, word_to_respelling


class Command(BaseCommand):
    help = (
        "Update ONLY the pronunciation field on VocabularyWord records (and seed fixtures) "
        "to student-friendly phonetic respellings (e.g., AW-dit)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without modifying the database or fixture files.",
        )
        parser.add_argument(
            "--skip-fixtures",
            action="store_true",
            help="Update only the database without touching sat_vocab_seed.json fixture files.",
        )

    def _fixture_paths(self) -> list[str]:
        candidates = [
            os.path.join(settings.BASE_DIR, "kiwi_vocab", "fixtures", "sat_vocab_seed.json"),
            os.path.join(settings.BASE_DIR, "core", "fixtures", "sat_vocab_seed.json"),
            os.path.join(settings.BASE_DIR, "..", "core", "fixtures", "sat_vocab_seed.json"),
        ]
        seen = set()
        paths = []
        for path in candidates:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path) and abs_path not in seen:
                seen.add(abs_path)
                paths.append(abs_path)
        return paths

    def handle(self, *args, **options):
        dry_run = bool(options.get("dry_run"))
        skip_fixtures = bool(options.get("skip_fixtures"))
        cmu_dict = get_cmu_dict()

        words = list(VocabularyWord.objects.order_by("id"))
        to_update: list[VocabularyWord] = []
        resolved_by_word: dict[str, str] = {}
        errors: list[tuple[str, str]] = []

        for vocab_word in words:
            try:
                respelling = word_to_respelling(
                    vocab_word.word,
                    existing_pronunciation=vocab_word.pronunciation,
                    cmu_dict=cmu_dict,
                )
            except Exception as exc:
                errors.append((vocab_word.word, str(exc)))
                continue

            resolved_by_word[vocab_word.word.lower().strip()] = respelling
            if vocab_word.pronunciation != respelling:
                vocab_word.pronunciation = respelling
                to_update.append(vocab_word)

        if errors:
            for w, err in errors[:10]:
                self.stderr.write(self.style.ERROR(f"Failed for {w!r}: {err}"))
            raise RuntimeError(f"Aborted: {len(errors)} word(s) could not be converted.")

        self.stdout.write(
            f"Resolved {len(words)} DB words; {len(to_update)} pronunciation field(s) to update."
        )

        if not dry_run and to_update:
            with transaction.atomic():
                VocabularyWord.objects.bulk_update(to_update, ["pronunciation"])
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated pronunciation on {len(to_update)} VocabularyWord rows (no other fields modified)."
                )
            )

        if not skip_fixtures:
            for fixture_path in self._fixture_paths():
                with open(fixture_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                fixture_updated = 0
                for entry in data:
                    for word_obj in entry.get("words", []):
                        key = word_obj["word"].lower().strip()
                        new_pron = resolved_by_word.get(key)
                        if new_pron is None:
                            new_pron = word_to_respelling(
                                word_obj["word"],
                                existing_pronunciation=word_obj.get("pronunciation", ""),
                                cmu_dict=cmu_dict,
                            )
                        if word_obj.get("pronunciation") != new_pron:
                            word_obj["pronunciation"] = new_pron
                            fixture_updated += 1

                self.stdout.write(
                    f"Fixture {fixture_path}: {fixture_updated} word pronunciation(s) to update."
                )
                if not dry_run and fixture_updated:
                    with open(fixture_path, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    self.stdout.write(self.style.SUCCESS(f"Updated fixture: {fixture_path}"))
