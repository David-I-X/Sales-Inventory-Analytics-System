from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.ml_alert import MlAlert
from app.schemas.ml import (
    MlAlertResponse,
    LeadRankingResponse,
    DemandForecastResponse,
    PipelineTriggerResponse,
    LeadScoreItem,
    DemandForecastItem
)
from app.services.ml_service import ml_orchestrator
from app.ml.feature_engineering import FeatureExtractor
from app.ml.lead_scoring import LeadScorer
from app.ml.demand_forecast import DemandForecaster
from datetime import datetime

router = APIRouter()
extractor = FeatureExtractor()
scorer = LeadScorer()
forecaster = DemandForecaster()

@router.get("/alerts", response_model=List[MlAlertResponse])
def list_ml_alerts(
    alert_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 50,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Retorna la lista de alertas traducidas a lenguaje natural para el tenant autenticado.
    """
    statement = select(MlAlert).order_by(MlAlert.generated_at.desc()).limit(limit)
    if alert_type:
        statement = statement.where(MlAlert.alert_type == alert_type)
    if is_read is not None:
        statement = statement.where(MlAlert.is_read == is_read)

    alerts = session.exec(statement).all()
    return alerts

@router.patch("/alerts/{alert_id}/read", response_model=MlAlertResponse)
def mark_alert_read(
    alert_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Marca una alerta como leída.
    """
    alert = session.get(MlAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    session.add(alert)
    session.flush()
    session.commit()
    return alert

@router.get("/leads/ranking", response_model=LeadRankingResponse)
def get_lead_ranking(
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Retorna el ranking en tiempo real de los contactos con mayor probabilidad de compra (Lead Scoring).
    """
    contact_features = extractor.extract_contact_features(session)
    top_leads = scorer.predict_lead_probabilities(contact_features)

    lead_items = [
        LeadScoreItem(
            contact_id=l["contact_id"],
            name=l["name"],
            phone=l["phone"],
            funnel_stage=l["funnel_stage"],
            score=l["score"],
            probability_percentage=l["probability_percentage"],
            reason=l["reason"]
        ) for l in top_leads
    ]

    return LeadRankingResponse(
        total_leads_analyzed=len(contact_features),
        top_leads=lead_items,
        generated_at=datetime.utcnow()
    )

@router.get("/forecast", response_model=DemandForecastResponse)
def get_demand_forecast(
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Retorna la predicción de demanda a 14 días por producto/servicio.
    """
    demand_features = extractor.extract_demand_features(session)
    predictions = forecaster.forecast_14_days(demand_features)

    forecast_items = [
        DemandForecastItem(
            item_sku=p["item_sku"],
            item_name=p["item_name"],
            current_stock=p["current_stock"],
            predicted_demand_14d=p["predicted_demand_14d"],
            recommended_action=p["recommended_action"],
            confidence_level=p["confidence_level"]
        ) for p in predictions
    ]

    return DemandForecastResponse(
        forecast_horizon_days=14,
        predictions=forecast_items,
        generated_at=datetime.utcnow()
    )

@router.post("/trigger", response_model=PipelineTriggerResponse)
def trigger_ml_pipeline(
    tenant: Tenant = Depends(get_tenant_by_api_key)
):
    """
    Forzar la ejecución manual del batch de ML para todos los tenants (útil para pruebas y Tec360).
    """
    res = ml_orchestrator.run_all_tenants_batch()
    return PipelineTriggerResponse(
        status=res["status"],
        tenants_processed=res["tenants_processed"],
        total_alerts_generated=res["total_alerts_generated"],
        execution_time_seconds=res["execution_time_seconds"],
        message=f"Pipeline ML ejecutado exitosamente. Generadas {res['total_alerts_generated']} alertas en lenguaje natural."
    )
