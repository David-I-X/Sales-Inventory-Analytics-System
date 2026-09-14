from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime

from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.accounting_entry import AccountingEntry
from app.schemas.inventory import (
    PurchaseCreate,
    PurchaseResponse,
)

router = APIRouter()

def _to_purchase_response(p: Purchase, supplier_name: Optional[str] = None) -> PurchaseResponse:
    return PurchaseResponse(
        id=p.id,
        supplier_id=p.supplier_id,
        supplier_name=supplier_name,
        purchase_number=p.purchase_number,
        items=p.items or [],
        subtotal=p.subtotal,
        tax=p.tax,
        total=p.total,
        notes=p.notes,
        created_by=p.created_by,
        created_at=p.created_at,
    )

@router.get("", response_model=List[PurchaseResponse])
@router.get("/", response_model=List[PurchaseResponse], include_in_schema=False)
def list_purchases(
    supplier_id: Optional[int] = None,
    limit: int = 100,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(Purchase)
    if supplier_id:
        statement = statement.where(Purchase.supplier_id == supplier_id)
        
    purchases = session.exec(statement.order_by(Purchase.created_at.desc()).limit(limit)).all()
    
    suppliers_map = {s.id: s.name for s in session.exec(select(Supplier)).all()}
    
    return [_to_purchase_response(p, suppliers_map.get(p.supplier_id)) for p in purchases]

@router.post("", response_model=PurchaseResponse)
@router.post("/", response_model=PurchaseResponse, include_in_schema=False)
def create_purchase(
    purchase_in: PurchaseCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    if not purchase_in.items:
        raise HTTPException(status_code=400, detail="La compra debe contener al menos un producto")
        
    supplier = None
    if purchase_in.supplier_id:
        supplier = session.get(Supplier, purchase_in.supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")
            
    # Generate sequential purchase number (COMP-0001)
    purchase_count = len(session.exec(select(Purchase)).all()) + 1
    purchase_number = f"COMP-{purchase_count:04d}"
    
    # Process items and calculate totals
    subtotal = Decimal("0.00")
    serialized_items = []
    
    for item_in in purchase_in.items:
        product = session.get(Product, item_in.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item_in.product_id} no encontrado")
            
        line_subtotal = Decimal(str(item_in.quantity)) * item_in.unit_cost
        subtotal += line_subtotal
        
        serialized_items.append({
            "product_id": product.id,
            "sku": product.sku,
            "name": product.name,
            "quantity": item_in.quantity,
            "unit_cost": float(item_in.unit_cost),
            "subtotal": float(line_subtotal)
        })
        
        # 1. Update Product stock & latest cost
        product.current_stock += item_in.quantity
        product.cost_price = item_in.unit_cost
        product.updated_at = datetime.utcnow()
        session.add(product)
        
    tax = subtotal * purchase_in.tax_rate
    total = subtotal + tax
    
    # 2. Create Purchase record
    purchase = Purchase(
        supplier_id=purchase_in.supplier_id,
        purchase_number=purchase_number,
        items=serialized_items,
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=purchase_in.notes
    )
    session.add(purchase)
    session.flush()
    
    # 3. Create Inventory Movements for each item
    for item in serialized_items:
        movement = InventoryMovement(
            product_id=item["product_id"],
            movement_type="entry",
            quantity=item["quantity"],
            unit_cost=Decimal(str(item["unit_cost"])),
            reference_type="purchase",
            reference_id=purchase.id,
            notes=f"Compra #{purchase.purchase_number}" + (f" ({supplier.name})" if supplier else "")
        )
        session.add(movement)
        
    # 4. Create Accounting Expense Entry automatically
    supplier_label = supplier.name if supplier else "Proveedor General"
    accounting_entry = AccountingEntry(
        entry_type="expense",
        amount=total,
        category="proveedores",
        description=f"Compra {purchase.purchase_number} - {supplier_label}",
        reference_type="purchase",
        reference_id=purchase.id,
        entry_date=datetime.utcnow()
    )
    session.add(accounting_entry)
    
    session.flush()
    session.commit()
    return _to_purchase_response(purchase, supplier.name if supplier else None)

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    purchase = session.get(Purchase, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
        
    supplier_name = None
    if purchase.supplier_id:
        sup = session.get(Supplier, purchase.supplier_id)
        if sup:
            supplier_name = sup.name
            
    return _to_purchase_response(purchase, supplier_name)
