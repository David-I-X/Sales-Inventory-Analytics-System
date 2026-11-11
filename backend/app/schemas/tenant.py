from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class TenantCreate(BaseModel):
    name: str
    schema_name: str
    plan: str = "free"
    enabled_modules: Optional[List[str]] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    schema_name: str
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    plan: str
    enabled_modules: List[str] = []
    module_settings: Dict[str, Any] = {}
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ApiKeyResponse(BaseModel):
    key: str
    label: str

class WebhookUpdate(BaseModel):
    webhook_url: str
