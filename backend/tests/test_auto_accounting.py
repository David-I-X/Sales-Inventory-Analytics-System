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
    schema_name = f"test_auto_{uid}"
    res = client.post("/api/v1/tenants/register", json={"name": f"Auto Acc {uid}", "schema_name": schema_name})
    tenant_id = res.json()["id"]
    key_res = client.post(f"/api/v1/tenants/{tenant_id}/api-keys?label=auto_test")
    api_key = key_res.json()["key"]
    return {"x-api-key": api_key}

class TestAutoAccountingAndStockDeduction:
    def test_invoice_creation_triggers_income_and_stock_exit(self, tenant_headers):
        # 1. Create a Product with 15 in stock
        sku = "ALARM-KIT-01"
        prod_res = client.post("/api/v1/inventory/products", json={
            "sku": sku,
            "name": "Kit Alarma Residencial",
            "sale_price": 450000,
            "cost_price": 250000,
            "current_stock": 15,
            "min_stock": 5
        }, headers=tenant_headers)
        assert prod_res.status_code == 200
        product_id = prod_res.json()["id"]

        # 2. Create a Contact
        contact_res = client.post("/api/v1/contacts", json={
            "name": "Pedro Gómez",
            "phone": "+573129998877",
            "email": "pedro@gomez.com"
        }, headers=tenant_headers)
        assert contact_res.status_code == 200
        contact_id = contact_res.json()["id"]

        # 3. Create an Invoice with 3 units of ALARM-KIT-01
        inv_res = client.post("/api/v1/dian/invoices", json={
            "contact_id": contact_id,
            "items": [
                {
                    "sku": sku,
                    "description": "Kit Alarma Residencial",
                    "quantity": 3,
                    "unit_price": 450000,
                    "tax_rate": 0.19
                }
            ]
        }, headers=tenant_headers)
        assert inv_res.status_code == 200
        inv_data = inv_res.json()
        invoice_id = inv_data["id"]
        expected_total = 3 * 450000 * 1.19

        # 4. Verify Stock was deducted (15 - 3 = 12)
        prod_check = client.get(f"/api/v1/inventory/products/{product_id}", headers=tenant_headers)
        assert prod_check.status_code == 200
        assert prod_check.json()["current_stock"] == 12

        # 5. Verify Inventory Movement exit record
        mov_res = client.get(f"/api/v1/inventory/movements?product_id={product_id}", headers=tenant_headers)
        assert mov_res.status_code == 200
        movs = mov_res.json()
        exit_mov = next((m for m in movs if m["movement_type"] == "exit" and m["reference_id"] == invoice_id), None)
        assert exit_mov is not None
        assert exit_mov["quantity"] == -3

        # 6. Verify Automatic Accounting Income was created
        acc_res = client.get("/api/v1/accounting/entries?entry_type=income", headers=tenant_headers)
        assert acc_res.status_code == 200
        entries = acc_res.json()
        inc_entry = next((e for e in entries if e["reference_type"] == "invoice" and e["reference_id"] == invoice_id), None)
        assert inc_entry is not None
        assert round(float(inc_entry["amount"]), 2) == round(expected_total, 2)
        assert inc_entry["category"] == "ventas"
