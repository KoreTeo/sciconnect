#!/usr/bin/env python3
"""SMTP diagnostic: python scripts/smtp_check.py [recipient@email.com]"""
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent / "app"
sys.path.insert(0, str(APP_DIR))

from config import settings  # noqa: E402
from services.email import send_email_message  # noqa: E402


def main() -> int:
    to = sys.argv[1] if len(sys.argv) > 1 else (settings.SMTP_USER or "").strip()
    if not to:
        print("Usage: python scripts/smtp_check.py your@email.com")
        return 1

    print("SMTP_HOST:", settings.SMTP_HOST)
    print("SMTP_PORT:", settings.SMTP_PORT)
    print("SMTP_USE_SSL:", settings.SMTP_USE_SSL)
    print("SMTP_USE_TLS:", settings.SMTP_USE_TLS)
    print("SMTP_USER:", settings.SMTP_USER or "(empty)")
    print("SMTP_FROM:", settings.SMTP_FROM)
    print("SMTP_PASSWORD:", "set" if settings.SMTP_PASSWORD else "MISSING")
    print("FRONTEND_URL:", settings.FRONTEND_URL)
    print("---")
    print("Sending test to:", to)

    ok = send_email_message(
        to,
        "SciConnect SMTP test",
        "<p>If you see this, SMTP works.</p>",
        "SciConnect SMTP test",
    )
    print("Result:", "OK" if ok else "FAILED")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
