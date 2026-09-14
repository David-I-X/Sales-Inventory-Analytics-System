from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# --- Products ---
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_measure: str = "unidad"
    sale_price: Decimal = Decimal("0.00")
    cost_price: Decimal = Decimal("0.00")
    min_stock: int = 5

class ProductCreate(ProductBase):
    current_stock: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_measure: Optional[str] = None
    sale_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    min_stock: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    current_stock: int
    is_active: bool
    stock_value: Decimal = Decimal("0.00")
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Suppliers ---
class SupplierBase(BaseModel):
    name: str
    nit: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    nit: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Inventory Movements ---
class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    movement_type: str
    quantity: int
    unit_cost: Decimal
    reference_type: str
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    product_id: int
    new_stock: int
    reason: str = "Ajuste de inventario físico"

# --- Purchases ---
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)

class PurchaseCreate(BaseModel):
    supplier_id: Optional[int] = None
    items: List[PurchaseItemCreate]
    tax_rate: Decimal = Decimal("0.19")
    notes: Optional[str] = None

class PurchaseResponse(BaseModel):
    id: int
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    purchase_number: str
    items: List[Dict[str, Any]]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & KPIs ---
class LowStockAlert(BaseModel):
    product_id: int
    sku: str
    name: str
    current_stock: int
    min_stock: int
    deficit: int

class InventoryDashboardResponse(BaseModel):
    total_products: int
    total_inventory_value: Decimal
    total_units_in_stock: int
    low_stock_count: int
    low_stock_items: List[LowStockAlert]
    top_products_by_stock: List[Dict[str, Any]]
