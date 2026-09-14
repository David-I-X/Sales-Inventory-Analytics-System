from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TenantCreate(BaseModel):
    name: str
    schema_name: str
    plan: str = "free"

class TenantResponse(BaseModel):
    id: int
    name: str
    schema_name: str
    webhook_url: Optional[str]
    webhook_secret: Optional[str]
    plan: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ApiKeyResponse(BaseModel):
    key: str
    label: str

class WebhookUpdate(BaseModel):
    webhook_url: str
