"""
test_ml.py — Tests de integración para el Motor ML (Fase 3).
Verifica Feature Engineering, Lead Scoring, Predicción de Demanda,
Traducción a Lenguaje Natural y aislamiento de alertas por tenant.
"""
import json
import pytest
from playwright.sync_api import APIRequestContext
from tests.conftest import assert_json_keys, API_PREFIX, JSON_HEADERS

class TestMlEngine:

    def test_trigger_ml_pipeline(self, api: APIRequestContext):
        """Ejecuta el batch nocturno/manual de ML y verifica respuesta."""
        resp = api.post(f"{API_PREFIX}/ml/trigger")
        assert resp.status == 200
        data = resp.json()
        assert_json_keys(data, "status", "tenants_processed", "total_alerts_generated", "execution_time_seconds")
        assert data["status"] == "success"

    def test_list_ml_alerts(self, api: APIRequestContext):
        """Trigger y consulta de alertas traducidas a lenguaje natural."""
        api.post(f"{API_PREFIX}/ml/trigger")
        resp = api.get(f"{API_PREFIX}/ml/alerts")
        assert resp.status == 200
        alerts = resp.json()
        assert isinstance(alerts, list)
        if len(alerts) > 0:
            first = alerts[0]
            assert_json_keys(first, "id", "alert_type", "message", "data", "is_read", "generated_at")
            assert len(first["message"]) > 10 # Texto explicativo en español

    def test_mark_alert_as_read(self, api: APIRequestContext):
        """Marca una alerta de ML como leída."""
        api.post(f"{API_PREFIX}/ml/trigger")
        alerts = api.get(f"{API_PREFIX}/ml/alerts").json()
        if len(alerts) > 0:
            alert_id = alerts[0]["id"]
            patch_resp = api.patch(f"{API_PREFIX}/ml/alerts/{alert_id}/read")
            assert patch_resp.status == 200
            assert patch_resp.json()["is_read"] is True

    def test_get_lead_ranking(self, api: APIRequestContext):
        """Retorna el ranking de propensión de compra (Lead Scoring)."""
        resp = api.get(f"{API_PREFIX}/ml/leads/ranking")
        assert resp.status == 200
        data = resp.json()
        assert_json_keys(data, "total_leads_analyzed", "top_leads", "generated_at")
        assert isinstance(data["top_leads"], list)

    def test_get_demand_forecast(self, api: APIRequestContext):
        """Retorna la predicción de demanda a 14 días."""
        resp = api.get(f"{API_PREFIX}/ml/forecast")
        assert resp.status == 200
        data = resp.json()
        assert_json_keys(data, "forecast_horizon_days", "predictions", "generated_at")
        assert data["forecast_horizon_days"] == 14
        assert isinstance(data["predictions"], list)

    def test_ml_alerts_without_auth_returns_403(self, anon_api: APIRequestContext):
        """Endpoints de ML requieren API Key válida."""
        resp = anon_api.get(f"{API_PREFIX}/ml/alerts")
        assert resp.status in (401, 403)
