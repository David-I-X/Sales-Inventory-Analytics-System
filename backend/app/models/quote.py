"""
quote.py — Modelo de Cotizaciones / Órdenes de Servicio y Presupuestos.
Vive en el schema aislado de cada tenant.
"""
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from datetime import datetime, timedelta, timezone
from decimal import Decimal

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

def default_valid_until() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=15)

class Quote(SQLModel, table=True):
    __tablename__ = "quotes"

    id: Optional[int] = Field(default=None, primary_key=True)
    quote_number: str = Field(index=True)
    contact_id: Optional[int] = Field(default=None, foreign_key="contacts.id")
    title: str = Field(default="Cotización de Servicios / Productos")
    
    # Estados: 'draft' (Borrador), 'sent' (Enviada), 'approved' (Aprobada), 'rejected' (Rechazada), 'invoiced' (Facturada DIAN)
    status: str = Field(default="draft", index=True)
    
    subtotal: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    tax_rate: Decimal = Field(default=Decimal("0.19"), max_digits=5, decimal_places=2)
    tax: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    discount: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    total: Decimal = Field(default=Decimal("0.00"), max_digits=12, decimal_places=2)
    
    # Líneas de cotización (servicios o productos)
    items: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    
    terms: Optional[str] = Field(default="Validez de la oferta: 15 días. Pago: 50% anticipo, 50% entrega.")
    notes: Optional[str] = Field(default=None)
    
    issued_at: datetime = Field(default_factory=get_utc_now)
    valid_until: datetime = Field(default_factory=default_valid_until)
    updated_at: datetime = Field(default_factory=get_utc_now)
    
    # Trazabilidad con Facturación Electrónica DIAN
    invoice_id: Optional[int] = Field(default=None, index=True)
    invoice_number: Optional[str] = Field(default=None)
    
    # Relación con Contacto
    contact: Optional["Contact"] = Relationship(back_populates="quotes")
