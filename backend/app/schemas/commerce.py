import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

# ── PRODUCT SCHEMAS ──────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    sku: str = Field(..., max_length=100)
    price: Decimal = Field(..., ge=0)
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── QUOTATION ITEM SCHEMAS ───────────────────────────────────────────────────

class QuotationItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1)
    unit_price: Decimal = Field(..., ge=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)

class QuotationItemCreate(QuotationItemBase):
    pass

class QuotationItemResponse(QuotationItemBase):
    id: uuid.UUID
    subtotal: Decimal
    total: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# ── QUOTATION SCHEMAS ────────────────────────────────────────────────────────

class QuotationBase(BaseModel):
    account_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    discount_type: str = Field(default="percentage")  # percentage, fixed
    discount_value: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0, le=100)
    valid_until: Optional[datetime] = None
    terms_conditions: Optional[str] = None
    notes: Optional[str] = None

class QuotationCreate(QuotationBase):
    items: List[QuotationItemCreate] = Field(..., min_length=1)

class QuotationUpdate(BaseModel):
    account_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    valid_until: Optional[datetime] = None
    terms_conditions: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuotationItemCreate]] = None

class QuotationResponse(QuotationBase):
    id: uuid.UUID
    quote_number: str
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[QuotationItemResponse] = []

    class Config:
        from_attributes = True


# ── ORDER ITEM SCHEMAS ───────────────────────────────────────────────────────

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    total: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# ── ORDER SCHEMAS ────────────────────────────────────────────────────────────

class OrderBase(BaseModel):
    account_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    shipping_address: Optional[str] = None
    billing_address: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    quotation_id: Optional[uuid.UUID] = None
    # If not converted from quote, items can be supplied
    items: Optional[List[QuotationItemCreate]] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status: Optional[str] = None  # unpaid, partially_paid, paid, refunded
    payment_method: Optional[str] = None
    shipping_address: Optional[str] = None
    billing_address: Optional[str] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: uuid.UUID
    order_number: str
    quotation_id: Optional[uuid.UUID]
    status: str
    payment_status: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ── WORKFLOW ACTION SCHEMAS ──────────────────────────────────────────────────

class ApprovalActionRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None
