"""Auth business logic. Routes stay thin; everything auth lives here."""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PasswordResetToken, User
from app.schemas.auth import (
    OCCUPATIONS,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from app.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.services.email_service import email_service

# NIST SP 800-63B: use a blocklist of known-bad passwords instead of
# composition rules (no forced uppercase/number/symbol requirements).
COMMON_PASSWORDS = {
    "password",
    "password123",
    "qwerty",
    "letmein",
    "123456789",
    "iloveyou",
    "welcome123",
    "abc123456789",
    "passwordpassword",
    "qwertyuiopasdfgh",
}

PASSWORD_HINT = (
    "Use at least 15 characters. A short passphrase is easier to remember "
    "and harder to guess."
)


class AuthError(Exception):
    """Domain error with a user-safe message."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_password(
    password: str,
    email: str = "",
    first_name: str = "",
    last_name: str = "",
) -> None:
    """Raise AuthError if the password violates our NIST-style rules."""
    if len(password) < 15:
        raise AuthError(PASSWORD_HINT)
    if len(password) > 64:
        raise AuthError("Passwords can be at most 64 characters.")
    # bcrypt operates on bytes and would silently truncate past 72 bytes —
    # reject instead (can happen with emoji/multibyte characters).
    if len(password.encode("utf-8")) > 72:
        raise AuthError("That password is too long once encoded. Try a slightly shorter passphrase.")

    lowered = password.lower().strip()
    if lowered in COMMON_PASSWORDS:
        raise AuthError("That password is too common. Try a personal passphrase instead.")
    for personal in (email, first_name, last_name):
        if personal and personal.lower().strip() == lowered:
            raise AuthError("Your password can't be your name or email.")


def signup(db: Session, data: SignupRequest) -> Tuple[User, str]:
    if data.occupation not in OCCUPATIONS:
        raise AuthError("Please choose a valid occupation.")
    if data.password != data.confirm_password:
        raise AuthError("Passwords do not match.")
    validate_password(data.password, data.email, data.first_name, data.last_name)

    email = data.email.lower().strip()
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise AuthError("An account with that email already exists.", status_code=409)

    user = User(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=email,
        occupation=data.occupation,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, create_access_token(str(user.id))


def login(db: Session, data: LoginRequest) -> Tuple[User, str]:
    # TODO: add rate limiting / lockout on repeated failures before production.
    email = data.email.lower().strip()
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None:
        raise AuthError("There is no account under this email.", status_code=401)
    if not verify_password(data.password, user.password_hash):
        raise AuthError("That password is incorrect.", status_code=401)
    return user, create_access_token(str(user.id))


def forgot_password(db: Session, email: str) -> None:
    """Create a reset token and 'send' it. Never reveals whether the email exists."""
    user = db.execute(
        select(User).where(User.email == email.lower().strip())
    ).scalar_one_or_none()
    if user is None:
        return

    raw_token, token_hash = generate_reset_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.reset_token_expire_minutes),
        )
    )
    db.commit()

    reset_link = f"{settings.frontend_base_url}/reset-password?token={raw_token}"
    email_service.send_password_reset(user.email, reset_link)


def reset_password(db: Session, data: ResetPasswordRequest) -> None:
    if data.password != data.confirm_password:
        raise AuthError("Passwords do not match.")

    token = db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_reset_token(data.token)
        )
    ).scalar_one_or_none()

    generic = "This reset link is invalid or has expired. Please request a new one."
    if token is None or token.used_at is not None:
        raise AuthError(generic)

    expires_at = token.expires_at
    if expires_at.tzinfo is None:  # SQLite drops timezone info
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise AuthError(generic)

    user = db.get(User, token.user_id)
    if user is None:
        raise AuthError(generic)

    validate_password(data.password, user.email, user.first_name or "", user.last_name or "")
    user.password_hash = hash_password(data.password)
    token.used_at = datetime.now(timezone.utc)
    db.commit()


def update_profile(db: Session, user: User, first_name: str, last_name: str, email: str) -> User:
    new_email = email.lower().strip()
    if new_email != user.email:
        taken = db.execute(select(User).where(User.email == new_email)).scalar_one_or_none()
        if taken:
            raise AuthError("An account with that email already exists.", status_code=409)
    user.first_name = first_name.strip()
    user.last_name = last_name.strip()
    user.email = new_email
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    try:
        return db.get(User, uuid.UUID(user_id))
    except (ValueError, TypeError):
        return None
