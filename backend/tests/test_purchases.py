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
    schema_name = f"test_purch_{uid}"
    res = client.post("/api/v1/tenants/register", json={"name": f"Purchases {uid}", "schema_name": schema_name})
    tenant_id = res.json()["id"]
    key_res = client.post(f"/api/v1/tenants/{tenant_id}/api-keys?label=purch_test")
    api_key = key_res.json()["key"]
    return {"x-api-key": api_key}

class TestPurchasesAndSuppliers:
    def test_create_supplier_and_purchase_flow(self, tenant_headers):
        # 1. Create Supplier
        sup_res = client.post("/api/v1/suppliers", json={
            "name": "Distribuidora Tech SAS",
            "nit": "900999888-1",
            "phone": "+573105554433",
            "email": "ventas@techdist.com",
            "contact_person": "Carlos Mendoza"
        }, headers=tenant_headers)
        assert sup_res.status_code == 200
        supplier_id = sup_res.json()["id"]

        # 2. Create Product
        prod_res = client.post("/api/v1/inventory/products", json={
            "sku": "CABLE-UTP-100",
            "name": "Bobina Cable UTP Cat6 100m",
            "sale_price": 220000,
            "cost_price": 140000,
            "current_stock": 5,
            "min_stock": 10
        }, headers=tenant_headers)
        assert prod_res.status_code == 200
        product_id = prod_res.json()["id"]

        # 3. Create Purchase (order 15 units at 135000 unit cost)
        purch_res = client.post("/api/v1/purchases", json={
            "supplier_id": supplier_id,
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 15,
                    "unit_cost": 135000
                }
            ],
            "tax_rate": 0.19,
            "notes": "Pedido de reposición mensual"
        }, headers=tenant_headers)
        assert purch_res.status_code == 200
        purch_data = purch_res.json()
        assert purch_data["purchase_number"].startswith("COMP-")
        assert purch_data["supplier_name"] == "Distribuidora Tech SAS"
        expected_subtotal = 15 * 135000
        expected_tax = expected_subtotal * 0.19
        expected_total = expected_subtotal + expected_tax
        assert float(purch_data["subtotal"]) == expected_subtotal
        assert float(purch_data["total"]) == expected_total

        # 4. Verify Stock was increased (5 initial + 15 purchased = 20)
        prod_check = client.get(f"/api/v1/inventory/products/{product_id}", headers=tenant_headers)
        assert prod_check.status_code == 200
        assert prod_check.json()["current_stock"] == 20
        assert prod_check.json()["is_low_stock"] is False

        # 5. Verify Accounting Expense was automatically recorded
        acc_res = client.get("/api/v1/accounting/entries?category=proveedores", headers=tenant_headers)
        assert acc_res.status_code == 200
        entries = acc_res.json()
        assert any(e["reference_type"] == "purchase" and float(e["amount"]) == expected_total for e in entries)
