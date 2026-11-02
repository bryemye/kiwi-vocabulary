import re
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
