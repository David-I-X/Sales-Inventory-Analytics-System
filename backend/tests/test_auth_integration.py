"""
test_auth_integration.py — Integration tests for Phase 5 authentication HTTP endpoints.

Tests against live running server (http://127.0.0.1:8000):
1. Register admin user for a tenant.
2. Login with valid credentials → returns access_token + refresh_token.
3. Login with invalid password → 401.
4. Anti brute-force: 5 failed attempts → account locked (403).
5. Protected endpoint (/api/v1/auth/me) with Bearer token.
6. Refresh token rotation → get new access & refresh tokens.
7. Attempting reuse of invalidated refresh token → detection & rejection.
8. Logout → blacklists access token, invalidates refresh tokens.
9. Dual authentication: test flexible dependency accepting API Key OR JWT.
"""
import json
import uuid
import pytest
from playwright.sync_api import APIRequestContext, Playwright
from tests.conftest import BASE_URL, API_PREFIX, JSON_HEADERS, _post_json


@pytest.fixture(scope="module")
def auth_tenant(anon_api: APIRequestContext):
    """Creates a unique tenant for auth testing."""
    schema = f"authtest_{uuid.uuid4().hex[:8]}"
    resp = _post_json(anon_api, f"{API_PREFIX}/tenants/register", {
        "name": f"Auth Test Tenant {schema}",
        "schema_name": schema,
        "plan": "pro"
    })
    assert resp.status == 200, f"Tenant registration failed: {resp.text()}"
    tenant = resp.json()
    tenant_id = tenant["id"]

    # Generate API key
    resp = anon_api.post(f"{API_PREFIX}/tenants/{tenant_id}/api-keys", params={"label": "auth_test_key"})
    assert resp.status == 200
    api_key = resp.json()["key"]

    return tenant_id, api_key, tenant.get("webhook_secret")


class TestAuthEndpoints:

    def test_register_first_admin(self, anon_api: APIRequestContext, auth_tenant):
        tenant_id, _, _ = auth_tenant
        email = f"admin_{uuid.uuid4().hex[:6]}@example.com"

        resp = _post_json(anon_api, f"{API_PREFIX}/auth/register", {
            "email": email,
            "password": "Password123!",
            "full_name": "Admin Test User",
            "tenant_id": tenant_id
        })
        assert resp.status == 200, f"Register admin failed: {resp.text()}"
        data = resp.json()
        assert data["email"] == email
        assert data["role"] == "admin"
        assert data["tenant_id"] == tenant_id

    def test_register_second_admin_fails(self, anon_api: APIRequestContext, auth_tenant):
        tenant_id, _, _ = auth_tenant
        email2 = f"admin2_{uuid.uuid4().hex[:6]}@example.com"

        # Attempting to register another admin for the same tenant should fail (400)
        resp = _post_json(anon_api, f"{API_PREFIX}/auth/register", {
            "email": email2,
            "password": "Password123!",
            "full_name": "Second Admin",
            "tenant_id": tenant_id
        })
        assert resp.status == 400

    def test_login_success_and_user_flow(self, anon_api: APIRequestContext, playwright_instance: Playwright):
        # Create a fresh tenant & admin
        schema = f"flow_{uuid.uuid4().hex[:8]}"
        reg_resp = _post_json(anon_api, f"{API_PREFIX}/tenants/register", {
            "name": f"Flow Tenant {schema}",
            "schema_name": schema,
            "plan": "pro"
        })
        tenant_id = reg_resp.json()["id"]

        email = f"user_{uuid.uuid4().hex[:6]}@flow.com"
        password = "SecurePassword123!"

        reg_user = _post_json(anon_api, f"{API_PREFIX}/auth/register", {
            "email": email,
            "password": password,
            "full_name": "Flow User",
            "tenant_id": tenant_id
        })
        assert reg_user.status == 200

        # Login
        login_resp = _post_json(anon_api, f"{API_PREFIX}/auth/login", {
            "email": email,
            "password": password
        })
        assert login_resp.status == 200, f"Login failed: {login_resp.text()}"
        tokens = login_resp.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Access /auth/me with Bearer token
        auth_ctx = playwright_instance.request.new_context(
            base_url=BASE_URL,
            extra_http_headers={"Authorization": f"Bearer {access_token}"}
        )
        me_resp = auth_ctx.get(f"{API_PREFIX}/auth/me")
        assert me_resp.status == 200
        me_data = me_resp.json()
        assert me_data["email"] == email

        # Refresh token rotation
        ref_resp = _post_json(anon_api, f"{API_PREFIX}/auth/refresh", {
            "refresh_token": refresh_token
        })
        assert ref_resp.status == 200, f"Refresh failed: {ref_resp.text()}"
        new_tokens = ref_resp.json()
        new_access = new_tokens["access_token"]
        new_refresh = new_tokens["refresh_token"]
        assert new_access != access_token
        assert new_refresh != refresh_token

        # Attempt reuse of old refresh token (theft detection)
        theft_resp = _post_json(anon_api, f"{API_PREFIX}/auth/refresh", {
            "refresh_token": refresh_token
        })
        assert theft_resp.status == 401

        # Logout with new access token
        new_auth_ctx = playwright_instance.request.new_context(
            base_url=BASE_URL,
            extra_http_headers={"Authorization": f"Bearer {new_access}"}
        )
        logout_resp = new_auth_ctx.post(f"{API_PREFIX}/auth/logout")
        assert logout_resp.status == 200

        # Verify old token is blacklisted now
        post_logout_me = new_auth_ctx.get(f"{API_PREFIX}/auth/me")
        assert post_logout_me.status == 401

    def test_brute_force_lockout(self, anon_api: APIRequestContext):
        schema = f"bf_{uuid.uuid4().hex[:8]}"
        reg_resp = _post_json(anon_api, f"{API_PREFIX}/tenants/register", {
            "name": f"BF Tenant {schema}",
            "schema_name": schema,
            "plan": "pro"
        })
        tenant_id = reg_resp.json()["id"]

        email = f"bf_{uuid.uuid4().hex[:6]}@test.com"
        password = "CorrectPassword123!"

        _post_json(anon_api, f"{API_PREFIX}/auth/register", {
            "email": email,
            "password": password,
            "full_name": "BF Target",
            "tenant_id": tenant_id
        })

        # 4 failed attempts
        for _ in range(4):
            fail_resp = _post_json(anon_api, f"{API_PREFIX}/auth/login", {
                "email": email,
                "password": "WrongPassword!"
            })
            assert fail_resp.status == 401

        # 5th failed attempt triggers lockout
        lock_resp = _post_json(anon_api, f"{API_PREFIX}/auth/login", {
            "email": email,
            "password": "WrongPassword!"
        })
        assert lock_resp.status == 403

        # Even with correct password, now blocked
        blocked_resp = _post_json(anon_api, f"{API_PREFIX}/auth/login", {
            "email": email,
            "password": password
        })
        assert blocked_resp.status == 403

    def test_dual_auth_coexistence(self, anon_api: APIRequestContext, playwright_instance: Playwright):
        """Verify that endpoints work with both API Key and JWT Bearer token."""
        schema = f"dual_{uuid.uuid4().hex[:8]}"
        reg_resp = _post_json(anon_api, f"{API_PREFIX}/tenants/register", {
            "name": f"Dual Auth Tenant {schema}",
            "schema_name": schema,
            "plan": "pro"
        })
        tenant_id = reg_resp.json()["id"]

        key_resp = anon_api.post(f"{API_PREFIX}/tenants/{tenant_id}/api-keys", params={"label": "dual"})
        api_key = key_resp.json()["key"]

        email = f"dual_{uuid.uuid4().hex[:6]}@test.com"
        password = "Password123!"

        _post_json(anon_api, f"{API_PREFIX}/auth/register", {
            "email": email,
            "password": password,
            "full_name": "Dual User",
            "tenant_id": tenant_id
        })

        login_resp = _post_json(anon_api, f"{API_PREFIX}/auth/login", {
            "email": email,
            "password": password
        })
        access_token = login_resp.json()["access_token"]

        # Call /contacts/ with API key
        apikey_ctx = playwright_instance.request.new_context(
            base_url=BASE_URL,
            extra_http_headers={"x-api-key": api_key}
        )
        c1 = _post_json(apikey_ctx, f"{API_PREFIX}/contacts/", {
            "name": "Contact via APIKey",
            "phone": f"+57300{uuid.uuid4().hex[:6]}"
        })
        assert c1.status == 200

        # Call /contacts/ with JWT (Bearer)
        jwt_ctx = playwright_instance.request.new_context(
            base_url=BASE_URL,
            extra_http_headers={"Authorization": f"Bearer {access_token}"}
        )
        c2 = _post_json(jwt_ctx, f"{API_PREFIX}/contacts/", {
            "name": "Contact via JWT",
            "phone": f"+57300{uuid.uuid4().hex[:6]}"
        })
        assert c2.status == 200
