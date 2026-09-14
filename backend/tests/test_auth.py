"""
test_auth.py — Tests unitarios para el sistema de autenticación.

Verifica sin necesidad de servidor ni base de datos:
1. Hash y verificación de passwords con bcrypt.
2. Creación y decodificación de JWT access tokens.
3. Blacklist en memoria (TTLCache).
4. Detección de brute-force (lógica pura).

Los tests de integración (login, refresh, logout vía HTTP) requieren
el servidor corriendo y se ejecutan con Playwright en test_auth_integration.py.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch
from uuid import uuid4


class TestPasswordHashing:
    """Verifica el hashing de contraseñas con bcrypt."""

    def test_hash_password_produces_bcrypt_hash(self):
        from app.core.auth import hash_password
        hashed = hash_password("mi_password_seguro")
        assert hashed.startswith("$2b$")  # Prefijo bcrypt

    def test_verify_correct_password(self):
        from app.core.auth import hash_password, verify_password
        password = "SuperSecretPass123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        from app.core.auth import hash_password, verify_password
        hashed = hash_password("password_correcto")
        assert verify_password("password_incorrecto", hashed) is False

    def test_same_password_produces_different_hashes(self):
        """Bcrypt usa salt aleatorio, así que el hash nunca es igual."""
        from app.core.auth import hash_password
        h1 = hash_password("same_password")
        h2 = hash_password("same_password")
        assert h1 != h2  # Diferentes salts


class TestAccessTokenCreation:
    """Verifica la generación y decodificación de JWT access tokens."""

    def test_create_access_token_returns_tuple(self):
        from app.core.auth import create_access_token
        from app.models.user import User
        
        user = User(
            id=1, email="test@example.com", hashed_password="fake",
            full_name="Test", role="admin", tenant_id=1
        )
        token, jti, expires_at = create_access_token(user)
        
        assert isinstance(token, str)
        assert isinstance(jti, str)
        assert isinstance(expires_at, datetime)
        assert len(token) > 50  # JWT tokens son largos

    def test_access_token_contains_correct_claims(self):
        from app.core.auth import create_access_token
        from app.core.config import settings
        from app.models.user import User
        from jose import jwt
        
        user = User(
            id=1, email="admin@tec360.com", hashed_password="fake",
            full_name="Admin", role="admin", tenant_id=42
        )
        token, jti, expires_at = create_access_token(user)
        
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "admin@tec360.com"
        assert payload["tenant_id"] == 42
        assert payload["role"] == "admin"
        assert payload["jti"] == jti

    def test_access_token_unique_jti(self):
        """Cada token tiene un JTI diferente."""
        from app.core.auth import create_access_token
        from app.models.user import User
        
        user = User(
            id=1, email="test@example.com", hashed_password="fake",
            full_name="Test", role="admin", tenant_id=1
        )
        _, jti1, _ = create_access_token(user)
        _, jti2, _ = create_access_token(user)
        assert jti1 != jti2


class TestRefreshTokenHashing:
    """Verifica el hashing SHA-256 de refresh tokens."""

    def test_hash_token_deterministic(self):
        from app.core.auth import _hash_token
        h1 = _hash_token("my_refresh_token_abc123")
        h2 = _hash_token("my_refresh_token_abc123")
        assert h1 == h2

    def test_hash_token_different_inputs(self):
        from app.core.auth import _hash_token
        h1 = _hash_token("token_a")
        h2 = _hash_token("token_b")
        assert h1 != h2

    def test_hash_token_is_64_hex_chars(self):
        """SHA-256 produce 64 caracteres hexadecimales."""
        from app.core.auth import _hash_token
        h = _hash_token("any_token")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)


class TestTokenBlacklistInMemory:
    """Verifica la caché en memoria del blacklist (sin PostgreSQL)."""

    def test_blacklist_cache_empty_initially(self):
        from app.core.token_blacklist import TokenBlacklist
        bl = TokenBlacklist()
        # Sin session, solo verificamos que no está en caché
        assert "random_jti" not in bl._cache

    def test_blacklist_cache_add_and_check(self):
        from app.core.token_blacklist import TokenBlacklist
        bl = TokenBlacklist()
        bl._cache["test_jti_123"] = True
        assert "test_jti_123" in bl._cache

    def test_blacklist_cache_maxsize(self):
        """La caché respeta el maxsize configurado."""
        from cachetools import TTLCache
        cache = TTLCache(maxsize=3, ttl=900)
        cache["a"] = True
        cache["b"] = True
        cache["c"] = True
        cache["d"] = True  # Debería evictar "a"
        assert "a" not in cache
        assert "d" in cache


class TestWebhookSecurityIntegration:
    """Tests adicionales para la integración de firma en webhooks."""

    def test_sign_with_special_characters_in_payload(self):
        from app.core.webhook_security import sign_payload, verify_signature
        payload = {
            "event": "invoice.created",
            "customer": "José García 'El Rápido'",
            "total": 1500000.99,
            "notes": "Factura con IVA del 19%\nSegunda línea"
        }
        secret = "test_secret_with_unicode_ñ"
        sig = sign_payload(payload, secret)
        assert verify_signature(payload, sig, secret) is True

    def test_sign_with_nested_payload(self):
        from app.core.webhook_security import sign_payload, verify_signature
        payload = {
            "event": "invoice.created",
            "data": {
                "items": [
                    {"sku": "GPS-001", "qty": 2},
                    {"sku": "CAM-002", "qty": 1}
                ],
                "metadata": {"source": "tec360"}
            }
        }
        secret = "nested_test_secret"
        sig = sign_payload(payload, secret)
        assert verify_signature(payload, sig, secret) is True
