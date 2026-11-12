"""
api/quotes.py — Endpoints para Cotizaciones y Presupuestos de Servicios / Productos.
Protegido por el guard modular require_module("quotes").
"""
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy import text
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.core.module_guard import require_module
from app.models.tenant import Tenant
from app.models.contact import Contact
from app.models.quote import Quote
from app.models.invoice import Invoice
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.accounting_entry import AccountingEntry
from app.schemas.quote import (
    QuoteCreate,
    QuoteUpdate,
    QuoteStatusUpdate,
    QuoteResponse,
    ConvertToInvoiceResponse
)
from app.services.dian_service import dian_service
from app.services.webhook_service import webhook_service

router = APIRouter(dependencies=[Depends(require_module("quotes"))])

def _calculate_totals(items: list, tax_rate: Decimal, discount: Decimal):
    """Calcula subtotales, impuestos y totales de una lista de ítems."""
    subtotal = Decimal("0.00")
    serialized_items = []
    
    for it in items:
        qty = Decimal(str(it.quantity if hasattr(it, 'quantity') else it.get('quantity', 1)))
        price = Decimal(str(it.unit_price if hasattr(it, 'unit_price') else it.get('unit_price', 0)))
        item_disc = Decimal(str(it.discount if hasattr(it, 'discount') else it.get('discount', 0)))
        
        item_subtotal = (qty * price) - item_disc
        if item_subtotal < 0:
            item_subtotal = Decimal("0.00")
            
        subtotal += item_subtotal
        
        serialized_items.append({
            "description": it.description if hasattr(it, 'description') else it.get('description', ''),
            "quantity": float(qty),
            "unit_price": float(price),
            "discount": float(item_disc),
            "subtotal": float(item_subtotal),
            "sku": it.sku if hasattr(it, 'sku') else it.get('sku'),
            "item_type": it.item_type if hasattr(it, 'item_type') else it.get('item_type', 'service')
        })
        
    tax = (subtotal - discount) * tax_rate
    if tax < 0:
        tax = Decimal("0.00")
    total = (subtotal - discount) + tax
    if total < 0:
        total = Decimal("0.00")
        
    return subtotal, tax, total, serialized_items


@router.post("", response_model=QuoteResponse, include_in_schema=False)
@router.post("/", response_model=QuoteResponse)
def create_quote(
    quote_in: QuoteCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Crea una nueva cotización formal en el esquema del tenant.
    Asigna un consecutivo único COT-XXXX.
    """
    contact_name = None
    if quote_in.contact_id:
        contact = session.get(Contact, quote_in.contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="El contacto especificado no existe.")
        contact_name = contact.name

    # Generar consecutivo correlativo (ej: COT-0001)
    quote_count = len(session.exec(select(Quote)).all()) + 1
    quote_number = f"COT-{quote_count:04d}"

    subtotal, tax, total, serialized_items = _calculate_totals(
        quote_in.items, quote_in.tax_rate, quote_in.discount
    )

    now = datetime.now(timezone.utc)
    valid_until = quote_in.valid_until
    if valid_until is not None and valid_until.tzinfo is None:
        valid_until = valid_until.replace(tzinfo=timezone.utc)
    
    quote = Quote(
        quote_number=quote_number,
        contact_id=quote_in.contact_id,
        title=quote_in.title,
        status="draft",
        subtotal=subtotal,
        tax_rate=quote_in.tax_rate,
        tax=tax,
        discount=quote_in.discount,
        total=total,
        items=serialized_items,
        terms=quote_in.terms,
        notes=quote_in.notes,
        issued_at=now,
        updated_at=now
    )
    if valid_until is not None:
        quote.valid_until = valid_until

    session.add(quote)
    session.commit()

    resp = QuoteResponse.model_validate(quote.model_dump())
    resp.contact_name = contact_name
    return resp


@router.get("", response_model=List[QuoteResponse], include_in_schema=False)
@router.get("/", response_model=List[QuoteResponse])
def list_quotes(
    status: Optional[str] = Query(None, description="Filtrar por estado (draft, sent, approved, rejected, invoiced)"),
    search: Optional[str] = Query(None, description="Búsqueda por número o título"),
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Lista todas las cotizaciones del tenant con sus contactos relacionados.
    """
    statement = select(Quote)
    if status:
        statement = statement.where(Quote.status == status)
    
    quotes = session.exec(statement.order_by(Quote.id.desc())).all()
    
    # Pre-cargar contactos para resolución rápida de nombres
    contact_ids = [q.contact_id for q in quotes if q.contact_id]
    contacts_map = {}
    if contact_ids:
        contacts = session.exec(select(Contact).where(Contact.id.in_(contact_ids))).all()
        contacts_map = {c.id: c.name for c in contacts}

    results = []
    for q in quotes:
        if search:
            match_number = search.lower() in q.quote_number.lower()
            match_title = search.lower() in q.title.lower()
            c_name = contacts_map.get(q.contact_id, "")
            match_contact = search.lower() in c_name.lower()
            if not (match_number or match_title or match_contact):
                continue
                
        resp = QuoteResponse.model_validate(q.model_dump())
        resp.contact_name = contacts_map.get(q.contact_id)
        results.append(resp)
        
    return results


@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote(
    quote_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """Obtiene los detalles completos de una cotización."""
    quote = session.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")
        
    contact_name = None
    if quote.contact_id:
        contact = session.get(Contact, quote.contact_id)
        if contact:
            contact_name = contact.name

    resp = QuoteResponse.model_validate(quote.model_dump())
    resp.contact_name = contact_name
    return resp


@router.put("/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: int,
    quote_in: QuoteUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Actualiza una cotización existente durante la negociación comercial:
    modifica ítems, cantidades, precios unitarios, vigencia, notas o términos.
    
    REGLA DE NEGOCIO: No se puede modificar una cotización que ya fue facturada (invoiced).
    """
    quote = session.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")

    if quote.status == "invoiced":
        raise HTTPException(
            status_code=400,
            detail="La cotización ya fue facturada electrónicamente ante la DIAN y no puede modificarse por motivos de trazabilidad contable."
        )

    # Actualizar contacto si cambió
    if quote_in.contact_id is not None:
        if quote_in.contact_id != quote.contact_id:
            contact = session.get(Contact, quote_in.contact_id)
            if not contact:
                raise HTTPException(status_code=404, detail="El contacto especificado no existe.")
            quote.contact_id = quote_in.contact_id

    if quote_in.title is not None:
        quote.title = quote_in.title
    if quote_in.terms is not None:
        quote.terms = quote_in.terms
    if quote_in.notes is not None:
        quote.notes = quote_in.notes
    if quote_in.valid_until is not None:
        val_until = quote_in.valid_until
        if val_until.tzinfo is None:
            val_until = val_until.replace(tzinfo=timezone.utc)
        quote.valid_until = val_until
    if quote_in.status is not None:
        if quote_in.status not in ["draft", "sent", "approved", "rejected"]:
            raise HTTPException(status_code=400, detail=f"Estado '{quote_in.status}' no válido.")
        quote.status = quote_in.status

    tax_rate = quote_in.tax_rate if quote_in.tax_rate is not None else quote.tax_rate
    discount = quote_in.discount if quote_in.discount is not None else quote.discount
    quote.tax_rate = tax_rate
    quote.discount = discount

    # Recalcular totales si se actualizaron los ítems o las tasas
    if quote_in.items is not None:
        subtotal, tax, total, serialized_items = _calculate_totals(
            quote_in.items, tax_rate, discount
        )
        quote.subtotal = subtotal
        quote.tax = tax
        quote.total = total
        quote.items = serialized_items
    else:
        # Recalcular con los ítems existentes en caso de cambio de tasa o descuento
        subtotal, tax, total, _ = _calculate_totals(
            quote.items, tax_rate, discount
        )
        quote.subtotal = subtotal
        quote.tax = tax
        quote.total = total

    quote.updated_at = datetime.now(timezone.utc)

    session.add(quote)
    session.commit()

    contact_name = None
    if quote.contact_id:
        c = session.get(Contact, quote.contact_id)
        if c:
            contact_name = c.name

    resp = QuoteResponse.model_validate(quote.model_dump())
    resp.contact_name = contact_name
    return resp


@router.patch("/{quote_id}/status", response_model=QuoteResponse)
def update_quote_status(
    quote_id: int,
    status_in: QuoteStatusUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Cambio rápido de estado de la cotización (draft -> sent -> approved -> rejected).
    """
    quote = session.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")

    if quote.status == "invoiced":
        raise HTTPException(
            status_code=400,
            detail="La cotización ya fue facturada y no puede cambiar de estado."
        )

    if status_in.status not in ["draft", "sent", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Estado '{status_in.status}' no válido.")

    quote.status = status_in.status
    quote.updated_at = datetime.now(timezone.utc)

    session.add(quote)
    session.commit()

    contact_name = None
    if quote.contact_id:
        c = session.get(Contact, quote.contact_id)
        if c:
            contact_name = c.name

    resp = QuoteResponse.model_validate(quote.model_dump())
    resp.contact_name = contact_name
    return resp


@router.post("/{quote_id}/convert-to-invoice", response_model=ConvertToInvoiceResponse)
async def convert_quote_to_invoice(
    quote_id: int,
    background_tasks: BackgroundTasks,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Convierte una cotización aprobada directamente en Factura Electrónica DIAN.
    
    1. Verifica que el módulo 'dian_invoicing' esté activo.
    2. Envía la factura a la DIAN vía Factus API V2.
    3. Asienta en contabilidad si 'accounting' está activo.
    4. Descuenta inventario si 'inventory' está activo y hay productos físicos con SKU.
    5. Actualiza la cotización a 'invoiced' y vincula el invoice_id y número oficial.
    """
    # 1. Validar que la herramienta dian_invoicing esté activa para la empresa
    modules = tenant.enabled_modules or []
    if "dian_invoicing" not in modules:
        raise HTTPException(
            status_code=403,
            detail="Para emitir facturas electrónicas debe activar la herramienta 'Facturación Electrónica DIAN' en el Centro de Herramientas."
        )

    quote = session.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada.")

    if quote.status == "invoiced":
        raise HTTPException(
            status_code=400,
            detail=f"Esta cotización ya fue facturada previamente con el número {quote.invoice_number}."
        )

    # 2. Verificar contacto
    if not quote.contact_id:
        raise HTTPException(
            status_code=400,
            detail="La cotización debe tener un cliente/contacto asociado antes de ser facturada ante la DIAN."
        )
    contact = session.get(Contact, quote.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="El cliente asociado a la cotización no existe.")

    # 3. Preparar ítems para Factus API V2
    invoice_count = len(session.exec(select(Invoice)).all()) + 1
    invoice_number = f"SETT-{invoice_count:04d}"

    factus_items = []
    for item in quote.items:
        factus_items.append({
            "name": item.get("description", "Servicio Profesional"),
            "quantity": float(item.get("quantity", 1)),
            "unit_price": float(item.get("unit_price", 0)),
            "sku": item.get("sku")
        })

    # 4. Envío a la DIAN vía Factus API V2
    dian_response = await dian_service.send_invoice({
        "invoice_number": invoice_number,
        "subtotal": float(quote.subtotal),
        "tax": float(quote.tax),
        "total": float(quote.total),
        "items": factus_items,
        "customer": {
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "metadata": contact.metadata_ or {}
        }
    })

    official_number = dian_response.get("number") or invoice_number

    # 5. Crear la Factura en el esquema del tenant
    invoice = Invoice(
        tenant_id=tenant.id,
        contact_id=contact.id,
        invoice_number=official_number,
        cufe=dian_response.get("cufe"),
        subtotal=quote.subtotal,
        tax=quote.tax,
        total=quote.total,
        line_items=quote.items,
        dian_status=dian_response.get("status", "accepted"),
        dian_response=dian_response,
        issued_at=datetime.now(timezone.utc),
        dian_responded_at=datetime.now(timezone.utc)
    )
    session.add(invoice)
    session.flush()

    # 6. Automatización Contable si 'accounting' está activo
    if "accounting" in modules:
        entry = AccountingEntry(
            entry_type="income",
            amount=quote.total,
            category="ventas",
            description=f"Factura {invoice.invoice_number} (Origen: {quote.quote_number}) - {contact.name}",
            reference_type="invoice",
            reference_id=invoice.id,
            entry_date=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        session.add(entry)

    # 7. Automatización de Stock si 'inventory' está activo
    if "inventory" in modules:
        for item in quote.items:
            sku = item.get("sku")
            if sku:
                qty = int(item.get("quantity", 0))
                prod = session.exec(select(Product).where(Product.sku == sku)).first()
                if prod:
                    prod.current_stock -= qty
                    session.add(prod)
                    mov = InventoryMovement(
                        product_id=prod.id,
                        movement_type="out",
                        quantity=qty,
                        unit_cost=prod.cost_price,
                        reference_type="invoice",
                        reference_id=invoice.id,
                        notes=f"Salida Factura {invoice.invoice_number} desde {quote.quote_number}"
                    )
                    session.add(mov)

    # 8. Actualizar estado de la cotización
    quote.status = "invoiced"
    quote.invoice_id = invoice.id
    quote.invoice_number = official_number
    quote.updated_at = datetime.now(timezone.utc)
    session.add(quote)

    session.commit()

    # 9. Webhook en segundo plano si está configurado
    if tenant.webhook_url:
        payload = {
            "event": "quote.converted_to_invoice",
            "quote_id": quote.id,
            "quote_number": quote.quote_number,
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "total": float(invoice.total),
            "cufe": invoice.cufe
        }
        background_tasks.add_task(
            webhook_service.send_webhook,
            tenant.webhook_url,
            payload,
            tenant.webhook_secret
        )

    return ConvertToInvoiceResponse(
        quote_id=quote.id,
        quote_number=quote.quote_number,
        status="invoiced",
        invoice_id=invoice.id,
        invoice_number=official_number,
        total=invoice.total,
        cufe=invoice.cufe,
        message=f"Cotización {quote.quote_number} convertida exitosamente a Factura DIAN {official_number}."
    )
