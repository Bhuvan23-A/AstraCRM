import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Numeric, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import BaseModel


class Product(BaseModel):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Quotation(BaseModel):
    __tablename__ = "quotations"

    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    quote_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, pending_approval, approved, rejected, sent, expired, accepted
    
    subtotal: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    discount_type: Mapped[str] = mapped_column(String(20), default="percentage")  # percentage, fixed
    discount_value: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=18.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    terms_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account")
    contact: Mapped[Optional["Contact"]] = relationship("Contact")
    items: Mapped[List["QuotationItem"]] = relationship(
        "QuotationItem", back_populates="quotation", cascade="all, delete-orphan"
    )


class QuotationItem(BaseModel):
    __tablename__ = "quotation_items"

    quotation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    discount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)  # item level discount
    subtotal: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    total: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)

    # Relationships
    quotation: Mapped["Quotation"] = relationship("Quotation", back_populates="items")
    product: Mapped[Optional[Product]] = relationship("Product")


class Order(BaseModel):
    __tablename__ = "orders"

    quotation_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status: Mapped[str] = mapped_column(String(50), default="unpaid")  # unpaid, partially_paid, paid, refunded
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    shipping_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    subtotal: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account")
    contact: Mapped[Optional["Contact"]] = relationship("Contact")
    quotation: Mapped[Optional[Quotation]] = relationship("Quotation")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    subtotal: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    total: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional[Product]] = relationship("Product")
