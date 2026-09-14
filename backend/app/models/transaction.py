from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from decimal import Decimal

class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoices.id")
    contact_id: Optional[int] = Field(default=None, foreign_key="contacts.id")
    
    type: str = Field(default="sale") # sale, refund, credit_note
    amount: Decimal = Field(default=0, max_digits=12, decimal_places=2)
    payment_method: str = Field(default="cash")
    date: datetime = Field(default_factory=datetime.utcnow)
    
    invoice: Optional["Invoice"] = Relationship(back_populates="transactions")
    contact: Optional["Contact"] = Relationship(back_populates="transactions")
