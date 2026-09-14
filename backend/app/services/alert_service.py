"""
alert_service.py — Capa de Traducción de Métricas ML a Lenguaje Natural.

Recibe los objetos y scores de los modelos de ML y los transforma en
frases y sugerencias accionables en español para el empresario o gerente.
"""
from typing import List, Dict, Any
from sqlmodel import Session
from app.models.ml_alert import MlAlert

class NaturalLanguageAlertTranslator:
    """
    Traduce matrices y probabilidades de ML en alertas de texto claro.
    Guarda las alertas en la tabla `ml_alerts` del schema del tenant.
    """

    def generate_natural_alerts(
        self,
        top_leads: List[Dict[str, Any]],
        forecasts: List[Dict[str, Any]],
        session: Session
    ) -> List[MlAlert]:
        from sqlalchemy import text
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS ml_alerts (
                id SERIAL PRIMARY KEY,
                alert_type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                data JSON NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                generated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
            );
        """))
        alerts_to_save: List[MlAlert] = []

        # 1. Traducción de Lead Scoring a Lenguaje Natural
        for lead in top_leads[:3]: # Top 3 leads calientes
            score_pct = lead["probability_percentage"]
            msg = (
                f"🔥 **Oportunidad de Venta**: El cliente **{lead['name']}** tiene un **{score_pct}** "
                f"de probabilidad de compra/contratación hoy. Motivo: {lead['reason']}."
            )
            alert = MlAlert(
                alert_type="hot_lead",
                message=msg,
                data={
                    "contact_id": lead["contact_id"],
                    "score": lead["score"],
                    "phone": lead["phone"],
                    "reason": lead["reason"]
                }
            )
            session.add(alert)
            alerts_to_save.append(alert)

        # 2. Traducción de Predicción de Demanda a Lenguaje Natural
        for fc in forecasts:
            msg = (
                f"📈 **Proyección de Demanda (14 Días)**: Se estiman **{fc['predicted_demand_14d']} unidades** "
                f"para '{fc['item_name']}'. {fc['recommended_action']}"
            )
            alert = MlAlert(
                alert_type="demand_forecast",
                message=msg,
                data={
                    "sku": fc["item_sku"],
                    "predicted_units": fc["predicted_demand_14d"],
                    "current_stock": fc["current_stock"]
                }
            )
            session.add(alert)
            alerts_to_save.append(alert)

        session.flush()
        session.commit()
        return alerts_to_save
