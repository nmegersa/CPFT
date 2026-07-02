"""Password hashing, JWT creation/validation, and reset token helpers."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
from jose import JWTError, jwt

from app.config import settings

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": user_id, "exp": expires}
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Return the user id from a valid token, or None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def generate_reset_token() -> Tuple[str, str]:
    """Return (raw_token, sha256_hash). Only the hash is ever stored."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_reset_token(raw)


def hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
