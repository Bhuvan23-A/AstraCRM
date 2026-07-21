from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ============================================
# TAG SCHEMAS
# ============================================
class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = Field(None, max_length=20)

class TagCreate(TagBase):
    pass

class TagRead(TagBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ============================================
# ACCOUNT SCHEMAS
# ============================================
class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    annual_revenue: Optional[float] = Field(None, ge=0)
    employees_count: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None

class AccountCreate(AccountBase):
    tag_names: Optional[List[str]] = Field(default_factory=list)

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    annual_revenue: Optional[float] = Field(None, ge=0)
    employees_count: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    tag_names: Optional[List[str]] = None

class AccountRead(AccountBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    tags: List[TagRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# ============================================
# CONTACT SCHEMAS
# ============================================
class ContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=150)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    status: str = Field("active", max_length=50)
    description: Optional[str] = None
    account_id: Optional[uuid.UUID] = None

class ContactCreate(ContactBase):
    tag_names: Optional[List[str]] = Field(default_factory=list)

class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=150)
    last_name: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    account_id: Optional[uuid.UUID] = None
    tag_names: Optional[List[str]] = None

class ContactRead(ContactBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    account_name: Optional[str] = None
    tags: List[TagRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# ============================================
# LEAD SCHEMAS
# ============================================
class LeadBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=150)
    last_name: str = Field(..., min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, max_length=255)
    status: str = Field("new", max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[uuid.UUID] = None
    description: Optional[str] = None

class LeadCreate(LeadBase):
    tag_names: Optional[List[str]] = Field(default_factory=list)

class LeadUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=150)
    last_name: Optional[str] = Field(None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    company_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[uuid.UUID] = None
    description: Optional[str] = None
    tag_names: Optional[List[str]] = None

class LeadRead(LeadBase):
    id: uuid.UUID
    score: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    converted_at: Optional[datetime] = None
    converted_contact_id: Optional[uuid.UUID] = None
    converted_account_id: Optional[uuid.UUID] = None
    tags: List[TagRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class LeadConvertRequest(BaseModel):
    create_account: bool = True
    create_contact: bool = True
    existing_account_id: Optional[uuid.UUID] = None
