"""
Tests de integración para el servicio del SPA (React) en FastAPI.
Verifica que las rutas no-API sirvan el index.html del build de React
y que las rutas API sigan funcionando normalmente.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

class TestSpaServing:
    def test_health_check_returns_json(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_spa_root_serves_html(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert "SaaS Vertical" in response.text or "root" in response.text

    def test_spa_client_route_serves_html(self, client):
        # Rutas del cliente manejadas por React Router
        for route in ["/login", "/contacts", "/invoices", "/ml", "/users", "/profile"]:
            response = client.get(route)
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")

    def test_api_404_for_unknown_api_endpoint(self, client):
        # Endpoints bajo /api/ no deben servir el SPA HTML si no existen
        response = client.get("/api/v1/nonexistent_route")
        assert response.status_code == 404
