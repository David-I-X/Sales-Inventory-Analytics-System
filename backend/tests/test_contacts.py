"""
test_contacts.py — Tests CRUD completo para el módulo de contactos.
All HTTP mutations use JSON body (not form data) — FastAPI Pydantic models require JSON.
"""
import json
import uuid
import pytest
from playwright.sync_api import APIRequestContext
from tests.conftest import assert_json_keys, API_PREFIX, JSON_HEADERS


def unique_phone(prefix: str = "+5701") -> str:
    """Generate a globally unique phone using UUID hex to avoid cross-run collisions."""
    return f"{prefix}{uuid.uuid4().hex[:9]}"


class TestCreateContact:

    def test_create_contact_success(self, api: APIRequestContext):
        phone = unique_phone("+5701")
        resp = api.post(f"{API_PREFIX}/contacts/",
                        data=json.dumps({"name": "María García", "phone": phone, "email": "maria@example.com"}),
                        headers=JSON_HEADERS)
        assert resp.status == 200
        data = resp.json()
        assert_json_keys(data, "id", "name", "phone", "email", "funnel_stage", "lead_score", "created_at", "updated_at")
        assert data["name"] == "María García"
        assert data["phone"] == phone
        assert data["funnel_stage"] == "new"
        assert data["lead_score"] == 0.0

    def test_create_contact_without_phone_is_allowed(self, api: APIRequestContext):
        resp = api.post(f"{API_PREFIX}/contacts/",
                        data=json.dumps({"name": "Sin Teléfono", "email": f"nophone_{uuid.uuid4().hex[:8]}@example.com"}),
                        headers=JSON_HEADERS)
        assert resp.status == 200
        assert resp.json()["phone"] is None

    def test_create_contact_duplicate_phone_returns_400(self, api: APIRequestContext, contact: dict):
        """A phone already registered must be rejected with 400."""
        resp = api.post(f"{API_PREFIX}/contacts/",
                        data=json.dumps({"name": "Duplicado", "phone": contact["phone"]}),
                        headers=JSON_HEADERS)
        assert resp.status == 400
        assert "already exists" in resp.json()["detail"]

    def test_create_contact_minimal_fields(self, api: APIRequestContext):
        resp = api.post(f"{API_PREFIX}/contacts/",
                        data=json.dumps({"name": "Solo Nombre"}),
                        headers=JSON_HEADERS)
        assert resp.status == 200


class TestReadContacts:

    def test_list_contacts_returns_array(self, api: APIRequestContext, contact: dict):
        resp = api.get(f"{API_PREFIX}/contacts/")
        assert resp.status == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_contacts_pagination(self, api: APIRequestContext):
        resp = api.get(f"{API_PREFIX}/contacts/", params={"skip": 0, "limit": 2})
        assert resp.status == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) <= 2

    def test_get_contact_by_id(self, api: APIRequestContext, contact: dict):
        resp = api.get(f"{API_PREFIX}/contacts/{contact['id']}")
        assert resp.status == 200
        data = resp.json()
        assert data["id"] == contact["id"]
        assert data["name"] == contact["name"]
        assert data["phone"] == contact["phone"]

    def test_get_nonexistent_contact_returns_404(self, api: APIRequestContext):
        resp = api.get(f"{API_PREFIX}/contacts/99999999")
        assert resp.status == 404


class TestUpdateContact:

    def test_update_contact_name(self, api: APIRequestContext, contact: dict):
        resp = api.patch(f"{API_PREFIX}/contacts/{contact['id']}",
                         data=json.dumps({"name": "Nombre Actualizado"}),
                         headers=JSON_HEADERS)
        assert resp.status == 200
        assert resp.json()["name"] == "Nombre Actualizado"

    def test_update_contact_funnel_stage(self, api: APIRequestContext, contact: dict):
        resp = api.patch(f"{API_PREFIX}/contacts/{contact['id']}",
                         data=json.dumps({"funnel_stage": "lead"}),
                         headers=JSON_HEADERS)
        assert resp.status == 200
        assert resp.json()["funnel_stage"] == "lead"

    def test_partial_update_only_changes_specified_fields(self, api: APIRequestContext, contact: dict):
        """PATCH must NOT overwrite fields that were not sent."""
        original_email = contact["email"]
        resp = api.patch(f"{API_PREFIX}/contacts/{contact['id']}",
                         data=json.dumps({"name": "Solo Nombre Cambia"}),
                         headers=JSON_HEADERS)
        assert resp.status == 200
        updated = resp.json()
        assert updated["name"] == "Solo Nombre Cambia"
        assert updated["email"] == original_email  # unchanged

    def test_update_nonexistent_contact_returns_404(self, api: APIRequestContext):
        resp = api.patch(f"{API_PREFIX}/contacts/99999999",
                         data=json.dumps({"name": "Ghost"}),
                         headers=JSON_HEADERS)
        assert resp.status == 404


class TestDeleteContact:

    def test_delete_contact_success(self, api: APIRequestContext):
        created = api.post(f"{API_PREFIX}/contacts/",
                           data=json.dumps({"name": "Para Eliminar", "phone": unique_phone("+5702")}),
                           headers=JSON_HEADERS).json()
        resp = api.delete(f"{API_PREFIX}/contacts/{created['id']}")
        assert resp.status == 200
        assert resp.json()["deleted_id"] == created["id"]

    def test_deleted_contact_is_not_found(self, api: APIRequestContext):
        created = api.post(f"{API_PREFIX}/contacts/",
                           data=json.dumps({"name": "Para Eliminar 2", "phone": unique_phone("+5702")}),
                           headers=JSON_HEADERS).json()
        api.delete(f"{API_PREFIX}/contacts/{created['id']}")
        resp = api.get(f"{API_PREFIX}/contacts/{created['id']}")
        assert resp.status == 404

    def test_delete_nonexistent_contact_returns_404(self, api: APIRequestContext):
        resp = api.delete(f"{API_PREFIX}/contacts/99999999")
        assert resp.status == 404
