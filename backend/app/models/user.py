"""
Modelos de autenticación — Usuarios, Refresh Tokens, y Token Blacklist.

Todas las tablas viven en el schema `public` porque la autenticación
es global (un usuario pertenece a un tenant, pero el login es centralizado).
"""
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class User(SQLModel, table=True):
    """Usuario del sistema. Pertenece a un tenant."""
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: str = Field(default="viewer")  # 'admin' | 'viewer'
    tenant_id: int = Field(foreign_key="public.tenants.id")
    is_active: bool = Field(default=True)
    
    # Anti brute-force
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(SQLModel, table=True):
    """
    Refresh tokens almacenados con hash SHA-256.
    La 'family_id' agrupa tokens de una misma sesión de login para
    implementar detección de robo por rotación.
    """
    __tablename__ = "refresh_tokens"
    __table_args__ = {"schema": "public"}

    id: Optional[int] = Field(default=None, primary_key=True)
    token_hash: str = Field(index=True)  # SHA-256 del token opaco
    user_id: int = Field(foreign_key="public.users.id", index=True)
    family_id: str = Field(index=True)  # Agrupa tokens de la misma sesión
    is_revoked: bool = Field(default=False)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TokenBlacklistEntry(SQLModel, table=True):
    """JTIs de access tokens invalidados (logout)."""
    __tablename__ = "token_blacklist"
    __table_args__ = {"schema": "public"}

    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(unique=True, index=True)  # JWT ID único
    expires_at: datetime  # Cuándo expira el JWT original
    blacklisted_at: datetime = Field(default_factory=datetime.utcnow)
