"""
modules.py — Catálogo Canónico de Módulos y Herramientas "A la Carta".

Define todos los módulos independientes que cualquier PyME puede activar o desactivar
autónomamente, sus metadatos, categorías y dependencias lógicas.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ModuleDefinition(BaseModel):
    slug: str
    name: str
    description: str
    category: str
    icon: str
    dependencies: List[str] = []
    default_enabled: bool = True

MODULE_CATALOG: Dict[str, ModuleDefinition] = {
    "dian_invoicing": ModuleDefinition(
        slug="dian_invoicing",
        name="Facturación Electrónica DIAN",
        description="Emisión fiscal de facturas electrónicas vía Factus API V2, generación de CUFE, código QR y descarga de PDF oficial.",
        category="Facturación & Fiscal",
        icon="IconFileInvoice",
        dependencies=[],
        default_enabled=True
    ),
    "accounting": ModuleDefinition(
        slug="accounting",
        name="Contabilidad y Caja",
        description="Control de flujo de caja, asientos contables de ingresos y gastos operativos, balance mensual y estado financiero.",
        category="Finanzas & Contabilidad",
        icon="IconReceipt2",
        dependencies=[],
        default_enabled=True
    ),
    "inventory": ModuleDefinition(
        slug="inventory",
        name="Inventario y Stock Físico",
        description="Catálogo de productos físicos, control de existencias en bodega, alertas de stock mínimo y kardex de movimientos.",
        category="Operaciones & Bodega",
        icon="IconPackages",
        dependencies=[],
        default_enabled=False
    ),
    "purchases": ModuleDefinition(
        slug="purchases",
        name="Compras a Proveedores",
        description="Gestión de compras de mercancía a proveedores, órdenes de entrada a almacén y cuentas por pagar.",
        category="Operaciones & Bodega",
        icon="IconShoppingCart",
        dependencies=["inventory"],
        default_enabled=False
    ),
    "crm_whatsapp": ModuleDefinition(
        slug="crm_whatsapp",
        name="CRM WhatsApp Conversacional",
        description="Bandeja de entrada multicanal de WhatsApp, clasificación inteligente de intenciones con NLP y embudo de ventas.",
        category="Ventas & Clientes",
        icon="IconBrandWhatsapp",
        dependencies=[],
        default_enabled=False
    ),
    "quotes": ModuleDefinition(
        slug="quotes",
        name="Cotizaciones y Presupuestos",
        description="Emisión de propuestas comerciales y presupuestos de servicios, actualización continua de ítems y conversión directa a Factura DIAN.",
        category="Ventas & Clientes",
        icon="IconFileText",
        dependencies=[],
        default_enabled=True
    ),
    "ml_leads": ModuleDefinition(
        slug="ml_leads",
        name="IA: Scoring de Oportunidades",
        description="Algoritmo predictivo de propensión de compra para calificar contactos calientes y priorizar el cierre de ventas.",
        category="Inteligencia Artificial",
        icon="IconFlame",
        dependencies=[],
        default_enabled=True
    ),
    "ml_inventory": ModuleDefinition(
        slug="ml_inventory",
        name="IA: Pronóstico de Demanda de Stock",
        description="Proyección matemática de demanda a 14 días para anticipar quiebres de stock y sugerir cantidades exactas de reabastecimiento.",
        category="Inteligencia Artificial",
        icon="IconTrendingUp",
        dependencies=["inventory"],
        default_enabled=False
    )
}

DEFAULT_MODULE_SETTINGS: Dict[str, Dict[str, Any]] = {
    "dian_invoicing": {
        "prefix": "SETT",
        "resolution_number": "18760000001",
        "numbering_range_from": 1,
        "numbering_range_to": 5000,
        "environment": "sandbox",
        "factus_pay_enabled": True,
        "factus_pay_merchant_id": "",
        "default_payment_method": "factus_pay",
    },
    "quotes": {
        "default_validity_days": 15,
        "default_tax_rate": 0.19,
        "default_terms": "Validez de la oferta: 15 días. Pago: 50% anticipo, 50% entrega.",
        "company_nit": "",
        "company_phone": "",
        "bank_account_info": "Pagos vía Factus Pay / Transferencia Bancaria",
    },
    "accounting": {
        "auto_accounting_invoices": True,
        "fiscal_regime": "responsable_iva",
        "retefuente_services_pct": 4.0,
        "retefuente_products_pct": 2.5,
        "reteica_pct": 0.966,
    },
    "inventory": {
        "default_min_stock": 5,
        "default_unit_measure": "unidad",
        "allow_negative_stock": False,
        "enable_services_catalog": True,
    },
    "purchases": {
        "default_tax_rate": 0.19,
        "auto_update_cost_price": True,
        "auto_accounting_purchases": True,
    },
    "crm_whatsapp": {
        "whatsapp_phone_number_id": "",
        "whatsapp_business_account_id": "",
        "auto_reply_enabled": True,
        "welcome_message": "Hola, gracias por comunicarte con nosotros. ¿En qué podemos ayudarte?",
    },
    "ml_leads": {
        "hot_lead_threshold": 75,
        "auto_score_on_message": True,
    },
    "ml_inventory": {
        "forecast_horizon_days": 14,
        "safety_stock_multiplier": 1.2,
    },
}

def get_all_modules() -> List[ModuleDefinition]:
    return list(MODULE_CATALOG.values())

def get_default_modules() -> List[str]:
    return [slug for slug, mod in MODULE_CATALOG.items() if mod.default_enabled]

def get_merged_module_settings(
    slug: str,
    tenant_settings: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Combina los valores por defecto del módulo con los ajustes guardados del tenant."""
    defaults = dict(DEFAULT_MODULE_SETTINGS.get(slug, {}))
    stored = (tenant_settings or {}).get(slug, {})
    if isinstance(stored, dict):
        defaults.update(stored)
    return defaults
