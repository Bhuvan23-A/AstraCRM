from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import BaseModel


class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    SALES_MANAGER = "SALES_MANAGER"
    SALES_EXECUTIVE = "SALES_EXECUTIVE"
    MARKETING = "MARKETING"
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
    FINANCE = "FINANCE"


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default=UserRole.SALES_EXECUTIVE.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)