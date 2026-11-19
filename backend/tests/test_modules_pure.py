"""
test_modules_pure.py — Tests Unitarios Puros para el Catálogo y Guard de Módulos.
No requiere conexión externa a base de datos.
"""
import pytest
from fastapi import HTTPException
from app.core.modules import (
    MODULE_CATALOG,
    DEFAULT_MODULE_SETTINGS,
    get_all_modules,
    get_default_modules,
    get_merged_module_settings,
)
from app.core.module_guard import require_module
from app.models.tenant import Tenant

def test_module_catalog_structure():
    """Verifica que el catálogo tenga los 8 módulos canónicos bien configurados."""
    modules = get_all_modules()
    assert len(modules) == 8
    
    slugs = {m.slug for m in modules}
    expected_slugs = {
        "dian_invoicing", "accounting", "inventory", 
        "purchases", "crm_whatsapp", "quotes", "ml_leads", "ml_inventory"
    }
    assert slugs == expected_slugs

def test_module_dependencies_consistency():
    """Verifica que las dependencias declaradas existan en el catálogo."""
    for mod in get_all_modules():
        for dep in mod.dependencies:
            assert dep in MODULE_CATALOG, f"Dependencia '{dep}' no existe para '{mod.slug}'"

def test_purchases_and_ml_inventory_require_inventory():
    """Verifica que compras e inventario predictivo dependan de 'inventory'."""
    assert "inventory" in MODULE_CATALOG["purchases"].dependencies
    assert "inventory" in MODULE_CATALOG["ml_inventory"].dependencies

def test_module_guard_allows_enabled_module():
    """El guard debe permitir la ejecución si el módulo está en enabled_modules."""
    tenant = Tenant(
        name="Test PyME",
        schema_name="test_schema",
        enabled_modules=["dian_invoicing", "accounting", "ml_leads"]
    )
    
    checker_dian = require_module("dian_invoicing")
    # No debe lanzar excepción
    result = checker_dian(tenant=tenant)
    assert result == tenant

def test_module_guard_raises_403_for_disabled_module():
    """El guard debe bloquear con 403 Forbidden si el módulo está apagado."""
    tenant = Tenant(
        name="Test PyME",
        schema_name="test_schema",
        enabled_modules=["dian_invoicing", "accounting", "ml_leads"]
    )
    
    checker_inventory = require_module("inventory")
    with pytest.raises(HTTPException) as exc_info:
        checker_inventory(tenant=tenant)
    
    assert exc_info.value.status_code == 403
    detail = exc_info.value.detail
    assert detail["error"] == "module_not_enabled"
    assert detail["module"] == "inventory"
    assert "Inventario y Stock Físico" in detail["message"]

def test_default_module_settings_and_factus_pay():
    """Verifica que todos los módulos tengan defaults y que dian_invoicing incluya Factus Pay."""
    for mod in get_all_modules():
        assert mod.slug in DEFAULT_MODULE_SETTINGS
    dian_defaults = DEFAULT_MODULE_SETTINGS["dian_invoicing"]
    assert dian_defaults["prefix"] == "SETT"
    assert dian_defaults["factus_pay_enabled"] is True
    assert dian_defaults["default_payment_method"] == "factus_pay"
    assert DEFAULT_MODULE_SETTINGS["quotes"]["default_validity_days"] == 15

def test_get_merged_module_settings_preserves_defaults():
    """Verifica fusión no destructiva entre defaults y ajustes guardados del tenant."""
    tenant_settings = {
        "dian_invoicing": {"prefix": "TEC", "factus_pay_merchant_id": "fpay_tec360"},
        "quotes": {"default_validity_days": 30},
    }
    merged_dian = get_merged_module_settings("dian_invoicing", tenant_settings)
    assert merged_dian["prefix"] == "TEC"
    assert merged_dian["factus_pay_merchant_id"] == "fpay_tec360"
    assert merged_dian["factus_pay_enabled"] is True
    # No debe mutar los defaults globales
    assert DEFAULT_MODULE_SETTINGS["dian_invoicing"]["prefix"] == "SETT"

    merged_quotes = get_merged_module_settings("quotes", tenant_settings)
    assert merged_quotes["default_validity_days"] == 30
    assert merged_quotes["default_tax_rate"] == 0.19
