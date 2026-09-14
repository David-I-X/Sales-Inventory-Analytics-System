from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class MlAlertResponse(BaseModel):
    id: int
    alert_type: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    generated_at: datetime

    class Config:
        from_attributes = True

class LeadScoreItem(BaseModel):
    contact_id: int
    name: str
    phone: Optional[str] = None
    funnel_stage: str
    score: float
    probability_percentage: str
    reason: str

class LeadRankingResponse(BaseModel):
    total_leads_analyzed: int
    top_leads: List[LeadScoreItem]
    generated_at: datetime

class DemandForecastItem(BaseModel):
    item_sku: str
    item_name: str
    current_stock: int
    predicted_demand_14d: int
    recommended_action: str
    confidence_level: str

class DemandForecastResponse(BaseModel):
    forecast_horizon_days: int
    predictions: List[DemandForecastItem]
    generated_at: datetime

class PipelineTriggerResponse(BaseModel):
    status: str
    tenants_processed: int
    total_alerts_generated: int
    execution_time_seconds: float
    message: str
