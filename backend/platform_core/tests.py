from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
from platform_core.models import MagicLoginToken, StudyLog
from kiwi_vocab.models import Root, VocabularyWord

User = get_user_model()


class PlatformAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_request_magic_link_new_user(self):
        email = "platform_scholar@example.com"
        response = self.client.post('/api/platform/auth/magic-link/', {'email': email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

        user = User.objects.filter(email=email).first()
        self.assertIsNotNone(user)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(len(mail.outbox), 1)

    def test_verify_magic_link(self):
        email = "verify_student@example.com"
        self.client.post('/api/platform/auth/magic-link/', {'email': email}, format='json')
        user = User.objects.get(email=email)
        token_record = MagicLoginToken.objects.filter(user=user).first()
        self.assertIsNotNone(token_record)

        response = self.client.post('/api/platform/auth/verify-magic-link/', {'token': token_record.token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], email)

        # Token is single use
        reused = self.client.post('/api/platform/auth/verify-magic-link/', {'token': token_record.token}, format='json')
        self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)


class PlatformActivityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.root = Root.objects.create(
            morpheme='spec / spic',
            language='Latin',
            core_meaning='to look at, observe',
            mnemonic='spectacles'
        )
        self.word = VocabularyWord.objects.create(
            word='circumspect',
            root=self.root,
            prefix='circum-',
            suffix='-spect',
            definition='Wary and unwilling to take risks.',
            sat_sentence='A circumspect diplomat considers all fallout.'
        )

    def test_log_study_attempt_and_dashboard_stats(self):
        res = self.client.post('/api/platform/study-logs/', {
            'item_type': 'WORD',
            'word_id': self.word.id,
            'is_correct': True,
            'seconds_spent': 10
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        stats_res = self.client.get('/api/platform/dashboard/stats/')
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_res.data['overall']['total_attempts'], 1)
        self.assertEqual(stats_res.data['overall']['total_correct'], 1)
        self.assertEqual(stats_res.data['overall']['accuracy_percentage'], 100.0)
