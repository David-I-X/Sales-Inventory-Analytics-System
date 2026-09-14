"""
test_tenants.py — Tests para registro de tenants, API Keys y autenticación.
"""
import json
import httpx
import pytest
from playwright.sync_api import APIRequestContext
from tests.conftest import assert_json_keys, BASE_URL, API_PREFIX


class TestTenantRegistration:

    def test_register_tenant_returns_correct_fields(self, registered_tenant):
        tenant_id, _ = registered_tenant
        assert isinstance(tenant_id, int)
        assert tenant_id > 0

    def test_register_duplicate_schema_returns_400(self, api: APIRequestContext, registered_tenant):
        """Registrar dos tenants con el mismo schema_name debe fallar con 400."""
        _, api_key = registered_tenant
        # Use httpx instead of nesting sync_playwright
        me = httpx.get(f"{BASE_URL}{API_PREFIX}/tenants/me",
                       headers={"x-api-key": api_key}).json()
        schema_name = me["schema_name"]

        resp = httpx.post(f"{BASE_URL}{API_PREFIX}/tenants/register", json={
            "name": "Duplicate Tenant",
            "schema_name": schema_name,
            "plan": "free"
        })
        assert resp.status_code == 400
        assert "already in use" in resp.json()["detail"]

    def test_register_invalid_schema_name_returns_400(self, anon_api: APIRequestContext):
        """Schema names con caracteres especiales deben rechazarse."""
        resp = anon_api.post(f"{API_PREFIX}/tenants/register", data=json.dumps({
            "name": "Bad Tenant",
            "schema_name": "bad-schema-name!",
            "plan": "free"
        }), headers={"Content-Type": "application/json"})
        # Accept 400 or 422 (Pydantic validation)
        assert resp.status in (400, 422)


class TestApiKeyManagement:

    def test_generate_api_key_returns_key_and_label(self, registered_tenant):
        tenant_id, _ = registered_tenant
        resp = httpx.post(f"{BASE_URL}{API_PREFIX}/tenants/{tenant_id}/api-keys",
                          params={"label": "integration-test"})
        assert resp.status_code == 200
        data = resp.json()
        assert_json_keys(data, "key", "label")
        assert data["key"].startswith("sk_live_")
        assert data["label"] == "integration-test"

    def test_generate_api_key_for_nonexistent_tenant_returns_404(self, anon_api: APIRequestContext):
        resp = anon_api.post(f"{API_PREFIX}/tenants/99999/api-keys", params={"label": "test"})
        assert resp.status == 404


class TestAuthentication:

    def test_get_me_with_valid_key_returns_tenant_info(self, api: APIRequestContext):
        resp = api.get(f"{API_PREFIX}/tenants/me")
        assert resp.status == 200
        data = resp.json()
        assert_json_keys(data, "id", "name", "schema_name", "plan", "is_active", "created_at")
        assert data["is_active"] is True

    def test_get_me_without_key_returns_403(self, anon_api: APIRequestContext):
        resp = anon_api.get(f"{API_PREFIX}/tenants/me")
        assert resp.status in (401, 403)

    def test_get_me_with_invalid_key_returns_401_or_403(self):
        resp = httpx.get(f"{BASE_URL}{API_PREFIX}/tenants/me",
                         headers={"x-api-key": "sk_live_INVALID_KEY_DOES_NOT_EXIST"})
        assert resp.status_code in (401, 403)

    def test_update_webhook_url(self, api: APIRequestContext):
        resp = api.patch(f"{API_PREFIX}/tenants/me/webhook", data=json.dumps({
            "webhook_url": "https://test-webhook.example.com/hook"
        }), headers={"Content-Type": "application/json"})
        assert resp.status == 200
        data = resp.json()
        assert data["webhook_url"] == "https://test-webhook.example.com/hook"
