"""Email abstraction. Swap in a real provider (SendGrid, SES, ...) later
without touching auth logic."""
import logging

from app.config import settings

logger = logging.getLogger("cpft.email")


class EmailService:
    def send_password_reset(self, to_email: str, reset_link: str) -> None:
        # TODO: integrate a real email provider for production.
        if settings.environment == "development":
            logger.warning(
                "DEV ONLY — password reset link for %s: %s", to_email, reset_link
            )


email_service = EmailService()
