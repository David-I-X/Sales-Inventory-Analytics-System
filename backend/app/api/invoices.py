from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.contact import Contact
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.accounting_entry import AccountingEntry
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.services.dian_service import dian_service
from app.services.webhook_service import webhook_service

router = APIRouter()

@router.post("", response_model=InvoiceResponse, include_in_schema=False)
@router.post("/", response_model=InvoiceResponse)
async def create_invoice(
    invoice_in: InvoiceCreate,
    background_tasks: BackgroundTasks,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Crea una nueva factura en el esquema del tenant y la envía a la DIAN.
    """
    # 1. Verify contact exists in tenant schema
    contact = session.get(Contact, invoice_in.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    # 2. Calculate totals and serialize line items
    subtotal = Decimal("0.00")
    serialized_items = []
    
    for item in invoice_in.items:
        item_subtotal = Decimal(str(item.quantity * item.unit_price))
        subtotal += item_subtotal
        serialized_items.append(item.model_dump())
        
    tax = subtotal * Decimal("0.19")
    total = subtotal + tax
    
    # Generate sequential invoice number (e.g., SETT-0001)
    invoice_count = len(session.exec(select(Invoice)).all()) + 1
    invoice_number = f"SETT-{invoice_count:04d}"
    
    # 3. Envío a la DIAN a través de Factus API V2
    dian_response = await dian_service.send_invoice({
        "invoice_number": invoice_number,
        "subtotal": float(subtotal),
        "tax": float(tax),
        "total": float(total),
        "items": serialized_items,
        "customer": {
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "metadata": contact.metadata_ or {}
        }
    })
    
    # Si Factus asignó número consecutivo oficial de la DIAN (ej: SETP990018938), usarlo
    official_number = dian_response.get("number") or invoice_number

    # 4. Crear factura con respuesta de la DIAN en una sola transacción limpia
    invoice = Invoice(
        tenant_id=tenant.id,
        contact_id=contact.id,
        invoice_number=official_number,
        cufe=dian_response.get("cufe"),
        subtotal=subtotal,
        tax=tax,
        total=total,
        line_items=serialized_items,
        dian_status=dian_response.get("status", "accepted"),
        dian_response=dian_response,
        dian_responded_at=datetime.utcnow()
    )
    
    session.add(invoice)
    session.flush()
    
    # 5. AUTOMATIZACIÓN 1: Registrar ingreso automático en Contabilidad según modelo del tenant
    if invoice_in.commission_amount is not None and invoice_in.commission_amount > 0:
        # Modo Comisión: Se asienta únicamente el valor de la comisión de la plataforma
        accounting_entry = AccountingEntry(
            entry_type="income",
            amount=invoice_in.commission_amount,
            category="comisiones",
            description=f"Comisión Factura {invoice.invoice_number} - {contact.name}",
            reference_type="invoice",
            reference_id=invoice.id,
            entry_date=datetime.utcnow()
        )
        session.add(accounting_entry)
    elif invoice_in.auto_accounting:
        # Modo Venta Directa Estándar: Se asienta el 100% de la venta
        accounting_entry = AccountingEntry(
            entry_type="income",
            amount=total,
            category="ventas",
            description=f"Factura {invoice.invoice_number} - {contact.name}",
            reference_type="invoice",
            reference_id=invoice.id,
            entry_date=datetime.utcnow()
        )
        session.add(accounting_entry)
    
    # 6. AUTOMATIZACIÓN 2: Descontar stock y registrar salida en Inventario si el SKU existe
    for item in invoice_in.items:
        if item.sku:
            product = session.exec(select(Product).where(Product.sku == item.sku)).first()
            if product:
                product.current_stock -= item.quantity
                product.updated_at = datetime.utcnow()
                session.add(product)
                
                movement = InventoryMovement(
                    product_id=product.id,
                    movement_type="exit",
                    quantity=-item.quantity,
                    unit_cost=product.cost_price,
                    reference_type="invoice",
                    reference_id=invoice.id,
                    notes=f"Venta en Factura #{invoice.invoice_number} a {contact.name}"
                )
                session.add(movement)
    
    session.commit()
    
    # 7. Notificar por Webhook en segundo plano si el tenant configuró webhook_url
    if tenant.webhook_url:
        payload = {
            "event": "invoice.status_updated",
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "cufe": invoice.cufe,
            "status": invoice.dian_status
        }
        background_tasks.add_task(webhook_service.send_webhook, tenant.webhook_url, payload, tenant.webhook_secret)
        
    return invoice

@router.get("", response_model=List[InvoiceResponse], include_in_schema=False)
@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(Invoice).offset(skip).limit(limit)
    return session.exec(statement).all()

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
