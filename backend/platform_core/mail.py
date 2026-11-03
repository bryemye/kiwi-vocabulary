import re
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail.backends.console import EmailBackend as BaseConsoleEmailBackend


class KiwiConsoleEmailBackend(BaseConsoleEmailBackend):
    """
    Console email backend for local development.
    In addition to standard console MIME output, it prints an un-encoded,
    non-line-wrapped direct URL so developers can copy/click the magic link
    without quoted-printable artifacts (=3D, soft wraps) or Windows cp1252 unicode errors.
    """

    def write_message(self, message):
        super().write_message(message)
        body = str(message.body)
        links = re.findall(r'https?://[^\s<>"]+', body)
        if links:
            self.stream.write("\n" + "=" * 80 + "\n")
            self.stream.write("[KIWI] DIRECT MAGIC LOGIN LINK (DIRECT CLICK / SINGLE-LINE COPY):\n")
            for link in links:
                self.stream.write(f"\n-> {link}\n")
            self.stream.write("=" * 80 + "\n\n")
            self.stream.flush()


def send_magic_link_email(to_email: str, magic_link: str) -> None:
    """
    Dispatches magic link email using either Resend SMTP or Console backend
    configured via settings.EMAIL_BACKEND. Sends both clean plain-text and
    branded neo-brutalist HTML.
    """
    subject = "Your Kiwi Learning Magic Login Link"

    plain_message = (
        f"Hello,\n\n"
        f"Click the link below to sign in or complete your registration for Kiwi Learning:\n\n"
        f"{magic_link}\n\n"
        f"This link expires in 15 minutes and can only be used once.\n\n"
        f"If you did not request this link, you can safely ignore this email.\n\n"
        f"-- The Kiwi Learning Team"
    )

    html_message = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Kiwi Learning Login Link</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAFBF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111410;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 2px solid #111410; box-shadow: 6px 6px 0px 0px #111410;">
    <!-- Top Kiwi Green Accent Bar -->
    <tr>
      <td style="background-color: #7BB33B; height: 8px; border-bottom: 2px solid #111410;"></td>
    </tr>
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 16px 32px;">
        <span style="font-family: monospace, Courier, sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #7BB33B; text-transform: uppercase;">KIWI LEARNING</span>
        <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #111410; line-height: 1.3;">Your Magic Login Link</h1>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 0 32px 24px 32px; font-size: 15px; line-height: 1.6; color: #374151;">
        <p style="margin: 0 0 20px 0;">
          Click the button below to sign in or complete your registration for Kiwi Learning. No password required.
        </p>
        <!-- High Contrast CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center" style="background-color: #7BB33B; border: 2px solid #111410; box-shadow: 4px 4px 0px 0px #111410;">
              <a href="{magic_link}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: monospace, Courier, sans-serif; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                SIGN IN TO KIWI &rarr;
              </a>
            </td>
          </tr>
        </table>
        <!-- Notice Box -->
        <div style="background-color: #F4F6F0; border: 1px solid #D5DCDB; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #52594D; font-family: monospace, Courier, sans-serif;">
          <strong>Expires in 15 minutes.</strong> Single-use link.
        </div>
        <!-- Direct URL Fallback -->
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
          Or copy and paste this URL into your browser:<br>
          <a href="{magic_link}" style="color: #4C7522; word-break: break-all; text-decoration: underline;">{magic_link}</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #FAFBF8; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; line-height: 1.5;">
        If you did not request this link, you can safely ignore this email.<br>
        &copy; Kiwi Learning Platform
      </td>
    </tr>
  </table>
</body>
</html>
"""

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Kiwi Learning <onboarding@resend.dev>')

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=from_email,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )

