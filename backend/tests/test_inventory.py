import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from decimal import Decimal
from app.main import app
from app.core.database import engine
from app.models.tenant import Tenant, ApiKey

client = TestClient(app)

import uuid

@pytest.fixture(name="tenant_headers")
def tenant_headers_fixture():
    # Setup test tenant with unique schema
    uid = uuid.uuid4().hex[:8]
    tenant_name = f"test_inv_{uid}"
    schema_name = f"test_inv_schema_{uid}"
    
    res = client.post("/api/v1/tenants/register", json={"name": tenant_name, "schema_name": schema_name})
    tenant_id = res.json()["id"]
        
    key_res = client.post(f"/api/v1/tenants/{tenant_id}/api-keys?label=inv_test")
    api_key = key_res.json()["key"]
    return {"x-api-key": api_key}

class TestInventoryEndpoints:
    def test_create_and_list_products(self, tenant_headers):
        sku = "GPS-TEST-001"
        payload = {
            "sku": sku,
            "name": "GPS Tracker Pro",
            "description": "Rastreador satelital 4G",
            "category": "Dispositivos",
            "unit_measure": "unidad",
            "sale_price": 350000,
            "cost_price": 180000,
            "current_stock": 20,
            "min_stock": 5
        }
        res = client.post("/api/v1/inventory/products", json=payload, headers=tenant_headers)
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["sku"] == sku
        assert data["current_stock"] == 20
        assert data["is_low_stock"] is False
        assert float(data["stock_value"]) == 20 * 180000

        # List products
        list_res = client.get("/api/v1/inventory/products", headers=tenant_headers)
        assert list_res.status_code == 200
        prods = list_res.json()
        assert any(p["sku"] == sku for p in prods)

    def test_duplicate_sku_fails(self, tenant_headers):
        sku = "DUPLICATE-SKU-001"
        payload = {
            "sku": sku,
            "name": "Prod 1",
            "sale_price": 10000,
            "cost_price": 5000,
            "current_stock": 10,
            "min_stock": 2
        }
        res1 = client.post("/api/v1/inventory/products", json=payload, headers=tenant_headers)
        assert res1.status_code == 200

        # Second creation with same sku must fail
        res2 = client.post("/api/v1/inventory/products", json=payload, headers=tenant_headers)
        assert res2.status_code == 400
        assert "Ya existe un producto con el SKU" in res2.text

    def test_stock_adjustment_and_movements(self, tenant_headers):
        sku = "ADJ-TEST-001"
        res = client.post("/api/v1/inventory/products", json={
            "sku": sku,
            "name": "Cámara HD",
            "sale_price": 120000,
            "cost_price": 60000,
            "current_stock": 10,
            "min_stock": 5
        }, headers=tenant_headers)
        prod_id = res.json()["id"]

        # Adjust stock to 3 (low stock)
        adj_res = client.post("/api/v1/inventory/adjustments", json={
            "product_id": prod_id,
            "new_stock": 3,
            "reason": "Conteo físico quincenal"
        }, headers=tenant_headers)
        assert adj_res.status_code == 200
        adj_data = adj_res.json()
        assert adj_data["current_stock"] == 3
        assert adj_data["is_low_stock"] is True

        # Check movements
        mov_res = client.get(f"/api/v1/inventory/movements?product_id={prod_id}", headers=tenant_headers)
        assert mov_res.status_code == 200
        movements = mov_res.json()
        assert len(movements) >= 2  # initial + adjustment

    def test_inventory_dashboard_and_alerts(self, tenant_headers):
        dash_res = client.get("/api/v1/inventory/dashboard", headers=tenant_headers)
        assert dash_res.status_code == 200
        data = dash_res.json()
        assert "total_products" in data
        assert "total_inventory_value" in data
        assert "low_stock_count" in data
        assert "low_stock_items" in data

        alerts_res = client.get("/api/v1/inventory/alerts", headers=tenant_headers)
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        assert isinstance(alerts, list)
