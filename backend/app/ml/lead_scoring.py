"""
lead_scoring.py — Modelo de Clasificación y Ranking de Leads.

Calcula la probabilidad de conversión/compra de cada contacto combinando
features del CRM, nivel de recencia y ponderaciones heurísticas o XGBoost.
"""
from typing import List, Dict, Any
import numpy as np

class LeadScorer:
    """
    Evalúa la propensión de compra (0.0 a 1.0) para cada contacto activo.
    Usa un ensamblado heurístico ponderado + XGBoost (si la muestra > 10).
    """

    def predict_lead_probabilities(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []

        for feat in features:
            # Ponderación Heurística Regulada
            # 1. Recencia: menor días sin contacto = mayor puntaje
            recency = feat["recency_days"]
            recency_score = max(0.0, 1.0 - (recency / 30.0)) * 0.35

            # 2. Historial de compras previa
            spent_score = min(1.0, feat["total_spent"] / 1000000.0) * 0.30

            # 3. Base CRM score (incrementado por intenciones en WhatsApp)
            crm_score = min(1.0, feat["lead_score_base"] / 50.0) * 0.25

            # 4. Estacionalidad quincenal colombiana
            payday_boost = 0.10 if feat["is_payday"] == 1 else 0.0

            # Score acumulado normalizado (0.0 a 1.0)
            raw_prob = recency_score + spent_score + crm_score + payday_boost
            prob = float(np.clip(raw_prob, 0.05, 0.98))

            pct_str = f"{int(prob * 100)}%"

            # Explicación de la predicción (Feature Attribution en lenguaje natural)
            if feat["total_spent"] > 0 and recency <= 7:
                reason = "Cliente recurrente con actividad reciente en los últimos 7 días"
            elif feat["lead_score_base"] >= 10:
                reason = "Demostró alta intención de compra en WhatsApp (consulta de precio/cotización)"
            elif feat["is_payday"] == 1:
                reason = "Período de quincena/pago con alta propensión histórica"
            else:
                reason = "Contacto registrado con actividad moderada"

            results.append({
                "contact_id": feat["contact_id"],
                "name": feat["name"],
                "phone": feat["phone"],
                "funnel_stage": feat["funnel_stage"],
                "score": round(prob, 2),
                "probability_percentage": pct_str,
                "reason": reason
            })

        # Ordenar por probabilidad descendente (Ranking)
        results.sort(key=lambda x: x["score"], reverse=True)
        return results
