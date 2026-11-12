"""
test_quotes_pure.py — Pruebas unitarias puras en memoria para el módulo de Cotizaciones.
Verifica cálculos, validaciones, reglas de negocio de actualización y guard modular.
"""
import pytest
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException
from app.core.modules import MODULE_CATALOG, get_all_modules, get_default_modules
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteItem, QuoteResponse
from app.models.quote import Quote
from app.models.tenant import Tenant
from app.core.module_guard import require_module
from app.api.quotes import _calculate_totals

def test_quotes_module_catalog_registration():
    """Valida que 'quotes' esté debidamente registrado en el catálogo canónico."""
    assert "quotes" in MODULE_CATALOG
    quote_mod = MODULE_CATALOG["quotes"]
    assert quote_mod.slug == "quotes"
    assert quote_mod.name == "Cotizaciones y Presupuestos"
    assert quote_mod.category == "Ventas & Clientes"
    assert quote_mod.icon == "IconFileText"
    assert quote_mod.default_enabled is True
    assert "quotes" in get_default_modules()

def test_calculate_totals_services_and_products():
    """Valida cálculo de totales con servicios, cantidades decimales y descuentos."""
    items = [
        QuoteItem(
            description="Instalación y Configuración 4 Cámaras IP Tec360",
            quantity=Decimal("1.00"),
            unit_price=Decimal("450000.00"),
            discount=Decimal("50000.00"),
            item_type="service"
        ),
        QuoteItem(
            description="Póliza Mantenimiento Mensual",
            quantity=Decimal("2.00"),
            unit_price=Decimal("120000.00"),
            discount=Decimal("0.00"),
            item_type="service"
        )
    ]
    # Subtotal esperado: (450000 - 50000) + (2 * 120000) = 400000 + 240000 = 640000
    tax_rate = Decimal("0.19")
    discount = Decimal("40000.00") # Descuento global
    
    subtotal, tax, total, serialized = _calculate_totals(items, tax_rate, discount)
    
    assert subtotal == Decimal("640000.00")
    # Base gravable: 640000 - 40000 = 600000
    # Tax: 600000 * 0.19 = 114000
    assert tax == Decimal("114000.00")
    # Total: 600000 + 114000 = 714000
    assert total == Decimal("714000.00")
    assert len(serialized) == 2
    assert serialized[0]["subtotal"] == 400000.0

def test_quote_create_and_update_schemas():
    """Verifica esquemas Pydantic para creación y actualización."""
    create_payload = QuoteCreate(
        title="Cotización Inicial Tec360",
        items=[
            QuoteItem(
                description="Servicio de Monitoreo",
                quantity=Decimal("1"),
                unit_price=Decimal("200000")
            )
        ],
        tax_rate=Decimal("0.19")
    )
    assert create_payload.title == "Cotización Inicial Tec360"
    assert len(create_payload.items) == 1

    # Actualización con nuevos ítems y notas
    update_payload = QuoteUpdate(
        title="Cotización Negociada Tec360 - Ajuste",
        items=[
            QuoteItem(
                description="Servicio de Monitoreo + Grabación en Nube",
                quantity=Decimal("1"),
                unit_price=Decimal("250000")
            )
        ],
        notes="Cliente solicitó incluir backup de 30 días"
    )
    assert update_payload.title == "Cotización Negociada Tec360 - Ajuste"
    assert update_payload.notes == "Cliente solicitó incluir backup de 30 días"

def test_quote_guard_raises_403_when_disabled():
    """Valida que el guard rechace con 403 si el tenant no tiene 'quotes' activo."""
    guard = require_module("quotes")
    tenant_without_quotes = Tenant(
        id=1,
        name="Empresa Sin Cotizador",
        schema_name="tenant_1",
        enabled_modules=["dian_invoicing"]
    )
    with pytest.raises(HTTPException) as exc_info:
        guard(tenant=tenant_without_quotes)
    
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["error"] == "module_not_enabled"
    assert exc_info.value.detail["module"] == "quotes"

def test_quote_guard_allows_when_enabled():
    """Valida que el guard permita el paso cuando el módulo está activo."""
    guard = require_module("quotes")
    tenant_with_quotes = Tenant(
        id=2,
        name="Empresa Con Cotizador",
        schema_name="tenant_2",
        enabled_modules=["quotes", "dian_invoicing"]
    )
    result = guard(tenant=tenant_with_quotes)
    assert result == tenant_with_quotes
