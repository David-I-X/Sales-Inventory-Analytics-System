import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.core.config import settings
from app.api import tenants
from app.api import invoices
from app.api import crm
from app.api import contacts
from app.api import ml
from app.api import inventory
from app.api import suppliers
from app.api import purchases
from app.api import accounting
from app.api import auth
from app.core.database import engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SaaS Vertical B2B Backend API — Facturación DIAN, CRM WhatsApp, Motor ML, Inventario y Contabilidad",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tenants.router, prefix=f"{settings.API_V1_STR}/tenants", tags=["Tenants"])
app.include_router(contacts.router, prefix=f"{settings.API_V1_STR}/contacts", tags=["Contacts"])
app.include_router(invoices.router, prefix=f"{settings.API_V1_STR}/dian/invoices", tags=["DIAN Invoices"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["Inventory"])
app.include_router(suppliers.router, prefix=f"{settings.API_V1_STR}/suppliers", tags=["Suppliers"])
app.include_router(purchases.router, prefix=f"{settings.API_V1_STR}/purchases", tags=["Purchases"])
app.include_router(accounting.router, prefix=f"{settings.API_V1_STR}/accounting", tags=["Accounting"])
app.include_router(crm.router, prefix=f"{settings.API_V1_STR}/crm", tags=["CRM"])
app.include_router(ml.router, prefix=f"{settings.API_V1_STR}/ml", tags=["Machine Learning Engine"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])

@app.on_event("startup")
def startup_event():
    """
    Al arrancar el servidor:
    1. Crear tablas de autenticación si no existen.
    2. Cargar blacklist de tokens desde PostgreSQL a la caché en memoria.
    """
    from sqlmodel import Session
    from sqlalchemy import text
    from app.core.token_blacklist import token_blacklist
    
    with Session(engine) as session:
        # Asegurar columna webhook_secret en public.tenants
        session.execute(text("ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR;"))
        
        # Crear tablas de auth en public schema
        session.execute(text('''
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                email VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                full_name VARCHAR NOT NULL,
                role VARCHAR DEFAULT 'viewer',
                tenant_id INTEGER REFERENCES public.tenants(id),
                is_active BOOLEAN DEFAULT TRUE,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        '''))
        session.execute(text('''
            CREATE TABLE IF NOT EXISTS public.refresh_tokens (
                id SERIAL PRIMARY KEY,
                token_hash VARCHAR NOT NULL,
                user_id INTEGER REFERENCES public.users(id),
                family_id VARCHAR NOT NULL,
                is_revoked BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        '''))
        session.execute(text('''
            CREATE TABLE IF NOT EXISTS public.token_blacklist (
                id SERIAL PRIMARY KEY,
                jti VARCHAR UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                blacklisted_at TIMESTAMP DEFAULT NOW()
            )
        '''))
        # Crear índices
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)'))
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id)'))
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON public.refresh_tokens(token_hash)'))
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON public.refresh_tokens(family_id)'))
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON public.refresh_tokens(user_id)'))
        session.execute(text('CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON public.token_blacklist(jti)'))
        session.commit()
        
        # Cargar blacklist en caché
        token_blacklist.load_from_db(session)
        
        # Auto-migrar tablas en todos los schemas de tenants existentes
        tenants_res = session.execute(text("SELECT schema_name FROM public.tenants;")).fetchall()
        for row in tenants_res:
            schema = row[0]
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
                
                CREATE INDEX IF NOT EXISTS idx_{schema}_products_sku ON "{schema}".products(sku);
                CREATE INDEX IF NOT EXISTS idx_{schema}_suppliers_nit ON "{schema}".suppliers(nit);
                CREATE INDEX IF NOT EXISTS idx_{schema}_movements_product ON "{schema}".inventory_movements(product_id);
                CREATE INDEX IF NOT EXISTS idx_{schema}_purchases_number ON "{schema}".purchases(purchase_number);
                CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_type ON "{schema}".accounting_entries(entry_type);
                CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_category ON "{schema}".accounting_entries(category);
                CREATE INDEX IF NOT EXISTS idx_{schema}_accounting_date ON "{schema}".accounting_entries(entry_date);
            '''))
        session.commit()

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.VERSION}

@app.get("/dev-dashboard", tags=["Dev Dashboard"], response_class=HTMLResponse)
def get_dev_dashboard():
    """
    Interfaz Gráfica Pedagógica de Aprendizaje para visualizar y probar el Motor ML y Backend.
    (Movido a /dev-dashboard para no colisionar con el SPA)
    """
    dashboard_path = os.path.join(os.path.dirname(__file__), "static", "dashboard.html")
    with open(dashboard_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# ─── SPA Serving (Monorepo) ─────────────────────────────────────────────
# En producción, FastAPI sirve el build de React desde app/static/spa/.
# El frontend se construye con: cd frontend && npm run build
# Los archivos estáticos (JS, CSS, assets) se montan primero,
# y luego un catch-all devuelve index.html para client-side routing.
SPA_DIR = os.path.join(os.path.dirname(__file__), "static", "spa")

if os.path.isdir(SPA_DIR):
    from fastapi.staticfiles import StaticFiles
    
    # Montar assets estáticos del SPA (JS, CSS, images)
    assets_dir = os.path.join(SPA_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="spa-assets")
    
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    @app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
    def serve_spa(full_path: str = ""):
        """
        Sirve el index.html del SPA para la raíz y cualquier ruta del cliente
        (React Router) excepto /api, /health, /docs, /dev-dashboard.
        """
        # Si la petición era para la API pero no hizo match con ningún router, retornar 404 JSON
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")

        index_path = os.path.join(SPA_DIR, "index.html")
        if os.path.isfile(index_path):
            with open(index_path, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
        return HTMLResponse(content="<h1>SPA not built yet. Run: cd frontend && npm run build</h1>", status_code=503)
