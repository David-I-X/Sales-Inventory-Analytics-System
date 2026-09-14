"""
Schemas Pydantic para autenticación y gestión de usuarios.
"""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class UserLogin(BaseModel):
    """Credenciales de login."""
    email: str
    password: str


class UserRegister(BaseModel):
    """Registro del primer admin de un tenant."""
    email: str
    password: str
    full_name: str
    tenant_id: int


class UserCreate(BaseModel):
    """Admin crea un usuario para su tenant."""
    email: str
    password: str
    full_name: str
    role: str = "viewer"  # 'admin' | 'viewer'


class UserResponse(BaseModel):
    """Respuesta pública de usuario (sin password)."""
    id: int
    email: str
    full_name: str
    role: str
    tenant_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenPair(BaseModel):
    """Par de tokens retornado en login y refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Segundos hasta expiración del access token


class RefreshRequest(BaseModel):
    """Request para renovar tokens."""
    refresh_token: str


class MessageResponse(BaseModel):
    """Respuesta simple de mensaje."""
    message: str
