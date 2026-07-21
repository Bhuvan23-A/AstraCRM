import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas import APIResponse, PaginationMeta
from app.schemas.crm import (
    AccountCreate, AccountUpdate, AccountRead,
    ContactCreate, ContactUpdate, ContactRead,
    LeadCreate, LeadUpdate, LeadRead, LeadConvertRequest,
    TagCreate, TagRead
)
from app.services.crm import AccountService, ContactService, LeadService, TagService

router = APIRouter()

# Temporary mock user ID fallback until auth module is merged
async def get_current_user_id() -> Optional[uuid.UUID]:
    return None

# ============================================
# TAGS ENDPOINTS
# ============================================
@router.get("/tags", response_model=APIResponse[List[TagRead]], tags=["Tags"])
async def get_tags(db: AsyncSession = Depends(get_db)):
    tags = await TagService.get_all(db)
    return APIResponse(
        success=True,
        data=tags,
        message="Tags retrieved successfully"
    )

@router.post("/tags", response_model=APIResponse[TagRead], status_code=201, tags=["Tags"])
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    tag = await TagService.create(db, data.name, data.color)
    return APIResponse(
        success=True,
        data=tag,
        message="Tag created successfully"
    )

# ============================================
# ACCOUNTS ENDPOINTS
# ============================================
@router.post("/accounts", response_model=APIResponse[AccountRead], status_code=201, tags=["Accounts"])
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_current_user_id)
):
    account = await AccountService.create(db, data, user_id)
    return APIResponse(
        success=True,
        data=account,
        message="Account created successfully"
    )

@router.get("/accounts", response_model=APIResponse[List[AccountRead]], tags=["Accounts"])
async def get_accounts(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc")
):
    skip = (page - 1) * per_page
    accounts, total = await AccountService.get_multi(
        db, skip=skip, limit=per_page, search=search, industry=industry, sort_by=sort_by, sort_order=sort_order
    )
    
    total_pages = (total + per_page - 1) // per_page
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=total_pages)
    
    return APIResponse(
        success=True,
        data=accounts,
        message="Accounts retrieved successfully",
        meta=meta
    )

@router.get("/accounts/{id}", response_model=APIResponse[AccountRead], tags=["Accounts"])
async def get_account(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    account = await AccountService.get_by_id(db, id)
    return APIResponse(
        success=True,
        data=account,
        message="Account retrieved successfully"
    )

@router.put("/accounts/{id}", response_model=APIResponse[AccountRead], tags=["Accounts"])
async def update_account(
    id: uuid.UUID = Path(...),
    data: AccountUpdate = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Standard Body parsing for form submissions or simple JSON
    account = await AccountService.update(db, id, data)
    return APIResponse(
        success=True,
        data=account,
        message="Account updated successfully"
    )

@router.delete("/accounts/{id}", response_model=APIResponse[None], tags=["Accounts"])
async def delete_account(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    await AccountService.delete(db, id)
    return APIResponse(
        success=True,
        data=None,
        message="Account deleted successfully"
    )

# ============================================
# CONTACTS ENDPOINTS
# ============================================
@router.post("/contacts", response_model=APIResponse[ContactRead], status_code=201, tags=["Contacts"])
async def create_contact(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_current_user_id)
):
    contact = await ContactService.create(db, data, user_id)
    return APIResponse(
        success=True,
        data=contact,
        message="Contact created successfully"
    )

@router.get("/contacts/check-duplicates", response_model=APIResponse[List[dict]], tags=["Contacts"])
async def check_contact_duplicates(
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    exclude_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    warnings = await ContactService.check_duplicates(db, email=email, phone=phone, exclude_id=exclude_id)
    return APIResponse(
        success=True,
        data=warnings,
        message="Duplicate checks performed successfully"
    )

@router.get("/contacts", response_model=APIResponse[List[ContactRead]], tags=["Contacts"])
async def get_contacts(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    account_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc")
):
    skip = (page - 1) * per_page
    contacts, total = await ContactService.get_multi(
        db, skip=skip, limit=per_page, search=search, account_id=account_id, status=status, sort_by=sort_by, sort_order=sort_order
    )
    
    # Map related company name for the frontend response mapping
    mapped_contacts = []
    for c in contacts:
        contact_dict = ContactRead.model_validate(c)
        if c.account:
            contact_dict.account_name = c.account.name
        mapped_contacts.append(contact_dict)
        
    total_pages = (total + per_page - 1) // per_page
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=total_pages)
    
    return APIResponse(
        success=True,
        data=mapped_contacts,
        message="Contacts retrieved successfully",
        meta=meta
    )

@router.get("/contacts/{id}", response_model=APIResponse[ContactRead], tags=["Contacts"])
async def get_contact(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    contact = await ContactService.get_by_id(db, id)
    contact_dict = ContactRead.model_validate(contact)
    if contact.account:
        contact_dict.account_name = contact.account.name
    return APIResponse(
        success=True,
        data=contact_dict,
        message="Contact retrieved successfully"
    )

@router.put("/contacts/{id}", response_model=APIResponse[ContactRead], tags=["Contacts"])
async def update_contact(
    id: uuid.UUID = Path(...),
    data: ContactUpdate = Depends(),
    db: AsyncSession = Depends(get_db)
):
    contact = await ContactService.update(db, id, data)
    contact_dict = ContactRead.model_validate(contact)
    if contact.account:
        contact_dict.account_name = contact.account.name
    return APIResponse(
        success=True,
        data=contact_dict,
        message="Contact updated successfully"
    )

@router.delete("/contacts/{id}", response_model=APIResponse[None], tags=["Contacts"])
async def delete_contact(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    await ContactService.delete(db, id)
    return APIResponse(
        success=True,
        data=None,
        message="Contact deleted successfully"
    )

# ============================================
# LEADS ENDPOINTS
# ============================================
@router.post("/leads", response_model=APIResponse[LeadRead], status_code=201, tags=["Leads"])
async def create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_current_user_id)
):
    lead = await LeadService.create(db, data, user_id)
    return APIResponse(
        success=True,
        data=lead,
        message="Lead created successfully"
    )

@router.get("/leads/check-duplicates", response_model=APIResponse[List[dict]], tags=["Leads"])
async def check_lead_duplicates(
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    exclude_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    warnings = await LeadService.check_duplicates(db, email=email, phone=phone, exclude_id=exclude_id)
    return APIResponse(
        success=True,
        data=warnings,
        message="Duplicate checks performed successfully"
    )

@router.get("/leads", response_model=APIResponse[List[LeadRead]], tags=["Leads"])
async def get_leads(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc")
):
    skip = (page - 1) * per_page
    leads, total = await LeadService.get_multi(
        db, skip=skip, limit=per_page, search=search, status=status, source=source, sort_by=sort_by, sort_order=sort_order
    )
    
    total_pages = (total + per_page - 1) // per_page
    meta = PaginationMeta(page=page, per_page=per_page, total=total, total_pages=total_pages)
    
    return APIResponse(
        success=True,
        data=leads,
        message="Leads retrieved successfully",
        meta=meta
    )

@router.get("/leads/{id}", response_model=APIResponse[LeadRead], tags=["Leads"])
async def get_lead(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    lead = await LeadService.get_by_id(db, id)
    return APIResponse(
        success=True,
        data=lead,
        message="Lead retrieved successfully"
    )

@router.put("/leads/{id}", response_model=APIResponse[LeadRead], tags=["Leads"])
async def update_lead(
    id: uuid.UUID = Path(...),
    data: LeadUpdate = Depends(),
    db: AsyncSession = Depends(get_db)
):
    lead = await LeadService.update(db, id, data)
    return APIResponse(
        success=True,
        data=lead,
        message="Lead updated successfully"
    )

@router.delete("/leads/{id}", response_model=APIResponse[None], tags=["Leads"])
async def delete_lead(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    await LeadService.delete(db, id)
    return APIResponse(
        success=True,
        data=None,
        message="Lead deleted successfully"
    )

@router.post("/leads/{id}/convert", response_model=APIResponse[LeadRead], tags=["Leads"])
async def convert_lead(
    id: uuid.UUID = Path(...),
    req: LeadConvertRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    user_id: Optional[uuid.UUID] = Depends(get_current_user_id)
):
    lead = await LeadService.convert(db, id, req, user_id)
    return APIResponse(
        success=True,
        data=lead,
        message="Lead converted successfully"
    )
