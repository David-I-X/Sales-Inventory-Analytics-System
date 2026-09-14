"""
Endpoints de autenticación y gestión de usuarios.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from sqlalchemy import text

from app.core.database import get_session, engine
from app.core.config import settings
from app.core.auth import (
    hash_password, authenticate_user, create_access_token,
    create_refresh_token, rotate_refresh_token, get_current_user,
    get_current_admin, _hash_token
)
from app.core.token_blacklist import token_blacklist
from app.models.user import User, RefreshToken
from app.models.tenant import Tenant
from app.schemas.user import (
    UserLogin, UserRegister, UserCreate, UserResponse,
    TokenPair, RefreshRequest, MessageResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=TokenPair)
def login(credentials: UserLogin, session: Session = Depends(get_session)):
    """
    Autenticar con email + password.
    Retorna access_token (15 min) + refresh_token (7 días).
    """
    user = authenticate_user(credentials.email, credentials.password, session)
    
    access_token, jti, expires_at = create_access_token(user)
    refresh_token = create_refresh_token(user, session)
    
    session.commit()
    
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(body: RefreshRequest, session: Session = Depends(get_session)):
    """
    Rota el refresh token y genera un nuevo par de tokens.
    El refresh token anterior se invalida inmediatamente.
    """
    user, new_refresh_token = rotate_refresh_token(body.refresh_token, session)
    
    access_token, jti, expires_at = create_access_token(user)
    
    session.commit()
    
    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Cierra la sesión blacklisteando el access token actual
    e invalidando todos los refresh tokens del usuario.
    """
    from jose import jwt as jose_jwt
    
    # 1. Extraer el JWT del header Authorization y blacklistear su JTI
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        raw_token = auth_header[7:]
        try:
            payload = jose_jwt.decode(
                raw_token, settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from datetime import datetime
                expires_at = datetime.utcfromtimestamp(exp)
                token_blacklist.blacklist_token(jti, expires_at, session)
        except Exception:
            pass  # Token ya fue validado por get_current_user
    
    # 2. Invalidar todos los refresh tokens del usuario
    refresh_tokens = session.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.is_revoked == False
        )
    ).all()
    for rt in refresh_tokens:
        rt.is_revoked = True
        session.add(rt)
    
    session.commit()
    
    logger.info(f"[Auth] Logout completo para {current_user.email}")
    return MessageResponse(message="Sesión cerrada exitosamente")


@router.post("/register", response_model=UserResponse)
def register_first_admin(user_in: UserRegister, session: Session = Depends(get_session)):
    """
    Registra el primer usuario admin de un tenant.
    Solo funciona si el tenant no tiene usuarios registrados aún.
    """
    # Verificar que el tenant existe
    tenant = session.get(Tenant, user_in.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    
    # Verificar que no hay admin existente para este tenant
    existing = session.exec(
        select(User).where(User.tenant_id == user_in.tenant_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Este tenant ya tiene usuarios registrados. Use el endpoint de admin para crear más."
        )
    
    # Verificar email único
    if session.exec(select(User).where(User.email == user_in.email)).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role="admin",  # El primer usuario siempre es admin
        tenant_id=user_in.tenant_id
    )
    session.add(user)
    session.commit()
    
    logger.info(f"[Auth] Primer admin registrado: {user.email} para tenant_id={user_in.tenant_id}")
    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retorna la información del usuario autenticado."""
    return current_user


@router.post("/admin/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    Admin crea un usuario adicional para su tenant.
    """
    # Verificar email único
    if session.exec(select(User).where(User.email == user_in.email)).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        tenant_id=admin.tenant_id  # Mismo tenant que el admin
    )
    session.add(user)
    session.commit()
    
    logger.info(f"[Auth] Usuario creado: {user.email} (rol={user.role}) por admin={admin.email}")
    return user


@router.get("/admin/users", response_model=list[UserResponse])
def list_users(
    admin: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """
    Lista todos los usuarios del tenant del admin.
    """
    users = session.exec(
        select(User).where(User.tenant_id == admin.tenant_id)
    ).all()
    return users
