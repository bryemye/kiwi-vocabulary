import json
import os
import tempfile
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from kiwi_vocab.models import Root, VocabularyWord
from kiwi_vocab.review_utils import normalize_review_history

User = get_user_model()


class KiwiVocabTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.root = Root.objects.create(
            morpheme='chron',
            language='Greek',
            core_meaning='time',
            mnemonic='chronometer',
            thematic_cluster='Cognition',
            sat_tier='Tier 1 High-Yield'
        )
        self.word1 = VocabularyWord.objects.create(
            word='anachronism',
            root=self.root,
            prefix='ana-',
            suffix='-ism',
            definition='A thing belonging to a period other than that in which it exists.',
            sat_sentence='A grandfather clock in a spaceship was an anachronism.'
        )
        self.word2 = VocabularyWord.objects.create(
            word='chronic',
            root=self.root,
            definition='Persisting for a long time or constantly recurring.',
            sat_sentence='He suffered from chronic fatigue.'
        )

    def test_vocab_roots_endpoint(self):
        res = self.client.get('/api/vocab/roots/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['morpheme'], 'chron')
        self.assertEqual(res.data[0]['thematic_cluster'], 'Cognition')
        self.assertEqual(res.data[0]['sat_tier'], 'Tier 1 High-Yield')
        self.assertEqual(len(res.data[0]['words']), 2)

    def test_vocab_roots_filtering_by_cluster_and_tier(self):
        res_cluster = self.client.get('/api/vocab/roots/?cluster=Cognition')
        self.assertEqual(res_cluster.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cluster.data), 1)

        res_wrong_cluster = self.client.get('/api/vocab/roots/?cluster=Motion%20%26%20Travel')
        self.assertEqual(res_wrong_cluster.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_wrong_cluster.data), 0)

        res_tier = self.client.get('/api/vocab/roots/?tier=Tier 1 High-Yield')
        self.assertEqual(res_tier.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_tier.data), 1)

    def test_vocab_words_endpoint(self):
        res = self.client.get('/api/vocab/words/?search=chronic')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['word'], 'chronic')

    def test_vocab_session_endpoint(self):
        res = self.client.get('/api/vocab/session/?count=5')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)  # 2 words exist, both returned

    def test_vocab_daily_guest_session_endpoint(self):
        res1 = self.client.get('/api/vocab/session/?daily=1&date=2026-11-09')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res1.data) > 0)
        # Deterministic: Same date yields same word sequence
        res2 = self.client.get('/api/vocab/session/?daily=1&date=2026-11-09')
        self.assertEqual([w['id'] for w in res1.data], [w['id'] for w in res2.data])

    def test_vocab_stats_endpoint(self):
        res = self.client.get('/api/vocab/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_roots'], 1)
        self.assertEqual(res.data['total_words'], 2)

    def test_additional_root_origins_validation_and_filtering(self):
        french_root = Root.objects.create(
            morpheme='parl',
            language='Old French',
            core_meaning='speak',
        )
        french_root.full_clean()
        german_root = Root.objects.create(
            morpheme='wander',
            language='German',
            core_meaning='roam',
        )
        german_root.full_clean()

        res_french = self.client.get('/api/vocab/roots/?language=French')
        self.assertEqual(res_french.status_code, status.HTTP_200_OK)
        self.assertEqual([r['morpheme'] for r in res_french.data], ['parl'])

        res_german = self.client.get('/api/vocab/roots/?language=German')
        self.assertEqual(res_german.status_code, status.HTTP_200_OK)
        self.assertEqual([r['morpheme'] for r in res_german.data], ['wander'])

    def test_word_mnemonic_patch_and_serialization(self):
        # Default empty mnemonic is exposed on word and nested root endpoints
        res_get = self.client.get(f'/api/vocab/words/{self.word1.id}/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data['mnemonic'], '')
        self.assertEqual(res_get.data['root_details']['mnemonic'], 'chronometer')

        # Non-staff user cannot update word mnemonic
        regular_user = User.objects.create_user(username='student', password='pw')
        self.client.force_authenticate(user=regular_user)
        res_forbidden = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {'mnemonic': 'Should not work'},
            format='json'
        )
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # Staff user can set and clear word-specific mnemonic
        staff_user = User.objects.create_user(username='editor', password='pw', is_staff=True)
        self.client.force_authenticate(user=staff_user)
        res_patch = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {'mnemonic': 'A wristwatch in ancient Rome = out of time'},
            format='json'
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['mnemonic'], 'A wristwatch in ancient Rome = out of time')
        self.word1.refresh_from_db()
        self.assertEqual(self.word1.mnemonic, 'A wristwatch in ancient Rome = out of time')

        # Clearing mnemonic restores empty string so frontend falls back to root mnemonic
        res_clear = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {'mnemonic': ''},
            format='json'
        )
        self.assertEqual(res_clear.status_code, status.HTTP_200_OK)
        self.assertEqual(res_clear.data['mnemonic'], '')
        self.word1.refresh_from_db()
        self.assertEqual(self.word1.mnemonic, '')

    def test_verification_history_tracks_timestamps_across_transitions(self):
        staff_user = User.objects.create_user(
            username='reviewer',
            email='reviewer@kiwi.edu',
            password='pw',
            is_staff=True,
        )
        self.client.force_authenticate(user=staff_user)

        # 1. Verify word without explicit history array -> backend records timestamped entry
        res_verify = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {
                'review': {
                    'verified': True,
                    'verifiedBy': 'Dr. Lin',
                    'notes': 'Checked against OED.',
                }
            },
            format='json',
        )
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        rev1 = res_verify.data['review']
        self.assertTrue(rev1['verified'])
        self.assertIsNotNone(rev1['verifiedAt'])
        self.assertEqual(len(rev1['history']), 1)
        self.assertEqual(rev1['history'][0]['action'], 'verified')
        self.assertEqual(rev1['history'][0]['by'], 'Dr. Lin')
        self.assertEqual(rev1['history'][0]['notes'], 'Checked against OED.')
        first_timestamp = rev1['history'][0]['timestamp']

        # 2. Unverify word -> verifiedAt cleared, previous verification remains in history
        res_unverify = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {
                'review': {
                    'verified': False,
                    'verifiedBy': 'Dr. Lin',
                    'notes': 'Needs updated SAT sentence.',
                }
            },
            format='json',
        )
        self.assertEqual(res_unverify.status_code, status.HTTP_200_OK)
        rev2 = res_unverify.data['review']
        self.assertFalse(rev2['verified'])
        self.assertIsNone(rev2['verifiedAt'])
        self.assertEqual(len(rev2['history']), 2)
        self.assertEqual(rev2['history'][0]['action'], 'unverified')
        self.assertFalse(rev2['history'][0]['verified'])
        self.assertEqual(rev2['history'][1]['action'], 'verified')
        self.assertEqual(rev2['history'][1]['timestamp'], first_timestamp)

        # 3. Edit definition and re-verify -> records edited_and_verified entry
        res_reverify = self.client.patch(
            f'/api/vocab/words/{self.word1.id}/',
            {
                'definition': 'An object or custom belonging to a different historical period.',
                'review': {
                    'verified': True,
                    'verifiedBy': 'Dr. Lin',
                    'notes': 'Clarified SAT definition.',
                },
            },
            format='json',
        )
        self.assertEqual(res_reverify.status_code, status.HTTP_200_OK)
        rev3 = res_reverify.data['review']
        self.assertTrue(rev3['verified'])
        self.assertEqual(len(rev3['history']), 3)
        self.assertEqual(rev3['history'][0]['action'], 'edited_and_verified')
        self.assertIn('definition', rev3['history'][0]['summary'])

    def test_verification_history_merges_legacy_and_client_entries_without_duplicates(self):
        # Seed legacy review lacking a history array
        self.word2.review = {
            'verified': True,
            'verifiedAt': '2026-10-01T12:00:00+00:00',
            'verifiedBy': 'Legacy Editor',
            'notes': 'Initial seed verification.',
        }
        self.word2.save()

        legacy_normalized = normalize_review_history(self.word2.review)
        self.assertEqual(len(legacy_normalized), 1)
        self.assertEqual(legacy_normalized[0]['timestamp'], '2026-10-01T12:00:00+00:00')

        staff_user = User.objects.create_user(username='editor2', password='pw', is_staff=True)
        self.client.force_authenticate(user=staff_user)

        client_entry = {
            'id': 'client-evt-1',
            'action': 'attestation_updated',
            'verified': True,
            'timestamp': '2026-11-14T21:00:00+00:00',
            'by': 'Editor Two',
            'notes': 'Confirmed Greek root chron.',
            'summary': 'Updated editorial attestation',
        }
        res = self.client.patch(
            f'/api/vocab/words/{self.word2.id}/',
            {
                'review': {
                    'verified': True,
                    'verifiedAt': '2026-11-14T21:00:00+00:00',
                    'verifiedBy': 'Editor Two',
                    'notes': 'Confirmed Greek root chron.',
                    'history': [client_entry],
                }
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        history = res.data['review']['history']
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]['id'], 'client-evt-1')
        self.assertEqual(history[1]['by'], 'Legacy Editor')

        # Re-sending the same client entry does not duplicate it
        res_dup = self.client.patch(
            f'/api/vocab/words/{self.word2.id}/',
            {
                'review': {
                    'verified': True,
                    'verifiedAt': '2026-11-14T21:00:00+00:00',
                    'verifiedBy': 'Editor Two',
                    'notes': 'Confirmed Greek root chron.',
                    'history': [client_entry],
                }
            },
            format='json',
        )
        self.assertEqual(res_dup.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_dup.data['review']['history']), 2)

    def test_export_vocab_seed_preserves_history_when_unverified(self):
        self.word1.review = {
            'verified': False,
            'verifiedAt': None,
            'verifiedBy': 'Admin',
            'notes': '',
            'history': [
                {
                    'id': 'vh-unverify-1',
                    'action': 'unverified',
                    'verified': False,
                    'timestamp': '2026-11-14T20:00:00+00:00',
                    'by': 'Admin',
                    'notes': '',
                    'summary': 'Marked as unverified',
                }
            ],
        }
        self.word1.save()

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, 'seed_out.json')
            call_command('export_vocab_seed', file=out_path)
            with open(out_path, 'r', encoding='utf-8') as f:
                exported = json.load(f)

        words_by_name = {w['word']: w for r in exported for w in r['words']}
        self.assertIn('review', words_by_name['anachronism'])
        self.assertEqual(len(words_by_name['anachronism']['review']['history']), 1)
