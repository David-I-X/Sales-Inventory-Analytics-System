"""
schemas/quote.py — Esquemas de validación para Cotizaciones y Presupuestos.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class QuoteItem(BaseModel):
    description: str
    quantity: Decimal = Field(default=Decimal("1.00"), ge=0.01)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    subtotal: Optional[Decimal] = None
    sku: Optional[str] = None
    item_type: str = "service" # "service" | "product"

class QuoteCreate(BaseModel):
    contact_id: Optional[int] = None
    title: str = "Cotización de Servicios / Productos"
    items: List[QuoteItem]
    tax_rate: Decimal = Field(default=Decimal("0.19"), ge=0, le=1)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    terms: Optional[str] = "Validez de la oferta: 15 días. Pago: 50% anticipo, 50% entrega."
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class QuoteUpdate(BaseModel):
    """
    Permite actualizar cualquier aspecto de la cotización durante la negociación:
    ítems, cantidades, tarifas, descuentos, vigencia o notas.
    """
    contact_id: Optional[int] = None
    title: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    tax_rate: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None # 'draft', 'sent', 'approved', 'rejected'
    valid_until: Optional[datetime] = None

class QuoteStatusUpdate(BaseModel):
    status: str # 'draft', 'sent', 'approved', 'rejected'

class ConvertToInvoiceResponse(BaseModel):
    quote_id: int
    quote_number: str
    status: str
    invoice_id: int
    invoice_number: str
    total: Decimal
    cufe: Optional[str] = None
    message: str

class QuoteResponse(BaseModel):
    id: int
    quote_number: str
    contact_id: Optional[int] = None
    contact_name: Optional[str] = None
    title: str
    status: str
    subtotal: Decimal
    tax_rate: Decimal
    tax: Decimal
    discount: Decimal
    total: Decimal
    items: List[Dict[str, Any]]
    terms: Optional[str] = None
    notes: Optional[str] = None
    issued_at: datetime
    valid_until: datetime
    updated_at: datetime
    invoice_id: Optional[int] = None
    invoice_number: Optional[str] = None
