from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone


def get_utc_now() -> datetime:
    """Retorna la hora actual en UTC con timezone-aware."""
    return datetime.now(timezone.utc)


class Supplier(SQLModel, table=True):
    __tablename__ = "suppliers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    nit: Optional[str] = Field(default=None, index=True)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
