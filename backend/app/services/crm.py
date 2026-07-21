import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, update, and_, or_, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.crm import Account, Contact, Lead, Tag
from app.schemas.crm import (
    AccountCreate, AccountUpdate,
    ContactCreate, ContactUpdate,
    LeadCreate, LeadUpdate, LeadConvertRequest
)
from app.core.exceptions import NotFoundException, ValidationException, ConflictException

# ============================================
# TAGS SERVICE HELPER
# ============================================
async def get_or_create_tags(db: AsyncSession, tag_names: List[str]) -> List[Tag]:
    if not tag_names:
        return []
    
    # Strip whitespace and normalize tag names
    normalized_names = [name.strip() for name in tag_names if name.strip()]
    if not normalized_names:
        return []
    
    # Find existing tags
    stmt = select(Tag).where(Tag.name.in_(normalized_names))
    res = await db.execute(stmt)
    existing_tags = list(res.scalars().all())
    existing_names = {tag.name for tag in existing_tags}
    
    # Create missing tags
    new_tags = []
    for name in normalized_names:
        if name not in existing_names:
            # Generate a simple deterministic/pleasing HSL color hue based on name hash
            hue = abs(hash(name)) % 360
            color = f"hsl({hue}, 65%, 45%)"
            tag = Tag(name=name, color=color)
            db.add(tag)
            new_tags.append(tag)
            
    if new_tags:
        await db.flush()
        
    return existing_tags + new_tags

# ============================================
# ACCOUNT SERVICE
# ============================================
class AccountService:
    @staticmethod
    async def create(db: AsyncSession, data: AccountCreate, user_id: Optional[uuid.UUID] = None) -> Account:
        # Check name conflict
        stmt = select(Account).where(and_(Account.name == data.name, Account.deleted_at.is_(None)))
        res = await db.execute(stmt)
        if res.scalars().first():
            raise ConflictException(f"Account with name '{data.name}' already exists.")
            
        tags = await get_or_create_tags(db, data.tag_names)
        
        db_account = Account(
            name=data.name,
            industry=data.industry,
            website=data.website,
            phone=data.phone,
            address_line1=data.address_line1,
            address_line2=data.address_line2,
            city=data.city,
            state=data.state,
            zip_code=data.zip_code,
            country=data.country,
            annual_revenue=data.annual_revenue,
            employees_count=data.employees_count,
            description=data.description,
            created_by=user_id,
            tags=tags
        )
        db.add(db_account)
        await db.commit()
        await db.refresh(db_account)
        return db_account

    @staticmethod
    async def get_by_id(db: AsyncSession, account_id: uuid.UUID) -> Account:
        stmt = select(Account).where(and_(Account.id == account_id, Account.deleted_at.is_(None))).options(
            selectinload(Account.tags),
            selectinload(Account.contacts)
        )
        res = await db.execute(stmt)
        account = res.scalars().first()
        if not account:
            raise NotFoundException("Account not found")
        return account

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        industry: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Account], int]:
        query = select(Account).where(Account.deleted_at.is_(None)).options(selectinload(Account.tags))
        
        # Apply filters
        if search:
            query = query.where(Account.name.ilike(f"%{search}%"))
        if industry:
            query = query.where(Account.industry == industry)
            
        # Total count
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await db.execute(count_stmt)
        total = count_res.scalar() or 0
        
        # Sorting
        sort_col = getattr(Account, sort_by, Account.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
            
        query = query.offset(skip).limit(limit)
        res = await db.execute(query)
        return list(res.scalars().all()), total

    @staticmethod
    async def update(db: AsyncSession, account_id: uuid.UUID, data: AccountUpdate) -> Account:
        account = await AccountService.get_by_id(db, account_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "tag_names" in update_data:
            tag_names = update_data.pop("tag_names")
            account.tags = await get_or_create_tags(db, tag_names)
            
        for key, val in update_data.items():
            setattr(account, key, val)
            
        await db.commit()
        await db.refresh(account)
        return account

    @staticmethod
    async def delete(db: AsyncSession, account_id: uuid.UUID) -> None:
        account = await AccountService.get_by_id(db, account_id)
        account.deleted_at = datetime.now()
        await db.commit()

# ============================================
# CONTACT SERVICE
# ============================================
class ContactService:
    @staticmethod
    async def check_duplicates(db: AsyncSession, email: Optional[str], phone: Optional[str], exclude_id: Optional[uuid.UUID] = None) -> List[dict]:
        warnings = []
        if not email and not phone:
            return warnings
            
        conditions = []
        if email:
            conditions.append(Contact.email == email)
        if phone:
            conditions.append(Contact.phone == phone)
            
        stmt = select(Contact).where(and_(or_(*conditions), Contact.deleted_at.is_(None)))
        if exclude_id:
            stmt = stmt.where(Contact.id != exclude_id)
            
        res = await db.execute(stmt)
        duplicates = res.scalars().all()
        
        for dup in duplicates:
            if email and dup.email == email:
                warnings.append({"type": "email", "message": f"Contact with email '{email}' already exists ({dup.first_name} {dup.last_name})."})
            if phone and dup.phone == phone:
                warnings.append({"type": "phone", "message": f"Contact with phone '{phone}' already exists ({dup.first_name} {dup.last_name})."})
        return warnings

    @staticmethod
    async def create(db: AsyncSession, data: ContactCreate, user_id: Optional[uuid.UUID] = None) -> Contact:
        # Check explicit duplicate blocking if email is conflict (optional, usually warnings are enough, but let's block exact email match if active)
        if data.email:
            stmt = select(Contact).where(and_(Contact.email == data.email, Contact.deleted_at.is_(None)))
            res = await db.execute(stmt)
            if res.scalars().first():
                raise ConflictException(f"Contact with email '{data.email}' already exists.")
                
        tags = await get_or_create_tags(db, data.tag_names)
        
        db_contact = Contact(
            account_id=data.account_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            job_title=data.job_title,
            status=data.status,
            description=data.description,
            created_by=user_id,
            tags=tags
        )
        db.add(db_contact)
        await db.commit()
        await db.refresh(db_contact)
        return db_contact

    @staticmethod
    async def get_by_id(db: AsyncSession, contact_id: uuid.UUID) -> Contact:
        stmt = select(Contact).where(and_(Contact.id == contact_id, Contact.deleted_at.is_(None))).options(
            selectinload(Contact.tags),
            selectinload(Contact.account)
        )
        res = await db.execute(stmt)
        contact = res.scalars().first()
        if not contact:
            raise NotFoundException("Contact not found")
        return contact

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Contact], int]:
        query = select(Contact).where(Contact.deleted_at.is_(None)).options(
            selectinload(Contact.tags),
            selectinload(Contact.account)
        )
        
        # Apply filters
        if search:
            query = query.where(or_(
                Contact.first_name.ilike(f"%{search}%"),
                Contact.last_name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%")
            ))
        if account_id:
            query = query.where(Contact.account_id == account_id)
        if status:
            query = query.where(Contact.status == status)
            
        # Total count
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await db.execute(count_stmt)
        total = count_res.scalar() or 0
        
        # Sorting
        sort_col = getattr(Contact, sort_by, Contact.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
            
        query = query.offset(skip).limit(limit)
        res = await db.execute(query)
        return list(res.scalars().all()), total

    @staticmethod
    async def update(db: AsyncSession, contact_id: uuid.UUID, data: ContactUpdate) -> Contact:
        contact = await ContactService.get_by_id(db, contact_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "tag_names" in update_data:
            tag_names = update_data.pop("tag_names")
            contact.tags = await get_or_create_tags(db, tag_names)
            
        for key, val in update_data.items():
            setattr(contact, key, val)
            
        await db.commit()
        await db.refresh(contact)
        return contact

    @staticmethod
    async def delete(db: AsyncSession, contact_id: uuid.UUID) -> None:
        contact = await ContactService.get_by_id(db, contact_id)
        contact.deleted_at = datetime.now()
        await db.commit()

# ============================================
# LEAD SERVICE
# ============================================
class LeadService:
    @staticmethod
    def calculate_score(first_name: str, last_name: str, email: Optional[str], phone: Optional[str], company_name: Optional[str], source: Optional[str]) -> int:
        score = 0
        if email:
            score += 10
        if phone:
            score += 10
        if company_name:
            score += 20
        if source:
            score += 15
        return score

    @staticmethod
    async def check_duplicates(db: AsyncSession, email: Optional[str], phone: Optional[str], exclude_id: Optional[uuid.UUID] = None) -> List[dict]:
        warnings = []
        if not email and not phone:
            return warnings
            
        conditions = []
        if email:
            conditions.append(Lead.email == email)
        if phone:
            conditions.append(Lead.phone == phone)
            
        stmt = select(Lead).where(and_(or_(*conditions), Lead.deleted_at.is_(None)))
        if exclude_id:
            stmt = stmt.where(Lead.id != exclude_id)
            
        res = await db.execute(stmt)
        duplicates = res.scalars().all()
        
        for dup in duplicates:
            if email and dup.email == email:
                warnings.append({"type": "email", "message": f"Lead with email '{email}' already exists ({dup.first_name} {dup.last_name})."})
            if phone and dup.phone == phone:
                warnings.append({"type": "phone", "message": f"Lead with phone '{phone}' already exists ({dup.first_name} {dup.last_name})."})
        return warnings

    @staticmethod
    async def create(db: AsyncSession, data: LeadCreate, user_id: Optional[uuid.UUID] = None) -> Lead:
        tags = await get_or_create_tags(db, data.tag_names)
        score = LeadService.calculate_score(data.first_name, data.last_name, data.email, data.phone, data.company_name, data.source)
        
        db_lead = Lead(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            company_name=data.company_name,
            status=data.status,
            source=data.source,
            score=score,
            assigned_to=data.assigned_to,
            description=data.description,
            created_by=user_id,
            tags=tags
        )
        db.add(db_lead)
        await db.commit()
        await db.refresh(db_lead)
        return db_lead

    @staticmethod
    async def get_by_id(db: AsyncSession, lead_id: uuid.UUID) -> Lead:
        stmt = select(Lead).where(and_(Lead.id == lead_id, Lead.deleted_at.is_(None))).options(
            selectinload(Lead.tags),
            selectinload(Lead.converted_contact),
            selectinload(Lead.converted_account)
        )
        res = await db.execute(stmt)
        lead = res.scalars().first()
        if not lead:
            raise NotFoundException("Lead not found")
        return lead

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Lead], int]:
        query = select(Lead).where(Lead.deleted_at.is_(None)).options(selectinload(Lead.tags))
        
        # Apply filters
        if search:
            query = query.where(or_(
                Lead.first_name.ilike(f"%{search}%"),
                Lead.last_name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.company_name.ilike(f"%{search}%")
            ))
        if status:
            query = query.where(Lead.status == status)
        if source:
            query = query.where(Lead.source == source)
            
        # Total count
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await db.execute(count_stmt)
        total = count_res.scalar() or 0
        
        # Sorting
        sort_col = getattr(Lead, sort_by, Lead.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))
            
        query = query.offset(skip).limit(limit)
        res = await db.execute(query)
        return list(res.scalars().all()), total

    @staticmethod
    async def update(db: AsyncSession, lead_id: uuid.UUID, data: LeadUpdate) -> Lead:
        lead = await LeadService.get_by_id(db, lead_id)
        if lead.status == "converted":
            raise ValidationException("Cannot update a converted lead")
            
        update_data = data.model_dump(exclude_unset=True)
        if "tag_names" in update_data:
            tag_names = update_data.pop("tag_names")
            lead.tags = await get_or_create_tags(db, tag_names)
            
        for key, val in update_data.items():
            setattr(lead, key, val)
            
        # Recalculate score
        lead.score = LeadService.calculate_score(lead.first_name, lead.last_name, lead.email, lead.phone, lead.company_name, lead.source)
        
        await db.commit()
        await db.refresh(lead)
        return lead

    @staticmethod
    async def delete(db: AsyncSession, lead_id: uuid.UUID) -> None:
        lead = await LeadService.get_by_id(db, lead_id)
        lead.deleted_at = datetime.now()
        await db.commit()

    @staticmethod
    async def convert(db: AsyncSession, lead_id: uuid.UUID, req: LeadConvertRequest, user_id: Optional[uuid.UUID] = None) -> Lead:
        lead = await LeadService.get_by_id(db, lead_id)
        if lead.status == "converted":
            raise ValidationException("Lead is already converted")
            
        target_account: Optional[Account] = None
        target_contact: Optional[Contact] = None
        
        # 1. Resolve Account
        if req.create_account:
            if req.existing_account_id:
                # Use existing account
                stmt = select(Account).where(and_(Account.id == req.existing_account_id, Account.deleted_at.is_(None)))
                res = await db.execute(stmt)
                target_account = res.scalars().first()
                if not target_account:
                    raise NotFoundException("Target existing account not found")
            elif lead.company_name:
                # Check duplicate account name
                stmt = select(Account).where(and_(Account.name == lead.company_name, Account.deleted_at.is_(None)))
                res = await db.execute(stmt)
                target_account = res.scalars().first()
                
                # If no existing duplicate account, create new one
                if not target_account:
                    target_account = Account(
                        name=lead.company_name,
                        phone=lead.phone,
                        created_by=user_id,
                        description=f"Automatically created by converting Lead '{lead.first_name} {lead.last_name}'."
                    )
                    db.add(target_account)
                    await db.flush() # Fetch generated ID
            else:
                raise ValidationException("Company name is required to create a new Account.")

        # 2. Resolve Contact
        if req.create_contact:
            # Check if contact already exists
            if lead.email:
                stmt = select(Contact).where(and_(Contact.email == lead.email, Contact.deleted_at.is_(None)))
                res = await db.execute(stmt)
                target_contact = res.scalars().first()
                
            if not target_contact:
                target_contact = Contact(
                    account_id=target_account.id if target_account else None,
                    first_name=lead.first_name,
                    last_name=lead.last_name,
                    email=lead.email,
                    phone=lead.phone,
                    status="active",
                    created_by=user_id,
                    description=f"Automatically created by converting Lead."
                )
                db.add(target_contact)
                await db.flush() # Fetch generated ID

        # 3. Complete conversion
        lead.status = "converted"
        lead.converted_at = datetime.now()
        lead.converted_account_id = target_account.id if target_account else None
        lead.converted_contact_id = target_contact.id if target_contact else None
        
        await db.commit()
        await db.refresh(lead)
        return lead

# ============================================
# TAGS SERVICE
# ============================================
class TagService:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Tag]:
        stmt = select(Tag).where(Tag.deleted_at.is_(None)).order_by(Tag.name.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, name: str, color: Optional[str] = None) -> Tag:
        stmt = select(Tag).where(and_(Tag.name == name, Tag.deleted_at.is_(None)))
        res = await db.execute(stmt)
        if res.scalars().first():
            raise ConflictException(f"Tag with name '{name}' already exists.")
            
        if not color:
            hue = abs(hash(name)) % 360
            color = f"hsl({hue}, 65%, 45%)"
            
        tag = Tag(name=name, color=color)
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
        return tag
