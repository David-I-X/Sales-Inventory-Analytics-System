"""
test_crm.py — Tests para el módulo CRM + WhatsApp.
"""
import json
import uuid
import httpx
import pytest
from playwright.sync_api import APIRequestContext
from tests.conftest import assert_json_keys, API_PREFIX, BASE_URL

VERIFY_TOKEN = "my_secure_verify_token_123"


class TestWhatsAppWebhookVerification:

    def test_verify_webhook_with_correct_token_returns_challenge(self, anon_api: APIRequestContext):
        resp = anon_api.get(f"{API_PREFIX}/crm/whatsapp/webhook", params={
            "hub.mode": "subscribe",
            "hub.verify_token": VERIFY_TOKEN,
            "hub.challenge": "challenge_abc123"
        })
        assert resp.status == 200

    def test_verify_webhook_with_wrong_token_returns_403(self, anon_api: APIRequestContext):
        resp = anon_api.get(f"{API_PREFIX}/crm/whatsapp/webhook", params={
            "hub.mode": "subscribe",
            "hub.verify_token": "token_incorrecto",
            "hub.challenge": "challenge_abc123"
        })
        assert resp.status == 403

    def test_verify_webhook_without_params_returns_403(self, anon_api: APIRequestContext):
        resp = anon_api.get(f"{API_PREFIX}/crm/whatsapp/webhook")
        assert resp.status == 403


class TestWhatsAppIncoming:

    def _meta_payload(self, phone: str, text: str) -> dict:
        return {
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": phone,
                            "type": "text",
                            "text": {"body": text}
                        }]
                    }
                }]
            }]
        }

    def test_receive_message_returns_ok(self, api: APIRequestContext, registered_tenant):
        """Use httpx to avoid Playwright timeout waiting for background task completion."""
        _, api_key = registered_tenant
        phone = f"+57301{uuid.uuid4().int % 10_000_000:07d}"
        payload = self._meta_payload(phone, "Hola, quiero una cotización")
        resp = httpx.post(
            f"{BASE_URL}{API_PREFIX}/crm/whatsapp/webhook",
            json=payload,
            headers={"x-api-key": api_key},
            timeout=30.0
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_receive_message_without_auth_returns_403(self, anon_api: APIRequestContext):
        payload = self._meta_payload("+573011234567", "Test")
        resp = anon_api.post(f"{API_PREFIX}/crm/whatsapp/webhook", data=json.dumps(payload),
                             headers={"Content-Type": "application/json"})
        assert resp.status in (401, 403)

    def test_receive_empty_payload_does_not_crash(self, api: APIRequestContext):
        """El endpoint siempre responde 200 para evitar que Meta reintente."""
        resp = api.post(f"{API_PREFIX}/crm/whatsapp/webhook",
                        data="{}", headers={"Content-Type": "application/json"})
        assert resp.status == 200

    def test_receive_payload_without_messages_does_not_crash(self, api: APIRequestContext):
        payload = {"entry": [{"changes": [{"value": {"messages": []}}]}]}
        resp = api.post(f"{API_PREFIX}/crm/whatsapp/webhook", data=json.dumps(payload),
                        headers={"Content-Type": "application/json"})
        assert resp.status == 200


class TestWhatsAppOutgoing:

    def test_send_message_to_existing_contact(self, api: APIRequestContext, contact: dict):
        resp = api.post(f"{API_PREFIX}/crm/whatsapp/send", data={
            "contact_id": contact["id"],
            "text": "Hola, le confirmamos su cita para mañana."
        })
        assert resp.status == 200
        data = resp.json()
        assert data["status"] == "sent"
        assert data["to"] == contact["phone"]

    def test_send_message_to_nonexistent_contact_returns_404(self, api: APIRequestContext):
        resp = api.post(f"{API_PREFIX}/crm/whatsapp/send", data={
            "contact_id": 99999999,
            "text": "Este mensaje no debería enviarse."
        })
        assert resp.status == 404

    def test_send_message_without_auth_returns_403(self, anon_api: APIRequestContext):
        resp = anon_api.post(f"{API_PREFIX}/crm/whatsapp/send", data=json.dumps({
            "contact_id": 1, "text": "Test"
        }), headers={"Content-Type": "application/json"})
        assert resp.status in (401, 403)
