from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from kiwi_vocab.models import Root, VocabularyWord


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

        res_wrong_cluster = self.client.get('/api/vocab/roots/?cluster=Movement')
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
