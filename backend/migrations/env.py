import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.resolve()))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context
from sqlmodel import SQLModel

# Importar la configuración y modelos
from app.core.config import settings
from app.models import tenant, contact, invoice, product, transaction, ml_alert

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# Sobrescribir URL con la de config.py
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Modo offline: genera scripts SQL estáticos."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Modo online (Punto 2 - Gestión de Migraciones Multi-Tenant con Alembic):
    1. Ejecuta migraciones sobre el schema 'public' (tenants, api_keys).
    2. Consulta la tabla public.tenants para obtener todos los schemas activos.
    3. Aplica secuencialmente las migraciones sobre cada schema de tenant registrado.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # 1. Migración sobre el schema public
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()

        # 2. Migración sobre todos los schemas de tenants activos
        try:
            result = connection.execute(text("SELECT schema_name FROM public.tenants WHERE is_active = TRUE"))
            tenant_schemas = [row[0] for row in result.fetchall()]
        except Exception as e:
            print(f"[Alembic Multi-Tenant] No se pudieron consultar los tenants (¿primera migración?): {e}")
            tenant_schemas = []

        for schema_name in tenant_schemas:
            print(f"[Alembic Multi-Tenant] Aplicando migraciones DDL sobre schema: '{schema_name}'")
            connection.execute(text(f'SET search_path TO "{schema_name}", public'))
            
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                include_schemas=True,
            )

            with context.begin_transaction():
                context.run_migrations()

        # Reset final
        connection.execute(text("RESET search_path"))


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
