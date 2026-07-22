import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_admin, require_permission, Permission, Resource
from app.models.user import User
from app.schemas import APIResponse, PaginationMeta
from app.schemas.commerce import (
    ProductCreate, ProductResponse, ProductUpdate,
    QuotationCreate, QuotationResponse, QuotationUpdate,
    OrderCreate, OrderResponse, OrderUpdate, ApprovalActionRequest
)
from app.services.commerce import CommerceService

router = APIRouter(prefix="/commerce", tags=["Commerce"])

# ── PRODUCTS ENDPOINTS ───────────────────────────────────────────────────────

@router.post("/products", response_model=APIResponse[ProductResponse], status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.PRODUCTS, Permission.CREATE))
):
    product = await CommerceService.create_product(db, data)
    return APIResponse(success=True, data=ProductResponse.model_validate(product), message="Product created successfully")

@router.get("/products", response_model=APIResponse[list[ProductResponse]])
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user)
):
    products, total = await CommerceService.get_products(db, skip=skip, limit=limit, search=search, active_only=active_only)
    meta = PaginationMeta(page=(skip // limit) + 1, per_page=limit, total=total, total_pages=(total + limit - 1) // limit)
    return APIResponse(success=True, data=[ProductResponse.model_validate(p) for p in products], meta=meta)

@router.get("/products/{product_id}", response_model=APIResponse[ProductResponse])
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user)
):
    product = await CommerceService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return APIResponse(success=True, data=ProductResponse.model_validate(product))

@router.put("/products/{product_id}", response_model=APIResponse[ProductResponse])
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.PRODUCTS, Permission.UPDATE))
):
    product = await CommerceService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await CommerceService.update_product(db, product, data)
    return APIResponse(success=True, data=ProductResponse.model_validate(updated), message="Product updated successfully")

@router.delete("/products/{product_id}", response_model=APIResponse[None])
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.PRODUCTS, Permission.DELETE))
):
    product = await CommerceService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await CommerceService.delete_product(db, product)
    return APIResponse(success=True, data=None, message="Product deleted successfully")


# ── QUOTATIONS ENDPOINTS ──────────────────────────────────────────────────────

@router.post("/quotations", response_model=APIResponse[QuotationResponse], status_code=201)
async def create_quotation(
    data: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Resource.QUOTES, Permission.CREATE))
):
    quote = await CommerceService.create_quotation(db, data, current_user.id)
    msg = "Quotation saved as draft" if quote.status == "draft" else ("Quotation submitted for review" if quote.status == "pending_approval" else "Quotation created and approved")
    return APIResponse(success=True, data=QuotationResponse.model_validate(quote), message=msg)

@router.get("/quotations", response_model=APIResponse[list[QuotationResponse]])
async def list_quotations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    account_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.QUOTES, Permission.READ_ALL))
):
    quotes, total = await CommerceService.get_quotations(db, skip=skip, limit=limit, status_filter=status_filter, account_id=account_id)
    meta = PaginationMeta(page=(skip // limit) + 1, per_page=limit, total=total, total_pages=(total + limit - 1) // limit)
    return APIResponse(success=True, data=[QuotationResponse.model_validate(q) for q in quotes], meta=meta)

@router.get("/quotations/{quote_id}", response_model=APIResponse[QuotationResponse])
async def get_quotation(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.QUOTES, Permission.READ_ALL))
):
    quote = await CommerceService.get_quotation_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return APIResponse(success=True, data=QuotationResponse.model_validate(quote))

@router.put("/quotations/{quote_id}", response_model=APIResponse[QuotationResponse])
async def update_quotation(
    quote_id: uuid.UUID,
    data: QuotationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.QUOTES, Permission.UPDATE))
):
    quote = await CommerceService.get_quotation_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    updated = await CommerceService.update_quotation(db, quote, data)
    return APIResponse(success=True, data=QuotationResponse.model_validate(updated), message="Quotation updated successfully")

@router.delete("/quotations/{quote_id}", response_model=APIResponse[None])
async def delete_quotation(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.QUOTES, Permission.DELETE))
):
    quote = await CommerceService.get_quotation_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    await CommerceService.delete_quotation(db, quote)
    return APIResponse(success=True, data=None, message="Quotation deleted successfully")

@router.post("/quotations/{quote_id}/approve", response_model=APIResponse[QuotationResponse])
async def approve_quotation(
    quote_id: uuid.UUID,
    data: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Resource.QUOTES, Permission.APPROVE))
):
    quote = await CommerceService.get_quotation_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    updated = await CommerceService.approve_quotation(db, quote, data.approved, current_user)
    msg = "Quotation approved" if data.approved else "Quotation rejected"
    return APIResponse(success=True, data=QuotationResponse.model_validate(updated), message=msg)

@router.post("/quotations/{quote_id}/convert", response_model=APIResponse[OrderResponse])
async def convert_quotation(
    quote_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Resource.ORDERS, Permission.CREATE))
):
    order = await CommerceService.convert_quote_to_order(db, quote_id, current_user.id)
    return APIResponse(success=True, data=OrderResponse.model_validate(order), message="Quotation successfully converted to Order")


# ── ORDERS ENDPOINTS ─────────────────────────────────────────────────────────

@router.post("/orders", response_model=APIResponse[OrderResponse], status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(Resource.ORDERS, Permission.CREATE))
):
    order = await CommerceService.create_order(db, data, current_user.id)
    return APIResponse(success=True, data=OrderResponse.model_validate(order), message="Order created successfully")

@router.get("/orders", response_model=APIResponse[list[OrderResponse]])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_filter: Optional[str] = Query(None, alias="payment_status"),
    account_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.ORDERS, Permission.READ_ALL))
):
    orders, total = await CommerceService.get_orders(db, skip=skip, limit=limit, status_filter=status_filter, payment_filter=payment_filter, account_id=account_id)
    meta = PaginationMeta(page=(skip // limit) + 1, per_page=limit, total=total, total_pages=(total + limit - 1) // limit)
    return APIResponse(success=True, data=[OrderResponse.model_validate(o) for o in orders], meta=meta)

@router.get("/orders/{order_id}", response_model=APIResponse[OrderResponse])
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.ORDERS, Permission.READ_ALL))
):
    order = await CommerceService.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return APIResponse(success=True, data=OrderResponse.model_validate(order))

@router.put("/orders/{order_id}", response_model=APIResponse[OrderResponse])
async def update_order(
    order_id: uuid.UUID,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission(Resource.ORDERS, Permission.UPDATE))
):
    order = await CommerceService.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    updated = await CommerceService.update_order(db, order, data)
    return APIResponse(success=True, data=OrderResponse.model_validate(updated), message="Order updated successfully")


# ── PRINTABLE LAYOUTS ENDPOINTS (HTML PREVIEWS) ───────────────────────────────

@router.get("/quotations/{quote_id}/print", response_class=HTMLResponse)
async def print_quotation(
    quote_id: uuid.UUID,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    from app.core.security import decode_access_token
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    quote = await CommerceService.get_quotation_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    items_html = ""
    for idx, item in enumerate(quote.items):
        prod_name = item.product.name if item.product else "Deleted Product"
        sku = item.product.sku if item.product else "N/A"
        items_html += f"""
        <tr>
          <td>{idx + 1}</td>
          <td><strong>{prod_name}</strong><br><small style="color: #666">SKU: {sku}</small></td>
          <td>{item.quantity}</td>
          <td>${item.unit_price:,.2f}</td>
          <td>${item.discount:,.2f}</td>
          <td style="text-align: right"><strong>${item.total:,.2f}</strong></td>
        </tr>
        """

    valid_str = quote.valid_until.strftime("%B %d, %Y") if quote.valid_until else "N/A"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quotation {quote.quote_number}</title>
      <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; color: #333; margin: 40px; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #4f46e5; }}
        .badge {{ background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .badge.approved {{ background: #def7ec; color: #03543f; }}
        .badge.pending {{ background: #fef3c7; color: #92400e; }}
        .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }}
        .info-box h3 {{ border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: #6b7280; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 40px; }}
        th {{ background: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #4b5563; }}
        td {{ padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }}
        .totals {{ display: flex; flex-direction: column; align-items: flex-end; }}
        .totals-row {{ display: flex; justify-content: space-between; width: 300px; padding: 8px 0; font-size: 14px; }}
        .totals-row.grand {{ font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 12px; color: #111827; }}
        .print-btn {{ background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }}
        @media print {{
          body {{ margin: 20px; }}
          .no-print {{ display: none !important; }}
        }}
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Print Quotation</button>
      <div class="header">
        <div>
          <div class="logo">SANNA CRM</div>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Customer Quotation</p>
        </div>
        <div style="text-align: right">
          <h2 style="margin: 0; font-size: 20px;">{quote.quote_number}</h2>
          <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Date: {quote.created_at.strftime("%B %d, %Y")}</p>
          <span class="badge {quote.status}">{quote.status}</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Customer Details</h3>
          <strong>{quote.account.name}</strong><br>
          {f"Contact: {quote.contact.first_name} {quote.contact.last_name}<br>" if quote.contact else ""}
          {f"Email: {quote.contact.email or ''}<br>" if quote.contact else ""}
          {f"Phone: {quote.contact.phone or ''}" if quote.contact else ""}
        </div>
        <div class="info-box" style="text-align: right">
          <h3>Validity & Terms</h3>
          <p style="margin: 4px 0;"><strong>Valid Until:</strong> {valid_str}</p>
          <p style="margin: 4px 0;"><strong>Tax Rate:</strong> {quote.tax_rate}%</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px">#</th>
            <th>Product / Service</th>
            <th style="width: 80px">Qty</th>
            <th style="width: 120px">Unit Price</th>
            <th style="width: 120px">Discount</th>
            <th style="width: 120px; text-align: right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items_html}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span style="color: #6b7280">Subtotal</span>
          <span>${quote.subtotal:,.2f}</span>
        </div>
        <div class="totals-row">
          <span style="color: #6b7280">Discount ({quote.discount_value} {f"%" if quote.discount_type == "percentage" else "$"})</span>
          <span style="color: #dc2626">-${quote.discount_amount:,.2f}</span>
        </div>
        <div class="totals-row">
          <span style="color: #6b7280">Tax ({quote.tax_rate}%)</span>
          <span>${quote.tax_amount:,.2f}</span>
        </div>
        <div class="totals-row grand">
          <span>Total Amount</span>
          <span>${quote.total_amount:,.2f}</span>
        </div>
      </div>

      {f'<div style="margin-top: 50px; font-size: 13px; color: #6b7280; border-top: 1px solid #eee; padding-top: 20px;"><strong>Terms & Conditions:</strong><br>{quote.terms_conditions}</div>' if quote.terms_conditions else ''}
      {f'<div style="margin-top: 20px; font-size: 13px; color: #6b7280;"><strong>Notes:</strong><br>{quote.notes}</div>' if quote.notes else ''}
    </body>
    </html>
    """

@router.get("/orders/{order_id}/print", response_class=HTMLResponse)
async def print_invoice(
    order_id: uuid.UUID,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    from app.core.security import decode_access_token
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    order = await CommerceService.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_html = ""
    for idx, item in enumerate(order.items):
        prod_name = item.product.name if item.product else "Deleted Product"
        sku = item.product.sku if item.product else "N/A"
        items_html += f"""
        <tr>
          <td>{idx + 1}</td>
          <td><strong>{prod_name}</strong><br><small style="color: #666">SKU: {sku}</small></td>
          <td>{item.quantity}</td>
          <td>${item.unit_price:,.2f}</td>
          <td style="text-align: right"><strong>${item.total:,.2f}</strong></td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice {order.order_number}</title>
      <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; color: #333; margin: 40px; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #4f46e5; }}
        .badge {{ background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .badge.paid {{ background: #def7ec; color: #03543f; }}
        .badge.unpaid {{ background: #fde8e8; color: #9b1c1c; }}
        .badge.partial {{ background: #fef3c7; color: #92400e; }}
        .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }}
        .info-box {{ font-size: 14px; }}
        .info-box h3 {{ border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; font-size: 12px; text-transform: uppercase; color: #6b7280; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 40px; }}
        th {{ background: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #4b5563; }}
        td {{ padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }}
        .totals {{ display: flex; flex-direction: column; align-items: flex-end; }}
        .totals-row {{ display: flex; justify-content: space-between; width: 300px; padding: 8px 0; font-size: 14px; }}
        .totals-row.grand {{ font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 12px; color: #111827; }}
        .print-btn {{ background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }}
        @media print {{
          body {{ margin: 20px; }}
          .no-print {{ display: none !important; }}
        }}
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Print Invoice</button>
      <div class="header">
        <div>
          <div class="logo">SANNA CRM</div>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">TAX INVOICE</p>
        </div>
        <div style="text-align: right">
          <h2 style="margin: 0; font-size: 20px;">{order.order_number}</h2>
          <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">Date: {order.created_at.strftime("%B %d, %Y")}</p>
          <span class="badge {order.payment_status}">{order.payment_status}</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Bill To</h3>
          <strong>{order.account.name}</strong><br>
          {f"Contact: {order.contact.first_name} {order.contact.last_name}<br>" if order.contact else ""}
          {order.billing_address.replace('\n', '<br>') if order.billing_address else ''}
        </div>
        <div class="info-box">
          <h3>Ship To</h3>
          <strong>{order.account.name}</strong><br>
          {order.shipping_address.replace('\n', '<br>') if order.shipping_address else ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50px">#</th>
            <th>Item Details</th>
            <th style="width: 80px">Qty</th>
            <th style="width: 120px">Unit Price</th>
            <th style="width: 120px; text-align: right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items_html}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span style="color: #6b7280">Net Total</span>
          <span>${order.subtotal:,.2f}</span>
        </div>
        <div class="totals-row">
          <span style="color: #6b7280">GST Tax</span>
          <span>${order.tax_amount:,.2f}</span>
        </div>
        <div class="totals-row grand">
          <span>Invoice Total</span>
          <span>${order.total_amount:,.2f}</span>
        </div>
      </div>

      {f'<div style="margin-top: 50px; font-size: 13px; color: #6b7280; border-top: 1px solid #eee; padding-top: 20px;"><strong>Notes:</strong><br>{order.notes}</div>' if order.notes else ''}
    </body>
    </html>
    """
