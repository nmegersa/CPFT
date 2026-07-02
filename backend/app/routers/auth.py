import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    UpdateProfileRequest,
    UserOut,
)
from app.security import decode_access_token
from app.services import auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer(auto_error=False)

# Simple in-memory sliding-window rate limiter for auth endpoints.
_attempts: dict = defaultdict(list)
RATE_LIMIT = 10  # attempts
RATE_WINDOW = 60  # seconds


def rate_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = [t for t in _attempts[ip] if now - t < RATE_WINDOW]
    if len(window) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429, detail="Too many attempts. Please wait a minute and try again."
        )
    window.append(now)
    _attempts[ip] = window


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency for protected routes. Reuse on user-data routes later."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user_id = decode_access_token(credentials.credentials)
    user = auth_service.get_user_by_id(db, user_id) if user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return user


@router.post("/signup", response_model=AuthResponse, status_code=201,
             dependencies=[Depends(rate_limit)])
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    try:
        user, token = auth_service.signup(db, data)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(rate_limit)])
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        user, token = auth_service.login(db, data)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password", response_model=MessageResponse,
             dependencies=[Depends(rate_limit)])
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    auth_service.forgot_password(db, data.email)
    # Always the same response — never reveal whether an account exists.
    return MessageResponse(
        message="If an account exists for that email, reset instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        auth_service.reset_password(db, data)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return MessageResponse(message="Your password has been updated. You can now log in.")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user = auth_service.update_profile(
            db, current_user, data.first_name, data.last_name, data.email
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return UserOut.model_validate(user)
