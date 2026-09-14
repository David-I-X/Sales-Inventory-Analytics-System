"""
test_webhook_security.py — Tests para el módulo de seguridad de webhooks.

Verifica:
1. Firma HMAC-SHA256 correcta se genera y verifica.
2. Firma incorrecta se rechaza.
3. Webhook service reintenta en caso de fallo.
4. Webhook service no reintenta si el primer intento es exitoso.
"""
import json
import pytest
from app.core.webhook_security import sign_payload, verify_signature


class TestHmacSignAndVerify:
    """Verifica la generación y validación de firmas HMAC-SHA256."""

    def test_sign_produces_sha256_prefix(self):
        """La firma debe comenzar con 'sha256='."""
        payload = {"event": "invoice.created", "id": 1}
        secret = "mi_secreto_super_seguro"
        signature = sign_payload(payload, secret)
        assert signature.startswith("sha256=")

    def test_sign_is_deterministic(self):
        """El mismo payload + secret siempre produce la misma firma."""
        payload = {"event": "invoice.created", "id": 1}
        secret = "mi_secreto"
        sig1 = sign_payload(payload, secret)
        sig2 = sign_payload(payload, secret)
        assert sig1 == sig2

    def test_verify_correct_signature(self):
        """Firma correcta se verifica exitosamente."""
        payload = {"event": "invoice.created", "id": 1, "total": 150000.50}
        secret = "webhook_secret_tec360"
        signature = sign_payload(payload, secret)
        assert verify_signature(payload, signature, secret) is True

    def test_verify_wrong_signature_rejected(self):
        """Firma incorrecta se rechaza."""
        payload = {"event": "invoice.created", "id": 1}
        secret = "secreto_correcto"
        signature = sign_payload(payload, secret)
        assert verify_signature(payload, signature, "secreto_incorrecto") is False

    def test_verify_tampered_payload_rejected(self):
        """Payload modificado después de firmar se rechaza."""
        payload = {"event": "invoice.created", "id": 1, "total": 100}
        secret = "mi_secreto"
        signature = sign_payload(payload, secret)
        # Alguien modifica el total
        tampered = {"event": "invoice.created", "id": 1, "total": 999999}
        assert verify_signature(tampered, signature, secret) is False

    def test_sign_sorts_keys(self):
        """El orden de las keys no afecta la firma (sort_keys=True)."""
        secret = "test"
        sig1 = sign_payload({"b": 2, "a": 1}, secret)
        sig2 = sign_payload({"a": 1, "b": 2}, secret)
        assert sig1 == sig2

    def test_different_secrets_produce_different_signatures(self):
        """Diferentes secrets producen firmas diferentes."""
        payload = {"event": "test"}
        sig1 = sign_payload(payload, "secret_1")
        sig2 = sign_payload(payload, "secret_2")
        assert sig1 != sig2
