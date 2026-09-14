"""
webhook_security.py — Firmado y verificación HMAC SHA-256 para webhooks.

Cada webhook saliente incluye un header X-SaaS-Signature que el receptor
puede usar para verificar que el payload es auténtico y no fue manipulado.
"""
import hmac
import hashlib
import json
from typing import Dict, Any


def sign_payload(payload: Dict[str, Any], secret: str) -> str:
    """
    Genera una firma HMAC-SHA256 del payload JSON.
    
    1. Serializa el payload a JSON con sort_keys=True (orden determinístico).
    2. Calcula HMAC-SHA256 usando el webhook_secret del tenant como clave.
    3. Retorna la firma como string hexadecimal.
    """
    payload_bytes = json.dumps(payload, sort_keys=True, default=str).encode('utf-8')
    signature = hmac.new(
        key=secret.encode('utf-8'),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


def verify_signature(payload: Dict[str, Any], signature: str, secret: str) -> bool:
    """
    Verifica que la firma HMAC-SHA256 del payload coincida.
    Usa hmac.compare_digest para prevenir timing attacks.
    """
    expected = sign_payload(payload, secret)
    return hmac.compare_digest(expected, signature)
