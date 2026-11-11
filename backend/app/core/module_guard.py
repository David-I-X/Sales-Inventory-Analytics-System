"""
module_guard.py — Dependencia de FastAPI para Protección de Endpoints por Módulo.

Verifica que el tenant autenticado tenga habilitado el módulo requerido para acceder a la ruta.
Si el módulo está apagado, retorna HTTP 403 Forbidden indicando que la PyME debe activarlo.
"""
from fastapi import HTTPException, Depends, status
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.core.modules import MODULE_CATALOG

def require_module(module_slug: str):
    """
    FastAPI Dependency Factory para proteger rutas de módulos específicos.
    Ejemplo:
        router = APIRouter(dependencies=[Depends(require_module("inventory"))])
    """
    def checker(tenant: Tenant = Depends(get_tenant_by_api_key)) -> Tenant:
        enabled = tenant.enabled_modules or []
        if module_slug not in enabled:
            module_info = MODULE_CATALOG.get(module_slug)
            module_name = module_info.name if module_info else module_slug
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "module_not_enabled",
                    "module": module_slug,
                    "module_name": module_name,
                    "message": f"El servicio '{module_name}' no está activado para su empresa. Puede activarlo en cualquier momento desde el Centro de Herramientas."
                }
            )
        return tenant
    return checker
