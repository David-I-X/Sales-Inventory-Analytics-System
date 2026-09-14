from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.schemas.inventory import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    InventoryMovementResponse,
    StockAdjustmentCreate,
    InventoryDashboardResponse,
    LowStockAlert,
)

router = APIRouter()

def _to_product_response(p: Product) -> ProductResponse:
    stock_val = Decimal(str(p.current_stock)) * p.cost_price
    is_low = p.current_stock <= p.min_stock
    return ProductResponse(
        id=p.id,
        sku=p.sku,
        name=p.name,
        description=p.description,
        category=p.category,
        unit_measure=p.unit_measure,
        sale_price=p.sale_price,
        cost_price=p.cost_price,
        current_stock=p.current_stock,
        min_stock=p.min_stock,
        is_active=p.is_active,
        stock_value=stock_val,
        is_low_stock=is_low,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )

# --- Products CRUD ---

@router.get("/products", response_model=List[ProductResponse])
@router.get("/products/", response_model=List[ProductResponse], include_in_schema=False)
def list_products(
    category: Optional[str] = None,
    low_stock_only: bool = False,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(Product)
    if is_active is not None:
        statement = statement.where(Product.is_active == is_active)
    if category:
        statement = statement.where(Product.category == category)
    
    products = session.exec(statement.order_by(Product.name)).all()
    
    if search:
        s = search.lower()
        products = [p for p in products if s in p.name.lower() or s in p.sku.lower()]
        
    if low_stock_only:
        products = [p for p in products if p.current_stock <= p.min_stock]
        
    return [_to_product_response(p) for p in products]

@router.post("/products", response_model=ProductResponse)
@router.post("/products/", response_model=ProductResponse, include_in_schema=False)
def create_product(
    product_in: ProductCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    # Check duplicate SKU
    existing = session.exec(select(Product).where(Product.sku == product_in.sku)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Ya existe un producto con el SKU '{product_in.sku}'")
    
    product = Product(
        sku=product_in.sku,
        name=product_in.name,
        description=product_in.description,
        category=product_in.category,
        unit_measure=product_in.unit_measure,
        sale_price=product_in.sale_price,
        cost_price=product_in.cost_price,
        current_stock=product_in.current_stock,
        min_stock=product_in.min_stock,
        is_active=True,
    )
    session.add(product)
    session.flush()
    
    # If initial stock > 0, create an initial inventory movement
    if product_in.current_stock > 0:
        movement = InventoryMovement(
            product_id=product.id,
            movement_type="entry",
            quantity=product_in.current_stock,
            unit_cost=product_in.cost_price,
            reference_type="manual_initial",
            notes="Inventario inicial al crear producto"
        )
        session.add(movement)
        
    session.flush()
    session.commit()
    return _to_product_response(product)

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _to_product_response(product)

@router.patch("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.flush()
    session.commit()
    return _to_product_response(product)

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Soft delete
    product.is_active = False
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.flush()
    session.commit()
    return {"message": "Producto desactivado exitosamente", "id": product_id}

# --- Inventory Movements & Adjustments ---

@router.get("/movements", response_model=List[InventoryMovementResponse])
@router.get("/movements/", response_model=List[InventoryMovementResponse], include_in_schema=False)
def list_movements(
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    limit: int = 100,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(InventoryMovement)
    if product_id:
        statement = statement.where(InventoryMovement.product_id == product_id)
    if movement_type:
        statement = statement.where(InventoryMovement.movement_type == movement_type)
        
    movements = session.exec(statement.order_by(InventoryMovement.created_at.desc()).limit(limit)).all()
    
    # Enrich with product name/sku
    products_map = {p.id: p for p in session.exec(select(Product)).all()}
    
    response = []
    for m in movements:
        prod = products_map.get(m.product_id)
        response.append(InventoryMovementResponse(
            id=m.id,
            product_id=m.product_id,
            product_name=prod.name if prod else "Desconocido",
            product_sku=prod.sku if prod else "N/A",
            movement_type=m.movement_type,
            quantity=m.quantity,
            unit_cost=m.unit_cost,
            reference_type=m.reference_type,
            reference_id=m.reference_id,
            notes=m.notes,
            created_by=m.created_by,
            created_at=m.created_at
        ))
    return response

@router.post("/adjustments", response_model=ProductResponse)
@router.post("/adjustments/", response_model=ProductResponse, include_in_schema=False)
def adjust_stock(
    adjustment: StockAdjustmentCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    product = session.get(Product, adjustment.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    old_stock = product.current_stock
    diff = adjustment.new_stock - old_stock
    
    if diff == 0:
        return _to_product_response(product)
    
    product.current_stock = adjustment.new_stock
    product.updated_at = datetime.utcnow()
    session.add(product)
    
    movement = InventoryMovement(
        product_id=product.id,
        movement_type="adjustment",
        quantity=diff,
        unit_cost=product.cost_price,
        reference_type="manual_adjustment",
        notes=f"{adjustment.reason} (Stock anterior: {old_stock} → Nuevo: {adjustment.new_stock})"
    )
    session.add(movement)
    session.flush()
    session.commit()
    return _to_product_response(product)

# --- Dashboard & Alerts ---

@router.get("/dashboard", response_model=InventoryDashboardResponse)
@router.get("/dashboard/", response_model=InventoryDashboardResponse, include_in_schema=False)
def get_inventory_dashboard(
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    products = session.exec(select(Product).where(Product.is_active == True)).all()
    
    total_val = Decimal("0.00")
    total_units = 0
    low_stock_items: List[LowStockAlert] = []
    
    for p in products:
        val = Decimal(str(p.current_stock)) * p.cost_price
        total_val += val
        total_units += p.current_stock
        
        if p.current_stock <= p.min_stock:
            low_stock_items.append(LowStockAlert(
                product_id=p.id,
                sku=p.sku,
                name=p.name,
                current_stock=p.current_stock,
                min_stock=p.min_stock,
                deficit=max(0, p.min_stock - p.current_stock)
            ))
            
    # Sort top products by stock
    top_products = sorted(products, key=lambda x: x.current_stock, reverse=True)[:5]
    top_stock_list = [
        {"sku": p.sku, "name": p.name, "stock": p.current_stock, "unit_measure": p.unit_measure}
        for p in top_products
    ]
    
    return InventoryDashboardResponse(
        total_products=len(products),
        total_inventory_value=total_val,
        total_units_in_stock=total_units,
        low_stock_count=len(low_stock_items),
        low_stock_items=low_stock_items,
        top_products_by_stock=top_stock_list
    )

@router.get("/alerts", response_model=List[LowStockAlert])
@router.get("/alerts/", response_model=List[LowStockAlert], include_in_schema=False)
def get_low_stock_alerts(
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    products = session.exec(select(Product).where(Product.is_active == True)).all()
    alerts = []
    for p in products:
        if p.current_stock <= p.min_stock:
            alerts.append(LowStockAlert(
                product_id=p.id,
                sku=p.sku,
                name=p.name,
                current_stock=p.current_stock,
                min_stock=p.min_stock,
                deficit=max(0, p.min_stock - p.current_stock)
            ))
    return alerts
