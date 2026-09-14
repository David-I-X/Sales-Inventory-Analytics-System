from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    funnel_stage: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    whatsapp_id: Optional[str]
    funnel_stage: str
    lead_score: float
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
