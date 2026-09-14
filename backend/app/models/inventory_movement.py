from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from decimal import Decimal

class InventoryMovement(SQLModel, table=True):
    __tablename__ = "inventory_movements"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    
    movement_type: str = Field(index=True)  # entry, exit, adjustment
    quantity: int                           # Positive for additions, negative for exits
    unit_cost: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    
    reference_type: str = Field(default="manual")  # purchase, invoice, manual, adjustment
    reference_id: Optional[int] = None
    
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
