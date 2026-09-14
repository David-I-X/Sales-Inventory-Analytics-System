from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime
from decimal import Decimal

class Invoice(SQLModel, table=True):
    __tablename__ = "invoices"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    contact_id: Optional[int] = Field(default=None, foreign_key="contacts.id")
    invoice_number: str = Field(index=True)
    cufe: Optional[str] = Field(default=None, index=True)
    dian_status: str = Field(default="draft") # draft, sent, accepted, rejected
    subtotal: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    tax: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    total: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    
    line_items: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    dian_response: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    dian_responded_at: Optional[datetime] = None
    
    # Relationships
    contact: Optional["Contact"] = Relationship(back_populates="invoices")
    transactions: List["Transaction"] = Relationship(back_populates="invoice")
