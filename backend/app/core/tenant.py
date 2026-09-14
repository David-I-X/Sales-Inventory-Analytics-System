from typing import Optional
from fastapi import Header, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from sqlmodel import Session, select
from sqlalchemy import text
from app.core.database import get_session
from app.models.tenant import Tenant, ApiKey
from app.core.auth import oauth2_scheme, get_current_user
from app.models.user import User
from jose import jwt, JWTError
from app.core.config import settings
from app.core.token_blacklist import token_blacklist

api_key_header = APIKeyHeader(name="x-api-key", auto_error=True)

_verified_schemas = set()

def ensure_tenant_schema_tables(schema: str, session: Session):
    if schema in _verified_schemas:
        return
    session.execute(text(f'''
        CREATE SCHEMA IF NOT EXISTS "{schema}";
        CREATE TABLE IF NOT EXISTS "{schema}".products (
            id SERIAL PRIMARY KEY,
            sku VARCHAR UNIQUE NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT,
            category VARCHAR,
            unit_measure VARCHAR DEFAULT 'unidad',
            sale_price NUMERIC(12,2) DEFAULT 0,
            cost_price NUMERIC(12,2) DEFAULT 0,
            current_stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 5,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS unit_measure VARCHAR DEFAULT 'unidad';
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2) DEFAULT 0;
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) DEFAULT 0;
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
        ALTER TABLE "{schema}".products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        
        CREATE TABLE IF NOT EXISTS "{schema}".suppliers (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            nit VARCHAR,
            phone VARCHAR,
            email VARCHAR,
            address VARCHAR,
            contact_person VARCHAR,
            notes TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "{schema}".inventory_movements (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES "{schema}".products(id),
            movement_type VARCHAR NOT NULL,
            quantity INTEGER NOT NULL,
            unit_cost NUMERIC(12,2) DEFAULT 0,
            reference_type VARCHAR DEFAULT 'manual',
            reference_id INTEGER,
            notes TEXT,
            created_by VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "{schema}".purchases (
            id SERIAL PRIMARY KEY,
            supplier_id INTEGER REFERENCES "{schema}".suppliers(id),
            purchase_number VARCHAR NOT NULL,
            items JSONB DEFAULT '[]',
            subtotal NUMERIC(12,2) DEFAULT 0,
            tax NUMERIC(12,2) DEFAULT 0,
            total NUMERIC(12,2) DEFAULT 0,
            notes TEXT,
            created_by VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS "{schema}".accounting_entries (
            id SERIAL PRIMARY KEY,
            entry_type VARCHAR NOT NULL,
            amount NUMERIC(12,2) NOT NULL,
            category VARCHAR NOT NULL,
            description TEXT NOT NULL,
            reference_type VARCHAR,
            reference_id INTEGER,
            entry_date TIMESTAMP DEFAULT NOW(),
            created_by VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        );
    '''))
    session.commit()
    _verified_schemas.add(schema)

def get_tenant_by_api_key_sync(
    x_api_key: str,
    session: Session
) -> Tenant:
    # First find the api key
    statement = select(ApiKey).where(ApiKey.key == x_api_key, ApiKey.is_active == True)
    api_key = session.exec(statement).first()
    
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    # Get tenant
    tenant = session.get(Tenant, api_key.tenant_id)
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=401, detail="Tenant inactive or not found")
        
    # Ensure schema tables exist
    ensure_tenant_schema_tables(tenant.schema_name, session)
        
    # Set search_path for this connection context
    session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
    
    return tenant

def get_tenant_flexible(
    x_api_key: Optional[str] = Security(APIKeyHeader(name="x-api-key", auto_error=False)),
    token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> Tenant:
    """
    Dependency compuesta: acepta autenticación por API Key O JWT.
    - API Key: para integraciones sistema-a-sistema (ej: Tec360)
    - JWT: para usuarios humanos desde la UI
    """
    # Opción 1: API Key
    if x_api_key:
        return get_tenant_by_api_key_sync(x_api_key, session)
    
    # Opción 2: JWT Bearer Token
    if token:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            email = payload.get("sub")
            jti = payload.get("jti")
            tenant_id = payload.get("tenant_id")
            
            if not email or not jti or not tenant_id:
                raise HTTPException(status_code=401, detail="Token inválido")
            
            # Verificar blacklist
            if token_blacklist.is_blacklisted(jti, session):
                raise HTTPException(status_code=401, detail="Token revocado")
            
            tenant = session.get(Tenant, tenant_id)
            if not tenant or not tenant.is_active:
                raise HTTPException(status_code=401, detail="Tenant inactivo o no encontrado")
            
            ensure_tenant_schema_tables(tenant.schema_name, session)
            session.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
            return tenant
        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    raise HTTPException(
        status_code=401,
        detail="Se requiere autenticación: API Key (x-api-key) o Bearer Token"
    )

def get_tenant_by_api_key(
    tenant: Tenant = Depends(get_tenant_flexible)
) -> Tenant:
    return tenant
