import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.commerce import Product, Quotation, QuotationItem, Order, OrderItem
from app.models.crm import Account, Contact
from app.models.user import User, UserRole
from app.schemas.commerce import (
    ProductCreate, ProductUpdate, QuotationCreate, QuotationUpdate, OrderCreate, OrderUpdate
)


class CommerceService:

    # ── PRODUCT CRUD ──────────────────────────────────────────────────────────

    @staticmethod
    async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
        product = Product(
            name=data.name,
            sku=data.sku.upper(),
            price=data.price,
            description=data.description,
            is_active=data.is_active,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def get_products(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        active_only: bool = False
    ) -> Tuple[List[Product], int]:
        query = select(Product).where(Product.deleted_at.is_(None))
        if active_only:
            query = query.where(Product.is_active.is_(True))
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%")
                )
            )

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Data
        result = await db.execute(
            query.offset(skip).limit(limit).order_by(Product.name.asc())
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Optional[Product]:
        result = await db.execute(
            select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_product(db: AsyncSession, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "sku" and value:
                value = value.upper()
            setattr(product, field, value)
        product.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, product: Product) -> None:
        product.deleted_at = datetime.utcnow()
        await db.commit()


    # ── QUOTATION SERVICES ───────────────────────────────────────────────────

    @staticmethod
    async def generate_quote_number(db: AsyncSession) -> str:
        year = datetime.utcnow().strftime("%Y")
        result = await db.execute(select(func.count(Quotation.id)))
        count = result.scalar() or 0
        return f"QT-{year}-{count + 1:04d}"

    @staticmethod
    async def calculate_quote_financials(db: AsyncSession, items_data: list, discount_type: str, discount_value: Decimal, tax_rate: Decimal):
        subtotal = Decimal("0.00")
        calculated_items = []

        for item in items_data:
            # fetch product to get authoritative price
            res = await db.execute(select(Product).where(Product.id == item.product_id, Product.deleted_at.is_(None)))
            product = res.scalar_one_or_none()
            if not product:
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found or deactivated.")

            price = Decimal(str(product.price))
            qty = Decimal(str(item.quantity))
            item_subtotal = price * qty
            
            # item discount
            item_disc = Decimal(str(item.discount))
            item_total = item_subtotal - item_disc
            if item_total < 0:
                item_total = Decimal("0.00")

            subtotal += item_total
            calculated_items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": price,
                "discount": item_disc,
                "subtotal": item_subtotal,
                "total": item_total
            })

        # header discount calculation
        discount_amount = Decimal("0.00")
        if discount_type == "percentage":
            discount_amount = subtotal * (discount_value / Decimal("100.00"))
        elif discount_type == "fixed":
            discount_amount = discount_value

        discounted_subtotal = subtotal - discount_amount
        if discounted_subtotal < 0:
            discounted_subtotal = Decimal("0.00")

        # tax calculation
        tax_amount = discounted_subtotal * (tax_rate / Decimal("100.00"))
        total_amount = discounted_subtotal + tax_amount

        return subtotal, discount_amount, tax_amount, total_amount, calculated_items

    @staticmethod
    async def create_quotation(db: AsyncSession, data: QuotationCreate, created_by_id: uuid.UUID) -> Quotation:
        quote_number = await CommerceService.generate_quote_number(db)
        
        subtotal, discount_amount, tax_amount, total_amount, calculated_items = (
            await CommerceService.calculate_quote_financials(
                db, data.items, data.discount_type, data.discount_value, data.tax_rate
            )
        )

        # Discount threshold check: if discount percentage > 15%, force pending approval
        discount_pct = Decimal("0.00")
        if subtotal > 0:
            discount_pct = (discount_amount / subtotal) * Decimal("100.00")

        status_value = "draft"
        if discount_pct > Decimal("15.00"):
            status_value = "pending_approval"
        else:
            status_value = "approved"  # Automatically approved if within margin

        quote = Quotation(
            account_id=data.account_id,
            contact_id=data.contact_id,
            quote_number=quote_number,
            status=status_value,
            subtotal=subtotal,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            discount_amount=discount_amount,
            tax_rate=data.tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            valid_until=data.valid_until,
            terms_conditions=data.terms_conditions,
            notes=data.notes,
            created_by=created_by_id
        )
        db.add(quote)
        await db.flush()  # get quote ID

        for c_item in calculated_items:
            q_item = QuotationItem(
                quotation_id=quote.id,
                product_id=c_item["product_id"],
                quantity=c_item["quantity"],
                unit_price=c_item["unit_price"],
                discount=c_item["discount"],
                subtotal=c_item["subtotal"],
                total=c_item["total"]
            )
            db.add(q_item)

        await db.commit()
        await db.refresh(quote)
        # load items relation
        result = await db.execute(
            select(Quotation)
            .options(selectinload(Quotation.items).selectinload(QuotationItem.product))
            .where(Quotation.id == quote.id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_quotation_by_id(db: AsyncSession, quote_id: uuid.UUID) -> Optional[Quotation]:
        result = await db.execute(
            select(Quotation)
            .options(
                selectinload(Quotation.items).selectinload(QuotationItem.product),
                selectinload(Quotation.account),
                selectinload(Quotation.contact)
            )
            .where(Quotation.id == quote_id, Quotation.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_quotations(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[Quotation], int]:
        query = select(Quotation).where(Quotation.deleted_at.is_(None))
        if status_filter:
            query = query.where(Quotation.status == status_filter)
        if account_id:
            query = query.where(Quotation.account_id == account_id)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Data
        result = await db.execute(
            query.options(selectinload(Quotation.account), selectinload(Quotation.contact))
            .offset(skip)
            .limit(limit)
            .order_by(Quotation.created_at.desc())
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def approve_quotation(db: AsyncSession, quote: Quotation, approve: bool, current_user: User) -> Quotation:
        # Verify role: only SUPER_ADMIN, ADMIN, or SALES_MANAGER
        allowed_roles = [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, UserRole.SALES_MANAGER.value]
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators or sales managers can approve/reject high-discount quotes."
            )

        if quote.status != "pending_approval":
            raise HTTPException(status_code=400, detail=f"Quotation is not pending approval (status: {quote.status})")

        quote.status = "approved" if approve else "rejected"
        quote.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(quote)
        return quote

    @staticmethod
    async def update_quotation(db: AsyncSession, quote: Quotation, data: QuotationUpdate) -> Quotation:
        if quote.status in ["accepted", "converted"]:
            raise HTTPException(status_code=400, detail="Cannot edit a quotation that has already been converted.")

        update_data = data.model_dump(exclude_unset=True)
        items_data = update_data.pop("items", None)

        for field, value in update_data.items():
            setattr(quote, field, value)

        if items_data is not None:
            # delete old items
            await db.execute(
                select(QuotationItem).where(QuotationItem.quotation_id == quote.id)
            )
            # clear and calculate new
            subtotal, discount_amount, tax_amount, total_amount, calculated_items = (
                await CommerceService.calculate_quote_financials(
                    db, items_data, quote.discount_type, quote.discount_value, quote.tax_rate
                )
            )
            quote.subtotal = subtotal
            quote.discount_amount = discount_amount
            quote.tax_amount = tax_amount
            quote.total_amount = total_amount

            # recalculate discount percentage for threshold checks
            discount_pct = (discount_amount / subtotal) * Decimal("100.00") if subtotal > 0 else Decimal("0.00")
            if discount_pct > Decimal("15.00"):
                quote.status = "pending_approval"
            else:
                quote.status = "approved"

            # Delete old items from db
            # SQL deletion
            from sqlalchemy import delete
            await db.execute(delete(QuotationItem).where(QuotationItem.quotation_id == quote.id))

            # insert new items
            for c_item in calculated_items:
                q_item = QuotationItem(
                    quotation_id=quote.id,
                    product_id=c_item["product_id"],
                    quantity=c_item["quantity"],
                    unit_price=c_item["unit_price"],
                    discount=c_item["discount"],
                    subtotal=c_item["subtotal"],
                    total=c_item["total"]
                )
                db.add(q_item)

        quote.updated_at = datetime.utcnow()
        await db.commit()
        
        # reload quote
        result = await db.execute(
            select(Quotation)
            .options(selectinload(Quotation.items).selectinload(QuotationItem.product))
            .where(Quotation.id == quote.id)
        )
        return result.scalar_one()

    @staticmethod
    async def delete_quotation(db: AsyncSession, quote: Quotation) -> None:
        quote.deleted_at = datetime.utcnow()
        await db.commit()


    # ── ORDER SERVICES ───────────────────────────────────────────────────────

    @staticmethod
    async def generate_order_number(db: AsyncSession) -> str:
        year = datetime.utcnow().strftime("%Y")
        result = await db.execute(select(func.count(Order.id)))
        count = result.scalar() or 0
        return f"ORD-{year}-{count + 1:04d}"

    @staticmethod
    async def convert_quote_to_order(db: AsyncSession, quote_id: uuid.UUID, created_by_id: uuid.UUID) -> Order:
        quote = await CommerceService.get_quotation_by_id(db, quote_id)
        if not quote:
            raise HTTPException(status_code=404, detail="Quotation not found.")
        
        if quote.status not in ["approved", "sent"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Quotation cannot be converted (status: {quote.status}). It must be approved or sent first."
            )

        order_number = await CommerceService.generate_order_number(db)

        # get addresses from Account if not defined
        shipping_addr = ""
        billing_addr = ""
        if quote.account:
            acc = quote.account
            addr = f"{acc.address_line1 or ''} {acc.address_line2 or ''}\n{acc.city or ''}, {acc.state or ''} {acc.zip_code or ''}\n{acc.country or ''}".strip()
            shipping_addr = addr
            billing_addr = addr

        order = Order(
            quotation_id=quote.id,
            account_id=quote.account_id,
            contact_id=quote.contact_id,
            order_number=order_number,
            status="pending",
            payment_status="unpaid",
            shipping_address=shipping_addr,
            billing_address=billing_addr,
            subtotal=quote.subtotal - quote.discount_amount,  # net subtotal for order
            tax_amount=quote.tax_amount,
            total_amount=quote.total_amount,
            created_by=created_by_id
        )
        db.add(order)
        await db.flush()

        for q_item in quote.items:
            o_item = OrderItem(
                order_id=order.id,
                product_id=q_item.product_id,
                quantity=q_item.quantity,
                unit_price=q_item.unit_price,
                subtotal=q_item.subtotal,
                total=q_item.total
            )
            db.add(o_item)

        # Update quotation status
        quote.status = "accepted"
        quote.updated_at = datetime.utcnow()
        await db.commit()
        
        # Load order fully
        res = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.account),
                selectinload(Order.contact)
            )
            .where(Order.id == order.id)
        )
        return res.scalar_one()

    @staticmethod
    async def create_order(db: AsyncSession, data: OrderCreate, created_by_id: uuid.UUID) -> Order:
        if data.quotation_id:
            return await CommerceService.convert_quote_to_order(db, data.quotation_id, created_by_id)

        # direct creation without a quote
        order_number = await CommerceService.generate_order_number(db)
        if not data.items:
            raise HTTPException(status_code=400, detail="Line items must be provided for direct orders.")

        subtotal = Decimal("0.00")
        calculated_items = []

        for item in data.items:
            res = await db.execute(select(Product).where(Product.id == item.product_id, Product.deleted_at.is_(None)))
            product = res.scalar_one_or_none()
            if not product:
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found.")

            price = Decimal(str(product.price))
            qty = Decimal(str(item.quantity))
            item_subtotal = price * qty
            item_total = item_subtotal - Decimal(str(item.discount))

            subtotal += item_total
            calculated_items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": price,
                "subtotal": item_subtotal,
                "total": item_total
            })

        # standard 18% GST tax rate
        tax_amount = subtotal * Decimal("0.18")
        total_amount = subtotal + tax_amount

        order = Order(
            account_id=data.account_id,
            contact_id=data.contact_id,
            order_number=order_number,
            status="pending",
            payment_status="unpaid",
            shipping_address=data.shipping_address,
            billing_address=data.billing_address,
            payment_method=data.payment_method,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes=data.notes,
            created_by=created_by_id
        )
        db.add(order)
        await db.flush()

        for c_item in calculated_items:
            o_item = OrderItem(
                order_id=order.id,
                product_id=c_item["product_id"],
                quantity=c_item["quantity"],
                unit_price=c_item["unit_price"],
                subtotal=c_item["subtotal"],
                total=c_item["total"]
            )
            db.add(o_item)

        await db.commit()
        await db.refresh(order)
        res = await db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.id == order.id)
        )
        return res.scalar_one()

    @staticmethod
    async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Optional[Order]:
        result = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.account),
                selectinload(Order.contact),
                selectinload(Order.quotation)
            )
            .where(Order.id == order_id, Order.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_orders(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
        payment_filter: Optional[str] = None,
        account_id: Optional[uuid.UUID] = None
    ) -> Tuple[List[Order], int]:
        query = select(Order).where(Order.deleted_at.is_(None))
        if status_filter:
            query = query.where(Order.status == status_filter)
        if payment_filter:
            query = query.where(Order.payment_status == payment_filter)
        if account_id:
            query = query.where(Order.account_id == account_id)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Data
        result = await db.execute(
            query.options(selectinload(Order.account), selectinload(Order.contact))
            .offset(skip)
            .limit(limit)
            .order_by(Order.created_at.desc())
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def update_order(db: AsyncSession, order: Order, data: OrderUpdate) -> Order:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)
        order.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(order)
        return order
