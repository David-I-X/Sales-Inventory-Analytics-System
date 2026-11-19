from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from decimal import Decimal

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Product(SQLModel, table=True):
    __tablename__ = "products"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    sku: str = Field(unique=True, index=True)
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    item_type: str = Field(default="product", index=True)  # "product" | "service"
    unit_measure: str = Field(default="unidad")  # unidad, kg, litro, metro, caja, servicio, hora, mes
    
    sale_price: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    cost_price: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    current_stock: int = Field(default=0)
    min_stock: int = Field(default=5)
    
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)
