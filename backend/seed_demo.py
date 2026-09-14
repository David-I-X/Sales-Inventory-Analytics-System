"""
Script para inicializar datos de prueba en la base de datos:
- Tenant demo ('empresa_demo')
- Usuario Administrador (admin@demo.com / admin123)
- Contactos de prueba
- Facturas DIAN de prueba
- Alertas y modelos de ML ejecutados
"""
from sqlmodel import Session, select, SQLModel
from sqlalchemy import text
from app.core.database import engine
from app.models.tenant import Tenant
from app.models.user import User
from app.models.contact import Contact
from app.models.invoice import Invoice
from app.core.auth import hash_password
from app.services.ml_service import ml_orchestrator
import secrets
from datetime import datetime

def seed():
    # Crear todas las tablas registradas en SQLModel
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Asegurar tablas base en public
        session.execute(text("ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR;"))
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
        session.commit()

        # 1. Crear o buscar Tenant Demo
        schema = "empresa_demo"
        tenant = session.exec(select(Tenant).where(Tenant.schema_name == schema)).first()
        if not tenant:
            tenant = Tenant(
                name="Distribuidora Los Andes S.A.S.",
                schema_name=schema,
                plan="growth",
                webhook_secret=secrets.token_urlsafe(32)
            )
            session.add(tenant)
            session.commit()
            session.refresh(tenant)

        # Ensure schema tables exist
        from app.core.tenant import ensure_tenant_schema_tables
        ensure_tenant_schema_tables(schema, session)
        session.execute(text(f'SET search_path TO "{schema}", public'))

        # 2. Crear Usuario Admin Demo
        admin_email = "admin@demo.com"
        admin = session.exec(select(User).where(User.email == admin_email)).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=hash_password("admin123"),
                full_name="Carlos Mendoza",
                role="admin",
                tenant_id=tenant.id
            )
            session.add(admin)
            session.commit()
            print(f"[OK] Usuario Admin creado: {admin_email} / admin123")

        # 3. Crear Contactos de Prueba en el schema del tenant
        session.execute(text(f'SET search_path TO "{schema}", public'))
        contact_count = len(session.exec(select(Contact)).all())
        if contact_count == 0:
            contacts_data = [
                Contact(name="Ferretería El Tornillo", phone="+573001112233", email="contacto@eltornillo.com", funnel_stage="customer", lead_score=85.0),
                Contact(name="Restaurante La Casona", phone="+573104445566", email="pedidos@lacasona.co", funnel_stage="lead", lead_score=72.5),
                Contact(name="Construcciones Modernas S.A.", phone="+573157778899", email="compras@construcciones.com", funnel_stage="customer", lead_score=94.0),
                Contact(name="Boutique Café Colonial", phone="+573209990011", email="gerencia@cafecolonial.co", funnel_stage="new", lead_score=45.0),
                Contact(name="Supermercado Central", phone="+573012223344", email="abastecimiento@supercentral.com", funnel_stage="customer", lead_score=88.5),
            ]
            for c in contacts_data:
                session.add(c)
            session.commit()
            print(f"[OK] 5 contactos de prueba creados.")

        # 4. Crear Productos en Inventario
        from app.models.product import Product
        from app.models.supplier import Supplier
        from app.models.purchase import Purchase
        from app.models.inventory_movement import InventoryMovement
        from app.models.accounting_entry import AccountingEntry
        from decimal import Decimal

        product_count = len(session.exec(select(Product)).all())
        if product_count == 0:
            products_data = [
                Product(sku="GPS-4G-PRO", name="GPS Tracker 4G Vehicular", description="Localizador GPS satelital con corte de corriente", category="Dispositivos", unit_measure="unidad", sale_price=Decimal("350000"), cost_price=Decimal("180000"), current_stock=18, min_stock=5),
                Product(sku="CAM-WIFI-HD", name="Cámara de Seguridad WiFi 360°", description="Cámara robótica 1080p con visión nocturna", category="Cámaras", unit_measure="unidad", sale_price=Decimal("140000"), cost_price=Decimal("75000"), current_stock=3, min_stock=8), # Low stock!
                Product(sku="KIT-ALARM-01", name="Kit Central Alarma Inalámbrica", description="Panel con sensor de movimiento y sirena 110dB", category="Alarmas", unit_measure="kit", sale_price=Decimal("520000"), cost_price=Decimal("290000"), current_stock=12, min_stock=4),
                Product(sku="CAB-UTP-CAT6", name="Bobina Cable UTP Cat6 305m", description="Cable 100% cobre para redes y CCTV", category="Cableado", unit_measure="bobina", sale_price=Decimal("280000"), cost_price=Decimal("160000"), current_stock=2, min_stock=5), # Low stock!
                Product(sku="SEN-MAG-01", name="Sensor Magnético Puerta/Ventana", description="Contacto magnético inalámbrico 433MHz", category="Sensores", unit_measure="unidad", sale_price=Decimal("35000"), cost_price=Decimal("18000"), current_stock=45, min_stock=10),
            ]
            for p in products_data:
                session.add(p)
            session.commit()
            print(f"[OK] 5 productos de prueba creados en Inventario.")

        # 5. Crear Proveedores
        supplier_count = len(session.exec(select(Supplier)).all())
        if supplier_count == 0:
            suppliers_data = [
                Supplier(name="Tech Distribuciones S.A.S.", nit="900888777-1", phone="+573105554433", email="ventas@techdist.com", contact_person="Álvaro Restrepo", address="Cra 43A # 1-50, Medellín"),
                Supplier(name="Seguridad Electrónica del Valle", nit="901222333-4", phone="+573187778899", email="pedidos@seguridadvalle.co", contact_person="Diana Morales", address="Av. 6N # 22-10, Cali"),
                Supplier(name="Global Telecom Import", nit="800111222-9", phone="+573004441122", email="contacto@globaltelecom.com", contact_person="Jorge Botero", address="Calle 100 # 15-20, Bogotá"),
            ]
            for s in suppliers_data:
                session.add(s)
            session.commit()
            print(f"[OK] 3 proveedores de prueba creados.")

        # 6. Crear Facturas de Prueba + Ingresos automáticos en Contabilidad
        invoice_count = len(session.exec(select(Invoice)).all())
        if invoice_count == 0:
            contacts = session.exec(select(Contact)).all()
            for idx, c in enumerate(contacts[:3], 1):
                subt = Decimal(str(150000 * idx))
                tx = subt * Decimal("0.19")
                tot = subt + tx
                inv = Invoice(
                    tenant_id=tenant.id,
                    contact_id=c.id,
                    invoice_number=f"SETT-000{idx}",
                    cufe=f"dian-cufe-{secrets.token_hex(16)}",
                    subtotal=subt,
                    tax=tx,
                    total=tot,
                    dian_status="accepted",
                    line_items=[{"sku": "GPS-4G-PRO", "description": "GPS Tracker 4G Vehicular", "quantity": idx, "unit_price": 150000.0}],
                    issued_at=datetime.utcnow()
                )
                session.add(inv)
                session.flush()

                # Automatic accounting income
                acc = AccountingEntry(
                    entry_type="income",
                    amount=tot,
                    category="ventas",
                    description=f"Factura {inv.invoice_number} - {c.name}",
                    reference_type="invoice",
                    reference_id=inv.id,
                    entry_date=datetime.utcnow()
                )
                session.add(acc)
            session.commit()
            print(f"[OK] Facturas de prueba y registros contables de venta creados.")

        # 7. Crear Gastos de Prueba en Contabilidad
        session.execute(text(f'SET search_path TO "{schema}", public'))
        acc_count = len(session.exec(select(AccountingEntry)).all())
        if acc_count <= 3:
            expenses_data = [
                AccountingEntry(entry_type="expense", amount=Decimal("1200000"), category="arriendo", description="Arriendo oficina y bodega", entry_date=datetime.utcnow()),
                AccountingEntry(entry_type="expense", amount=Decimal("350000"), category="servicios", description="Fibra óptica 300MB y energía", entry_date=datetime.utcnow()),
                AccountingEntry(entry_type="expense", amount=Decimal("1800000"), category="nomina", description="Salario técnico instalador", entry_date=datetime.utcnow()),
                AccountingEntry(entry_type="expense", amount=Decimal("120000"), category="transporte", description="Combustible ruta técnica", entry_date=datetime.utcnow()),
            ]
            for exp in expenses_data:
                session.add(exp)
            session.commit()
            print(f"[OK] Gastos operativos de prueba creados.")

        # 8. Ejecutar modelos de ML para generar alertas y predicciones
        try:
            res = ml_orchestrator.run_all_tenants_batch()
            print(f"[OK] Batch de ML ejecutado: {res['total_alerts_generated']} alertas generadas.")
        except Exception as e:
            print(f"[WARN] Error ejecutando batch ML: {e}")

if __name__ == "__main__":
    seed()
