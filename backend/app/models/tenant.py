from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON
from datetime import datetime, timezone


def get_utc_now() -> datetime:
    """Retorna la hora actual en UTC con timezone-aware."""
    return datetime.now(timezone.utc)


class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    schema_name: str = Field(unique=True, index=True)
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = Field(default=None)
    plan: str = Field(default="free")
    enabled_modules: List[str] = Field(
        default_factory=lambda: ["dian_invoicing", "accounting", "ml_leads"],
        sa_column=Column(JSON)
    )
    module_settings: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON)
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    
    api_keys: List["ApiKey"] = Relationship(back_populates="tenant")

class ApiKey(SQLModel, table=True):
    __tablename__ = "api_keys"
    __table_args__ = {"schema": "public"}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="public.tenants.id")
    key: str = Field(unique=True, index=True)
    label: str = Field(default="default")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    
    tenant: Tenant = Relationship(back_populates="api_keys")
