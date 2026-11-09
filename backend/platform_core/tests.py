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

    def test_cross_device_auth_flow(self):
        computer_client = APIClient()
        phone_client = APIClient()

        email = "cross_device_user@example.com"
        # 1. Computer initiates magic link request
        req_res = computer_client.post('/api/platform/auth/magic-link/', {'email': email}, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        session_id = req_res.data.get('session_id')
        device_secret = req_res.data.get('device_secret')
        match_code = req_res.data.get('match_code')

        self.assertIsNotNone(session_id)
        self.assertIsNotNone(device_secret)
        self.assertTrue(len(match_code) == 2)

        # 2. Computer polls status before phone approval (should be PENDING)
        poll_res = computer_client.post('/api/platform/auth/poll-status/', {
            'session_id': session_id,
            'device_secret': device_secret,
        }, format='json')
        self.assertEqual(poll_res.status_code, status.HTTP_200_OK)
        self.assertEqual(poll_res.data.get('status'), 'PENDING')

        # 3. User taps link on phone; phone inspects with action='check'
        token_record = MagicLoginToken.objects.get(session_id=session_id)
        check_res = phone_client.post('/api/platform/auth/verify-magic-link/', {
            'token': token_record.token,
            'sid': session_id,
            'action': 'check',
        }, format='json')
        self.assertEqual(check_res.status_code, status.HTTP_200_OK)
        self.assertEqual(check_res.data.get('match_code'), match_code)
        self.assertEqual(check_res.data.get('email'), email)

        # 4. User approves on phone
        approve_res = phone_client.post('/api/platform/auth/verify-magic-link/', {
            'token': token_record.token,
            'sid': session_id,
            'action': 'approve',
        }, format='json')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
        self.assertTrue(approve_res.data.get('cross_device'))

        # 5. Computer polls again: should now be APPROVED, setting session cookie!
        final_poll = computer_client.post('/api/platform/auth/poll-status/', {
            'session_id': session_id,
            'device_secret': device_secret,
        }, format='json')
        self.assertEqual(final_poll.status_code, status.HTTP_200_OK)
        self.assertEqual(final_poll.data.get('status'), 'APPROVED')
        self.assertEqual(final_poll.data['user']['email'], email)
        self.assertIn('sessionid', computer_client.cookies)

        # 6. Computer can now call authenticated /me/ endpoint
        me_res = computer_client.get('/api/platform/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['email'], email)

    def test_cross_device_denial_flow(self):
        computer_client = APIClient()
        phone_client = APIClient()

        email = "denied_user@example.com"
        req_res = computer_client.post('/api/platform/auth/magic-link/', {'email': email}, format='json')
        session_id = req_res.data['session_id']
        device_secret = req_res.data['device_secret']

        token_record = MagicLoginToken.objects.get(session_id=session_id)
        deny_res = phone_client.post('/api/platform/auth/verify-magic-link/', {
            'token': token_record.token,
            'sid': session_id,
            'action': 'deny',
        }, format='json')
        self.assertEqual(deny_res.status_code, status.HTTP_200_OK)

        poll_res = computer_client.post('/api/platform/auth/poll-status/', {
            'session_id': session_id,
            'device_secret': device_secret,
        }, format='json')
        self.assertEqual(poll_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(poll_res.data.get('status'), 'DENIED')


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
