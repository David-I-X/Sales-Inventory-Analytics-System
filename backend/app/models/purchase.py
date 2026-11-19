from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime, timezone
from decimal import Decimal


def get_utc_now() -> datetime:
    """Retorna la hora actual en UTC con timezone-aware."""
    return datetime.now(timezone.utc)


class Purchase(SQLModel, table=True):
    __tablename__ = "purchases"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: Optional[int] = Field(default=None, foreign_key="suppliers.id", index=True)
    purchase_number: str = Field(index=True)  # COMP-0001
    
    items: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # Each item: { product_id, sku, name, quantity, unit_cost, subtotal }
    
    subtotal: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    tax: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    total: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now, index=True)
