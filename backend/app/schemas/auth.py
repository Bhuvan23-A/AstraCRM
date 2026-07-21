from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.SALES_EXECUTIVE
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("role", mode="before")
    @classmethod
    def coerce_role(cls, v):
        # DB stores plain string e.g. "SUPER_ADMIN", coerce to enum
        if isinstance(v, str):
            return UserRole(v)
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v