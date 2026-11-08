"""
Test and diagnostic script for Resend email dispatch in Kiwi Learning.
Usage:
    python backend/test_resend_email.py [recipient@example.com]
"""
import sys
import os
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from platform_core.mail import send_magic_link_email

def test_email():
    recipient = sys.argv[1] if len(sys.argv) > 1 else None

    print("=" * 70)
    print("KIWI LEARNING: RESEND EMAIL DIAGNOSTICS")
    print("=" * 70)
    print(f"EMAIL_BACKEND:       {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST:          {getattr(settings, 'EMAIL_HOST', 'N/A')}")
    print(f"EMAIL_PORT:          {getattr(settings, 'EMAIL_PORT', 'N/A')}")
    print(f"DEFAULT_FROM_EMAIL:  {settings.DEFAULT_FROM_EMAIL}")
    print(f"FRONTEND_URL:        {settings.FRONTEND_URL}")

    api_key = getattr(settings, 'RESEND_API_KEY', '') or getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    if api_key:
        masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else "***"
        print(f"RESEND API KEY:      Found ({masked_key})")
    else:
        print("RESEND API KEY:      NOT FOUND (Falling back to local console backend)")
        print("\n[NOTE] To send real emails, create backend/.env with:")
        print("       RESEND_API_KEY=re_your_api_key_here")

    if not recipient:
        print("\nNo recipient email specified for live test dispatch.")
        print("To test dispatching to a real inbox, run:")
        print("    python backend/test_resend_email.py your_email@example.com")
        print("=" * 70)
        return

    print(f"\n[Dispatching Test Magic Link Email to: {recipient}]...")
    test_link = f"{settings.FRONTEND_URL}/auth/verify?token=TEST_TOKEN_DIAGNOSTIC_ONLY"

    try:
        send_magic_link_email(to_email=recipient, magic_link=test_link)
        print("\n-> Email dispatched successfully!")
        if api_key and not api_key.startswith('re_your_'):
            print(f"   (Sent via Resend HTTPS REST API to {recipient})")
            print("   Check your inbox (and spam/promotions folder)!")
        else:
            print("   (Printed to console above because no live API key was provided)")
    except Exception as exc:
        print(f"\n[ERROR] Email dispatch failed:\n{exc}")
        print("\nResend Troubleshooting Tips:")
        print("1. If testing with 'onboarding@resend.dev', you can ONLY send to the email you used to register on Resend.")
        print("2. For your verified domain learn-with-kiwi.com, ensure DEFAULT_FROM_EMAIL uses that domain (e.g. login@learn-with-kiwi.com).")
        print("3. Ensure your API key has 'Full access' or 'Sending access' permission on resend.com/api-keys")

    print("=" * 70)

if __name__ == '__main__':
    test_email()
