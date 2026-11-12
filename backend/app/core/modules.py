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

def get_all_modules() -> List[ModuleDefinition]:
    return list(MODULE_CATALOG.values())

def get_default_modules() -> List[str]:
    return [slug for slug, mod in MODULE_CATALOG.items() if mod.default_enabled]
