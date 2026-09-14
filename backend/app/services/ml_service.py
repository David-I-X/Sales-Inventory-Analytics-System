"""
ml_service.py — Orquestador del Pipeline Batch de Machine Learning.

Recorre todos los tenants activos, extrae sus datos, ejecuta las inferencias
de ML y genera las alertas en lenguaje natural en sus respectivos schemas.
"""
from typing import Dict, Any, List
from sqlmodel import Session, select
from app.core.database import engine
from app.models.tenant import Tenant
from app.ml.feature_engineering import FeatureExtractor
from app.ml.lead_scoring import LeadScorer
from app.ml.demand_forecast import DemandForecaster
from app.services.alert_service import NaturalLanguageAlertTranslator
from sqlalchemy import text
import time

class MLBatchOrchestrator:

    def __init__(self):
        self.extractor = FeatureExtractor()
        self.scorer = LeadScorer()
        self.forecaster = DemandForecaster()
        self.translator = NaturalLanguageAlertTranslator()

    def run_pipeline_for_tenant(self, tenant: Tenant, session: Session) -> Dict[str, Any]:
        """
        Ejecuta el pipeline completo para un tenant específico:
        1. SET search_path al schema del tenant
        2. Feature Engineering
        3. Lead Scoring + Demand Forecast
        4. Traducción a Lenguaje Natural + Persistencia
        """
        session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

        # 1. Feature Engineering
        contact_features = self.extractor.extract_contact_features(session)
        demand_features = self.extractor.extract_demand_features(session)

        # 2. Inferencia de Modelos
        top_leads = self.scorer.predict_lead_probabilities(contact_features)
        forecasts = self.forecaster.forecast_14_days(demand_features)

        # 3. Traducción a Lenguaje Natural y Guardado
        alerts = self.translator.generate_natural_alerts(top_leads, forecasts, session)

        return {
            "tenant_id": tenant.id,
            "schema_name": tenant.schema_name,
            "leads_scored": len(top_leads),
            "forecasts_generated": len(forecasts),
            "alerts_created": len(alerts)
        }

    def run_all_tenants_batch(self) -> Dict[str, Any]:
        """
        Recorre todos los tenants activos y ejecuta el batch nocturno.
        """
        start_time = time.time()
        results = []
        total_alerts = 0

        with Session(engine, expire_on_commit=False) as session:
            # Obtener tenants activos en schema public
            statement = select(Tenant).where(Tenant.is_active == True)
            tenants = session.exec(statement).all()

            for t in tenants:
                try:
                    res = self.run_pipeline_for_tenant(t, session)
                    results.append(res)
                    total_alerts += res["alerts_created"]
                except Exception as e:
                    print(f"Error procesando tenant {t.schema_name}: {e}")

        elapsed = time.time() - start_time
        return {
            "status": "success",
            "tenants_processed": len(results),
            "total_alerts_generated": total_alerts,
            "execution_time_seconds": round(elapsed, 3),
            "details": results
        }

ml_orchestrator = MLBatchOrchestrator()
