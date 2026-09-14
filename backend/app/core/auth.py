"""
auth.py — Motor de autenticación JWT con refresh token rotation.

Capas de seguridad implementadas:
1. Access Token JWT (15 min) con JTI único para blacklisting.
2. Refresh Token opaco con rotación (detección de robo de tokens).
3. Anti brute-force: bloqueo de cuenta tras 5 intentos fallidos.
4. Token Blacklist: logout efectivo sin Redis (PostgreSQL + caché).
"""
import hashlib
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.token_blacklist import token_blacklist
from app.models.user import User, RefreshToken
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)

# --- Configuración ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


# --- Utilidades de Password ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# --- Utilidades de Token ---
def _hash_token(token: str) -> str:
    """Hash SHA-256 para almacenar refresh tokens de forma segura."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def create_access_token(user: User) -> tuple[str, str, datetime]:
    """
    Crea un Access Token JWT con JTI único.
    Retorna (token_string, jti, expires_at).
    """
    jti = str(uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.email,
        "tenant_id": user.tenant_id,
        "role": user.role,
        "jti": jti,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def create_refresh_token(user: User, session: Session, family_id: Optional[str] = None) -> str:
    """
    Crea un Refresh Token opaco y lo almacena hasheado en PostgreSQL.
    Si no se proporciona family_id, se crea uno nuevo (login fresco).
    Si se proporciona, se reutiliza (rotación dentro de la misma familia).
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_token)
    if family_id is None:
        family_id = str(uuid4())
    
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    refresh = RefreshToken(
        token_hash=token_hash,
        user_id=user.id,
        family_id=family_id,
        expires_at=expires_at,
    )
    session.add(refresh)
    session.flush()
    
    logger.info(f"[Auth] Refresh token creado para user={user.email}, family={family_id[:8]}...")
    return raw_token


# --- Autenticación de Login ---
def authenticate_user(email: str, password: str, session: Session) -> User:
    """
    Autentica un usuario con email y password.
    Implementa protección anti brute-force con bloqueo temporal.
    """
    user = session.exec(select(User).where(User.email == email)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada. Contacte al administrador."
        )
    
    # Verificar bloqueo por brute-force
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = (user.locked_until - datetime.utcnow()).seconds // 60 + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta bloqueada por demasiados intentos fallidos. Intente en {remaining} minutos."
        )
    
    # Si el bloqueo expiró, resetear
    if user.locked_until and user.locked_until <= datetime.utcnow():
        user.failed_login_attempts = 0
        user.locked_until = None
    
    # Verificar password
    if not verify_password(password, user.hashed_password):
        user.failed_login_attempts += 1
        
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_MINUTES)
            session.add(user)
            session.commit()
            logger.warning(f"[Auth] Cuenta {email} BLOQUEADA por {settings.LOCKOUT_MINUTES} min tras {user.failed_login_attempts} intentos")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cuenta bloqueada por {settings.LOCKOUT_MINUTES} minutos tras {settings.MAX_LOGIN_ATTEMPTS} intentos fallidos."
            )
        
        session.add(user)
        session.commit()
        remaining_attempts = settings.MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
        logger.info(f"[Auth] Login fallido para {email}. Intentos restantes: {remaining_attempts}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Login exitoso: resetear contador
    user.failed_login_attempts = 0
    user.locked_until = None
    session.add(user)
    session.flush()
    
    logger.info(f"[Auth] Login exitoso para {email}")
    return user


# --- Refresh Token Rotation ---
def rotate_refresh_token(raw_token: str, session: Session) -> tuple[User, str]:
    """
    Rota un refresh token: invalida el actual y genera uno nuevo.
    Implementa detección de robo: si el token ya fue usado (rotado),
    se invalida TODA la familia de tokens → el usuario debe re-autenticarse.
    
    Retorna (user, new_raw_token).
    """
    token_hash = _hash_token(raw_token)
    
    # Buscar el refresh token por hash
    stored = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    # DETECCIÓN DE ROBO: si el token ya fue revocado, alguien lo clonó
    if stored.is_revoked:
        # Revocar TODA la familia
        family_tokens = session.exec(
            select(RefreshToken).where(RefreshToken.family_id == stored.family_id)
        ).all()
        for ft in family_tokens:
            ft.is_revoked = True
            session.add(ft)
        session.flush()
        
        logger.warning(
            f"[Auth] ⚠️ ROBO DE TOKEN DETECTADO! Familia {stored.family_id[:8]}... "
            f"invalidada para user_id={stored.user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Posible robo de sesión detectado. Todos los tokens han sido invalidados. Inicie sesión nuevamente."
        )
    
    # Verificar expiración
    if stored.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado. Inicie sesión nuevamente."
        )
    
    # Revocar el token actual (rotación)
    stored.is_revoked = True
    session.add(stored)
    
    # Obtener el usuario
    user = session.get(User, stored.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo o no encontrado"
        )
    
    # Crear nuevo refresh token en la misma familia
    new_raw_token = create_refresh_token(user, session, family_id=stored.family_id)
    session.flush()
    
    logger.info(f"[Auth] Refresh token rotado para user={user.email}")
    return user, new_raw_token


# --- Dependency: Obtener usuario actual desde JWT ---
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    """
    Dependency de FastAPI que extrae y valida el usuario desde el JWT.
    Verifica: decodificación, expiración, blacklist, usuario activo.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        jti: str = payload.get("jti")
        if email is None or jti is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    
    # Verificar blacklist
    if token_blacklist.is_blacklisted(jti, session):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revocado. Inicie sesión nuevamente.",
        )
    
    # Obtener usuario
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )
    
    # Set search_path for this tenant
    tenant = session.get(Tenant, user.tenant_id)
    if tenant:
        from sqlalchemy import text
        session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
    
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency que requiere rol 'admin'."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador"
        )
    return user
