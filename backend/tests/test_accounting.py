import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.main import app
from app.core.database import engine
from app.models.tenant import Tenant

client = TestClient(app)

import uuid

@pytest.fixture(name="tenant_headers")
def tenant_headers_fixture():
    uid = uuid.uuid4().hex[:8]
    schema_name = f"test_acc_{uid}"
    res = client.post("/api/v1/tenants/register", json={"name": f"Accounting {uid}", "schema_name": schema_name})
    tenant_id = res.json()["id"]
    key_res = client.post(f"/api/v1/tenants/{tenant_id}/api-keys?label=acc_test")
    api_key = key_res.json()["key"]
    return {"x-api-key": api_key}

class TestAccountingEndpoints:
    def test_create_expenses_and_dashboard(self, tenant_headers):
        # 1. Create expenses
        exp1 = client.post("/api/v1/accounting/expenses", json={
            "category": "arriendo",
            "amount": 1200000,
            "description": "Arriendo bodega mensual"
        }, headers=tenant_headers)
        assert exp1.status_code == 200
        assert exp1.json()["entry_type"] == "expense"
        assert exp1.json()["category"] == "arriendo"

        exp2 = client.post("/api/v1/accounting/expenses", json={
            "category": "servicios",
            "amount": 250000,
            "description": "Internet y energía eléctrica"
        }, headers=tenant_headers)
        assert exp2.status_code == 200

        # 2. Get Accounting Dashboard
        dash_res = client.get("/api/v1/accounting/dashboard", headers=tenant_headers)
        assert dash_res.status_code == 200
        dash = dash_res.json()
        assert float(dash["month_expenses"]) >= 1450000
        assert len(dash["expenses_by_category"]) >= 2
        assert "daily_cash_flow" in dash

    def test_monthly_pnl(self, tenant_headers):
        pnl_res = client.get("/api/v1/accounting/pnl", headers=tenant_headers)
        assert pnl_res.status_code == 200
        pnl = pnl_res.json()
        assert "gross_revenue" in pnl
        assert "cost_of_goods_sold" in pnl
        assert "gross_profit" in pnl
        assert "operating_expenses" in pnl
        assert "net_operating_income" in pnl

    def test_export_csv(self, tenant_headers):
        csv_res = client.get("/api/v1/accounting/export", headers=tenant_headers)
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "attachment; filename=" in csv_res.headers["content-disposition"]
        content = csv_res.content.decode("utf-8-sig")
        assert "Monto (COP)" in content
        assert "Categoria" in content
