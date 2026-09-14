from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from decimal import Decimal

class AccountingEntry(SQLModel, table=True):
    __tablename__ = "accounting_entries"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    entry_type: str = Field(index=True)     # income | expense
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    category: str = Field(index=True)       # ventas, proveedores, arriendo, nomina, servicios, transporte, impuestos, otros
    description: str
    
    # Traceability
    reference_type: Optional[str] = None    # invoice, purchase, manual
    reference_id: Optional[int] = None
    
    entry_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
