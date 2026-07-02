import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

OCCUPATIONS = {
    "student",
    "worker_employee",
    "intern",
    "self_employed",
    "unemployed",
    "other",
}


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    occupation: str
    password: str
    confirm_password: str


class UpdateProfileRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    confirm_password: str


class UserOut(BaseModel):
    """Safe user object — never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email: str
    occupation: Optional[str]
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageResponse(BaseModel):
    message: str
