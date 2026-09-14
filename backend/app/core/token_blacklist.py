"""
token_blacklist.py — Blacklist de JWT sin Redis.

Usa un enfoque híbrido:
- Caché en memoria (TTLCache de cachetools) para consultas O(1) en el hot path.
- PostgreSQL (tabla public.token_blacklist) como almacenamiento persistente.
- Al reiniciar: se cargan los JTIs no expirados de PostgreSQL a la caché.
- Limpieza automática periódica de registros expirados.
"""
import logging
from datetime import datetime, timedelta
from cachetools import TTLCache
from sqlmodel import Session, select
from sqlalchemy import text
from app.core.config import settings
from app.models.user import TokenBlacklistEntry

logger = logging.getLogger(__name__)


class TokenBlacklist:
    """
    Gestor de blacklist de tokens JWT.
    Combina caché en memoria (rápido) con PostgreSQL (persistente).
    """

    def __init__(self):
        # TTL = 15 min (vida máxima de un access token)
        self._cache: TTLCache = TTLCache(
            maxsize=settings.BLACKLIST_CACHE_MAXSIZE,
            ttl=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def blacklist_token(self, jti: str, expires_at: datetime, session: Session) -> None:
        """
        Agrega un JTI a la blacklist (caché + PostgreSQL).
        """
        # 1. Agregar a caché en memoria
        self._cache[jti] = True

        # 2. Persistir en PostgreSQL
        entry = TokenBlacklistEntry(jti=jti, expires_at=expires_at)
        session.add(entry)
        session.flush()
        logger.info(f"[Blacklist] Token {jti[:8]}... blacklisteado hasta {expires_at}")

    def is_blacklisted(self, jti: str, session: Session) -> bool:
        """
        Verifica si un JTI está blacklisteado.
        1. Consulta caché (O(1), nanosegundos).
        2. Si no está en caché, consulta PostgreSQL (fallback).
        3. Si lo encuentra en PostgreSQL, lo agrega a la caché para futuras consultas.
        """
        # Fast path: caché en memoria
        if jti in self._cache:
            return True

        # Slow path: PostgreSQL
        statement = select(TokenBlacklistEntry).where(TokenBlacklistEntry.jti == jti)
        entry = session.exec(statement).first()
        if entry:
            # Rehidratar caché
            self._cache[jti] = True
            return True

        return False

    def load_from_db(self, session: Session) -> int:
        """
        Carga todos los JTIs no expirados de PostgreSQL a la caché en memoria.
        Se ejecuta al arrancar el servidor para restaurar el estado post-reinicio.
        Retorna la cantidad de JTIs cargados.
        """
        statement = select(TokenBlacklistEntry).where(
            TokenBlacklistEntry.expires_at > datetime.utcnow()
        )
        entries = session.exec(statement).all()
        count = 0
        for entry in entries:
            self._cache[entry.jti] = True
            count += 1
        logger.info(f"[Blacklist] Cargados {count} JTIs activos desde PostgreSQL")
        return count

    def cleanup_expired(self, session: Session) -> int:
        """
        Elimina registros expirados de PostgreSQL.
        Se ejecuta periódicamente (cada hora) para mantener la tabla limpia.
        """
        result = session.execute(
            text("DELETE FROM public.token_blacklist WHERE expires_at < :now"),
            {"now": datetime.utcnow()}
        )
        deleted = result.rowcount
        if deleted > 0:
            session.flush()
            logger.info(f"[Blacklist] Limpiados {deleted} registros expirados")
        return deleted


# Singleton global
token_blacklist = TokenBlacklist()
