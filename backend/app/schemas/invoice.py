from pydantic import BaseModel, ConfigDict, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

class InvoiceItem(BaseModel):
    sku: str
    description: str
    quantity: int
    unit_price: float
    tax_rate: float = 0.19

class InvoiceCreate(BaseModel):
    contact_id: int
    items: List[InvoiceItem]
    # Opciones de Contabilidad para Marketplace / Comisiones (ej: Tec360)
    auto_accounting: bool = True
    commission_amount: Optional[float] = None
    invoice_type: Optional[str] = "standard"  # "standard", "mandate_service", "platform_commission"

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    contact_id: Optional[int] = None
    cufe: Optional[str] = None
    dian_status: str
    subtotal: float
    tax: float
    total: float
    line_items: Optional[List[Dict[str, Any]]] = None
    issued_at: datetime
    dian_responded_at: Optional[datetime] = None
    dian_response: Optional[Dict[str, Any]] = None
    qr_url: Optional[str] = None
    pdf_url: Optional[str] = None
    
    @model_validator(mode="before")
    @classmethod
    def extract_links(cls, data: Any) -> Any:
        try:
            dian_resp = None
            if hasattr(data, "dian_response"):
                dian_resp = data.dian_response
            elif isinstance(data, dict):
                dian_resp = data.get("dian_response")
                
            if dian_resp and isinstance(dian_resp, dict):
                links = dian_resp.get("links") or dian_resp.get("data", {}).get("links") or {}
                qr = dian_resp.get("qr_url") or links.get("qr")
                pdf = dian_resp.get("pdf_url") or links.get("public_url")
                
                if hasattr(data, "__dict__"):
                    d = dict(data.__dict__)
                    d.setdefault("qr_url", qr)
                    d.setdefault("pdf_url", pdf)
                    return d
                elif isinstance(data, dict):
                    data.setdefault("qr_url", qr)
                    data.setdefault("pdf_url", pdf)
        except Exception:
            pass
        return data

    model_config = ConfigDict(from_attributes=True)
