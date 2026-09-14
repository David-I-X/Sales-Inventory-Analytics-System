"""
conftest.py — Shared fixtures for the SaaS Vertical test suite.

Uses Playwright's APIRequestContext for HTTP assertions against the
live FastAPI server (must be running on port 8000).

Fixture hierarchy:
  playwright_instance (session) → starts Playwright once
  anon_api (session) → unauthenticated context
  registered_tenant (session) → creates a unique tenant per test run
  api (function) → authenticated context for each test
  contact (function) → a fresh contact for each test

IMPORTANT: All POST/PATCH/DELETE payloads MUST be sent as JSON (not form data).
FastAPI Pydantic models only parse JSON bodies, not form-encoded data.
Use: api.post(url, data=json.dumps({...}), headers={"Content-Type": "application/json"})
"""
import json
import uuid
import pytest
from playwright.sync_api import sync_playwright, APIRequestContext, Playwright

BASE_URL = "http://127.0.0.1:8000"
API_PREFIX = "/api/v1"

# JSON headers shortcut
JSON_HEADERS = {"Content-Type": "application/json"}


def _post_json(ctx: APIRequestContext, path: str, payload: dict, **kwargs) -> "APIResponse":  # type: ignore[name-defined]
    """Helper: POST with proper JSON Content-Type."""
    return ctx.post(path, data=json.dumps(payload), headers=JSON_HEADERS, **kwargs)


def _patch_json(ctx: APIRequestContext, path: str, payload: dict, **kwargs) -> "APIResponse":  # type: ignore[name-defined]
    """Helper: PATCH with proper JSON Content-Type."""
    return ctx.patch(path, data=json.dumps(payload), headers=JSON_HEADERS, **kwargs)


# ─── Session-level: start Playwright once ─────────────────────────────────────

@pytest.fixture(scope="session")
def playwright_instance():
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def anon_api(playwright_instance: Playwright) -> APIRequestContext:
    """Unauthenticated API context — used for tenant registration."""
    ctx = playwright_instance.request.new_context(base_url=BASE_URL)
    yield ctx
    ctx.dispose()


# ─── Session-level: one tenant per test run ───────────────────────────────────

@pytest.fixture(scope="session")
def registered_tenant(anon_api: APIRequestContext):
    """
    Creates a fresh tenant with a unique schema name per test session.
    Returns (tenant_id, api_key) tuple.
    """
    schema = f"test_{uuid.uuid4().hex[:8]}"
    resp = _post_json(anon_api, f"{API_PREFIX}/tenants/register", {
        "name": f"Test Tenant {schema}",
        "schema_name": schema,
        "plan": "pro"
    })
    assert resp.status == 200, f"Tenant registration failed: {resp.text()}"
    tenant = resp.json()
    tenant_id = tenant["id"]

    # Generate API key
    resp = anon_api.post(f"{API_PREFIX}/tenants/{tenant_id}/api-keys", params={"label": "pytest"})
    assert resp.status == 200
    api_key = resp.json()["key"]

    yield tenant_id, api_key

    # NOTE: No teardown — the schema stays in the DB after the test run.
    # Run: psql -c "DROP SCHEMA test_XXXXXXXX CASCADE" if you need to clean up.


# ─── Function-level: authenticated context per test ───────────────────────────

@pytest.fixture(scope="function")
def api(playwright_instance: Playwright, registered_tenant) -> APIRequestContext:
    """Authenticated context using the session's API key."""
    _, api_key = registered_tenant
    ctx = playwright_instance.request.new_context(
        base_url=BASE_URL,
        extra_http_headers={"x-api-key": api_key}
    )
    yield ctx
    ctx.dispose()


# ─── Function-level: a fresh contact for each test ────────────────────────────

@pytest.fixture(scope="function")
def contact(api: APIRequestContext):
    """
    Creates a unique contact and yields its full JSON response.
    Uses UUID hex for the phone to ensure global uniqueness across test runs.
    """
    # Use UUID hex suffix (16 chars) to make phone unique across all test runs.
    # Truncate to 10 digits total after country code to simulate a valid phone.
    uid = uuid.uuid4().hex[:9]  # 9 hex chars = virtually zero collision probability
    phone = f"+5700{uid}"
    resp = _post_json(api, f"{API_PREFIX}/contacts/", {
        "name": "Test User",
        "phone": phone,
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com"
    })
    assert resp.status == 200, f"Contact creation failed: {resp.status} {resp.text()}"
    yield resp.json()


# ─── Helper ───────────────────────────────────────────────────────────────────

def assert_json_keys(data: dict, *keys):
    """Assert that all expected keys exist in a response dict."""
    for key in keys:
        assert key in data, f"Expected key '{key}' not found in: {list(data.keys())}"
