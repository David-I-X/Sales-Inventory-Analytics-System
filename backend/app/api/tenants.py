from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import text
from app.core.database import get_session, engine
from app.models.tenant import Tenant, ApiKey
from app.schemas.tenant import TenantCreate, TenantResponse, ApiKeyResponse, WebhookUpdate
from app.core.tenant import get_tenant_by_api_key
from sqlmodel import SQLModel
import secrets

router = APIRouter()

@router.post("/register", response_model=TenantResponse)
def register_tenant(tenant_in: TenantCreate, session: Session = Depends(get_session)):
    """
    Registers a new tenant and creates their isolated schema with all business tables.
    """
    # Validate schema_name is alphanumeric (prevent SQL injection)
    if not tenant_in.schema_name.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Schema name must be alphanumeric (underscores allowed)")
    
    # Check if schema exists
    statement = select(Tenant).where(Tenant.schema_name == tenant_in.schema_name)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Schema name already in use")
    
    # Create tenant in public schema
    webhook_secret = secrets.token_urlsafe(32)
    tenant = Tenant(name=tenant_in.name, schema_name=tenant_in.schema_name, plan=tenant_in.plan, webhook_secret=webhook_secret)
    session.add(tenant)
    session.flush()
    session.commit()
    
    # Create PostgreSQL schema for tenant isolation
    session.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{tenant.schema_name}"'))
    session.commit()
    
    # Create tenant-specific tables using raw DDL
    # This is more reliable than SQLModel.metadata.create_all with search_path tricks
    schema = tenant.schema_name
    session.execute(text(f'''
        CREATE TABLE IF NOT EXISTS "{schema}".contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            phone VARCHAR UNIQUE,
            email VARCHAR,
            whatsapp_id VARCHAR,
            funnel_stage VARCHAR DEFAULT 'new',
            lead_score FLOAT DEFAULT 0.0,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    '''))
    session.execute(text(f'''
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
        )
    '''))
    session.execute(text(f'''
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
        )
    '''))
    session.execute(text(f'''
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
        )
    '''))
    session.execute(text(f'''
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
        )
    '''))
    session.execute(text(f'''
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
        )
    '''))
    session.execute(text(f'''
        CREATE TABLE IF NOT EXISTS "{schema}".invoices (
            id SERIAL PRIMARY KEY,
            contact_id INTEGER REFERENCES "{schema}".contacts(id),
            invoice_number VARCHAR NOT NULL,
            cufe VARCHAR,
            dian_status VARCHAR DEFAULT 'draft',
            subtotal NUMERIC(12,2) DEFAULT 0,
            tax NUMERIC(12,2) DEFAULT 0,
            total NUMERIC(12,2) DEFAULT 0,
            line_items JSONB DEFAULT '[]',
            dian_response JSONB,
            issued_at TIMESTAMP DEFAULT NOW(),
            dian_responded_at TIMESTAMP
        )
    '''))
    session.execute(text(f'''
        CREATE TABLE IF NOT EXISTS "{schema}".transactions (
            id SERIAL PRIMARY KEY,
            invoice_id INTEGER REFERENCES "{schema}".invoices(id),
            contact_id INTEGER REFERENCES "{schema}".contacts(id),
            type VARCHAR DEFAULT 'sale',
            amount NUMERIC(12,2) DEFAULT 0,
            payment_method VARCHAR DEFAULT 'cash',
            date TIMESTAMP DEFAULT NOW()
        )
    '''))
    session.execute(text(f'''
        CREATE TABLE IF NOT EXISTS "{schema}".ml_alerts (
            id SERIAL PRIMARY KEY,
            alert_type VARCHAR NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{{}}',
            is_read BOOLEAN DEFAULT FALSE,
            generated_at TIMESTAMP DEFAULT NOW()
        )
    '''))
    session.execute(text(f'''
        CREATE TABLE IF NOT EXISTS "{schema}".ml_model_registry (
            id SERIAL PRIMARY KEY,
            model_name VARCHAR NOT NULL,
            version VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            metrics JSONB DEFAULT '{{}}',
            status VARCHAR DEFAULT 'active',
            trained_at TIMESTAMP DEFAULT NOW()
        )
    '''))
    
    # Create indexes
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_contacts_phone ON "{schema}".contacts(phone)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_invoices_number ON "{schema}".invoices(invoice_number)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_invoices_cufe ON "{schema}".invoices(cufe)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_products_sku ON "{schema}".products(sku)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_suppliers_nit ON "{schema}".suppliers(nit)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_movements_product ON "{schema}".inventory_movements(product_id)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_purchases_number ON "{schema}".purchases(purchase_number)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_type ON "{schema}".accounting_entries(entry_type)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_category ON "{schema}".accounting_entries(category)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_date ON "{schema}".accounting_entries(entry_date)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_ml_alerts_type ON "{schema}".ml_alerts(alert_type)'))
    session.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{schema}_ml_alerts_is_read ON "{schema}".ml_alerts(is_read)'))
    
    session.commit()
    
    return tenant

@router.post("/{tenant_id}/api-keys", response_model=ApiKeyResponse)
def generate_api_key(tenant_id: int, label: str = "default", session: Session = Depends(get_session)):
    """
    Generates a new API Key for a tenant.
    """
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    # Generate key
    raw_key = f"sk_live_{secrets.token_urlsafe(24)}"
    
    api_key = ApiKey(tenant_id=tenant.id, key=raw_key, label=label)
    session.add(api_key)
    session.commit()
    
    return ApiKeyResponse(key=raw_key, label=label)

@router.get("/me", response_model=TenantResponse)
def get_current_tenant(tenant: Tenant = Depends(get_tenant_by_api_key)):
    """
    Gets information about the current tenant, authenticated by API Key.
    """
    return tenant

@router.patch("/me/webhook", response_model=TenantResponse)
def update_webhook(webhook_in: WebhookUpdate, tenant: Tenant = Depends(get_tenant_by_api_key), session: Session = Depends(get_session)):
    """
    Updates the webhook URL for the current tenant.
    """
    tenant.webhook_url = webhook_in.webhook_url
    session.add(tenant)
    session.flush()
    session.commit()
    return tenant
