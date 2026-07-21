import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Numeric, Integer, DateTime, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import BaseModel, Base

# Many-to-many association tables
account_tag = Table(
    "account_tag",
    Base.metadata,
    Column("account_id", ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

contact_tag = Table(
    "contact_tag",
    Base.metadata,
    Column("contact_id", ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

lead_tag = Table(
    "lead_tag",
    Base.metadata,
    Column("lead_id", ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Tag(BaseModel):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # Store HSL or Hex colors

class Account(BaseModel):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Address details
    address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Financial/Size details
    annual_revenue: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    employees_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="converted_account")
    tags: Mapped[List[Tag]] = relationship("Tag", secondary=account_tag)

class Contact(BaseModel):
    __tablename__ = "contacts"

    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    first_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, inactive, bounce, unsubscribed
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    account: Mapped[Optional[Account]] = relationship("Account", back_populates="contacts")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="converted_contact")
    tags: Mapped[List[Tag]] = relationship("Tag", secondary=contact_tag)

class Lead(BaseModel):
    __tablename__ = "leads"

    first_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    
    status: Mapped[str] = mapped_column(String(50), default="new")  # new, contacted, qualified, lost, converted
    source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # website, referral, manual, marketing, etc.
    score: Mapped[int] = mapped_column(Integer, default=0)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(nullable=True)  # Stores userId
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Conversion Details
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    converted_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    converted_contact: Mapped[Optional[Contact]] = relationship("Contact", back_populates="leads")
    converted_account: Mapped[Optional[Account]] = relationship("Account", back_populates="leads")
    tags: Mapped[List[Tag]] = relationship("Tag", secondary=lead_tag)
