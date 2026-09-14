"""
test_invoices.py — Tests para el módulo de facturación electrónica DIAN.
"""
import json
import pytest
from playwright.sync_api import APIRequestContext
from tests.conftest import assert_json_keys, API_PREFIX

INVOICE_ITEMS = [
    {"sku": "gps_installation", "description": "Instalación GPS", "quantity": 1, "unit_price": 350000, "tax_rate": 0.19},
    {"sku": "cctv_camera", "description": "Cámara CCTV HD", "quantity": 2, "unit_price": 180000, "tax_rate": 0.19}
]


class TestCreateInvoice:

    def test_create_invoice_returns_accepted_status(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"],
            "items": INVOICE_ITEMS
        })
        assert resp.status == 200, f"Invoice creation failed: {resp.text()}"
        data = resp.json()
        assert_json_keys(data, "id", "invoice_number", "cufe", "dian_status",
                         "subtotal", "tax", "total", "line_items", "issued_at")
        assert data["dian_status"] == "accepted"

    def test_create_invoice_cufe_is_generated(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": INVOICE_ITEMS
        })
        data = resp.json()
        assert data["cufe"] is not None
        assert len(data["cufe"]) == 32

    def test_create_invoice_invoice_number_has_prefix(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": INVOICE_ITEMS
        })
        assert resp.json()["invoice_number"].startswith("SETT-")

    def test_create_invoice_calculates_totals_correctly(self, api: APIRequestContext, contact: dict):
        """1x350k + 2x180k = 710k; tax = 134.9k; total = 844.9k"""
        items = [
            {"sku": "item1", "description": "Item 1", "quantity": 1, "unit_price": 350000, "tax_rate": 0.19},
            {"sku": "item2", "description": "Item 2", "quantity": 2, "unit_price": 180000, "tax_rate": 0.19},
        ]
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={"contact_id": contact["id"], "items": items})
        data = resp.json()
        assert abs(data["subtotal"] - 710000.0) < 0.01
        assert abs(data["tax"] - 134900.0) < 0.01
        assert abs(data["total"] - 844900.0) < 0.01

    def test_create_invoice_line_items_stored(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": [INVOICE_ITEMS[0]]
        })
        data = resp.json()
        assert isinstance(data["line_items"], list)
        assert len(data["line_items"]) == 1
        assert data["line_items"][0]["sku"] == "gps_installation"

    def test_create_invoice_for_nonexistent_contact_returns_404(self, api: APIRequestContext):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": 99999999, "items": INVOICE_ITEMS
        })
        assert resp.status == 404

    def test_create_invoice_dian_response_stored(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": [INVOICE_ITEMS[0]]
        })
        data = resp.json()
        assert data["dian_response"] is not None
        assert "status" in data["dian_response"]
        assert "cufe" in data["dian_response"]

    def test_create_invoice_without_auth_returns_403(self, anon_api: APIRequestContext, contact: dict):
        resp = anon_api.post(f"{API_PREFIX}/dian/invoices/", data=json.dumps({
            "contact_id": contact["id"], "items": INVOICE_ITEMS
        }), headers={"Content-Type": "application/json"})
        assert resp.status in (401, 403)


class TestListInvoices:

    def test_list_invoices_returns_array(self, api: APIRequestContext, contact: dict):
        api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": [INVOICE_ITEMS[0]]
        })
        resp = api.get(f"{API_PREFIX}/dian/invoices/")
        assert resp.status == 200
        assert isinstance(resp.json(), list)

    def test_list_invoices_pagination(self, api: APIRequestContext):
        resp = api.get(f"{API_PREFIX}/dian/invoices/", params={"skip": 0, "limit": 5})
        assert resp.status == 200
        assert len(resp.json()) <= 5

    def test_get_invoice_by_id(self, api: APIRequestContext, contact: dict):
        created = api.post(f"{API_PREFIX}/dian/invoices/", data={
            "contact_id": contact["id"], "items": [INVOICE_ITEMS[0]]
        }).json()
        resp = api.get(f"{API_PREFIX}/dian/invoices/{created['id']}")
        assert resp.status == 200
        assert resp.json()["id"] == created["id"]
        assert resp.json()["invoice_number"] == created["invoice_number"]

    def test_get_nonexistent_invoice_returns_404(self, api: APIRequestContext):
        resp = api.get(f"{API_PREFIX}/dian/invoices/99999999")
        assert resp.status == 404
