"""
catalog.py — API Router para Catálogo Unificado de Servicios y Productos (Tarifario).
Accesible cuando la empresa tiene activo 'inventory', 'quotes' o 'dian_invoicing'.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional

from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.schemas.inventory import ProductCreate, ProductUpdate, ProductResponse
from app.api.inventory import (
    list_catalog_items_logic,
    create_catalog_item_logic,
    update_catalog_item_logic,
    delete_catalog_item_logic,
)

CATALOG_ALLOWED_MODULES = {"inventory", "quotes", "dian_invoicing"}


def require_catalog_access(tenant: Tenant = Depends(get_tenant_by_api_key)) -> Tenant:
    """Permite acceso al catálogo unificado si algún módulo comercial o de inventario está activo."""
    enabled = set(tenant.enabled_modules or [])
    if not enabled.intersection(CATALOG_ALLOWED_MODULES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "module_not_enabled",
                "module": "catalog",
                "module_name": "Catálogo / Tarifario",
                "message": "Active Inventario, Cotizaciones o Facturación DIAN para usar el Catálogo de Servicios y Productos.",
            },
        )
    return tenant


router = APIRouter(dependencies=[Depends(require_catalog_access)])


@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse], include_in_schema=False)
def list_catalog_items(
    item_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session),
):
    """Lista los servicios y productos activos del catálogo para selectores rápidos o tarifario."""
    return list_catalog_items_logic(
        session=session,
        item_type=item_type,
        category=category,
        low_stock_only=False,
        is_active=True,
        search=search,
    )


@router.post("", response_model=ProductResponse)
@router.post("/", response_model=ProductResponse, include_in_schema=False)
def create_catalog_item(
    item_in: ProductCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session),
):
    """Crea un servicio o producto en el catálogo con autogeneración opcional de SKU."""
    return create_catalog_item_logic(product_in=item_in, session=session)


@router.patch("/{item_id}", response_model=ProductResponse)
def update_catalog_item(
    item_id: int,
    item_update: ProductUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session),
):
    """Actualiza precio, nombre, categoría o tipo de un servicio/producto."""
    return update_catalog_item_logic(product_id=item_id, product_update=item_update, session=session)


@router.delete("/{item_id}")
def delete_catalog_item(
    item_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session),
):
    """Desactiva un servicio o producto del catálogo."""
    return delete_catalog_item_logic(product_id=item_id, session=session)
