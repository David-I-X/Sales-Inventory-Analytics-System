from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime

class Contact(SQLModel, table=True):
    __tablename__ = "contacts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None, unique=True, index=True)
    email: Optional[str] = None
    whatsapp_id: Optional[str] = Field(default=None, index=True)
    funnel_stage: str = Field(default="new")
    lead_score: float = Field(default=0.0)
    metadata_: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships definition string to avoid circular imports
    invoices: List["Invoice"] = Relationship(back_populates="contact")
    transactions: List["Transaction"] = Relationship(back_populates="contact")
