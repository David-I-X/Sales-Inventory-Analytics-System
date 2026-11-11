"""
modules.py — API Router para Gestión y Activación de Módulos "A la Carta".
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.core.modules import MODULE_CATALOG, get_all_modules
from app.schemas.module import (
    ModuleStatusResponse,
    ModuleCatalogResponse,
    ModuleToggleRequest,
    ModuleToggleResponse
)

router = APIRouter()

@router.get("", response_model=ModuleCatalogResponse)
@router.get("/", response_model=ModuleCatalogResponse)
def list_tenant_modules(
    tenant: Tenant = Depends(get_tenant_by_api_key)
):
    """
    Lista todas las herramientas y módulos disponibles, indicando cuáles tiene activos
    la PyME y si tiene dependencias pendientes por activar.
    """
    enabled_set = set(tenant.enabled_modules or [])
    modules_list: List[ModuleStatusResponse] = []

    for mod in get_all_modules():
        is_on = mod.slug in enabled_set
        unmet = [dep for dep in mod.dependencies if dep not in enabled_set]
        
        modules_list.append(ModuleStatusResponse(
            slug=mod.slug,
            name=mod.name,
            description=mod.description,
            category=mod.category,
            icon=mod.icon,
            dependencies=mod.dependencies,
            is_enabled=is_on,
            unmet_dependencies=unmet
        ))

    return ModuleCatalogResponse(
        modules=modules_list,
        total_active=len(enabled_set),
        total_available=len(MODULE_CATALOG)
    )

@router.post("/{slug}/toggle", response_model=ModuleToggleResponse)
def toggle_module(
    slug: str,
    payload: ModuleToggleRequest = ModuleToggleRequest(),
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Activa o desactiva una herramienta a la carta para la PyME autenticada.
    Valida dependencias lógicas (ej: 'purchases' requiere 'inventory').
    """
    if slug not in MODULE_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El módulo '{slug}' no existe en el catálogo de herramientas."
        )

    mod_def = MODULE_CATALOG[slug]
    current_modules = list(tenant.enabled_modules or [])
    is_currently_on = slug in current_modules

    # Determinar el nuevo estado
    new_state = payload.enabled if payload.enabled is not None else (not is_currently_on)

    if new_state == is_currently_on:
        return ModuleToggleResponse(
            slug=slug,
            name=mod_def.name,
            is_enabled=is_currently_on,
            enabled_modules=current_modules,
            message=f"El módulo '{mod_def.name}' ya se encontraba {'activado' if is_currently_on else 'desactivado'}."
        )

    if new_state:
        # VALIDAR DEPENDENCIAS AL ACTIVAR
        unmet = [dep for dep in mod_def.dependencies if dep not in current_modules]
        if unmet:
            unmet_names = [MODULE_CATALOG[d].name for d in unmet if d in MODULE_CATALOG]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede activar '{mod_def.name}' porque requiere que primero active: {', '.join(unmet_names)}."
            )
        current_modules.append(slug)
        msg = f"Módulo '{mod_def.name}' activado exitosamente."
    else:
        # VALIDAR DEPENDENCIAS INVERSAS AL DESACTIVAR
        # Si apagan 'inventory', también deben apagarse 'purchases' y 'ml_inventory'
        dependents = [
            s for s, m in MODULE_CATALOG.items()
            if slug in m.dependencies and s in current_modules
        ]
        if dependents:
            dep_names = [MODULE_CATALOG[d].name for d in dependents]
            # Desactivar automáticamente los dependientes para mantener consistencia
            current_modules = [m for m in current_modules if m not in dependents and m != slug]
            msg = f"Módulo '{mod_def.name}' desactivado. También se desactivaron sus servicios dependientes: {', '.join(dep_names)}."
        else:
            current_modules = [m for m in current_modules if m != slug]
            msg = f"Módulo '{mod_def.name}' desactivado exitosamente."

    tenant.enabled_modules = current_modules
    session.add(tenant)
    session.flush()
    session.commit()

    return ModuleToggleResponse(
        slug=slug,
        name=mod_def.name,
        is_enabled=new_state,
        enabled_modules=current_modules,
        message=msg
    )
