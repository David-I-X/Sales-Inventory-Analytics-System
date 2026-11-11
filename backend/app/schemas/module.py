"""
module.py — Schemas Pydantic para el Centro de Herramientas y Módulos.
"""
from pydantic import BaseModel
from typing import List, Optional

class ModuleStatusResponse(BaseModel):
    slug: str
    name: str
    description: str
    category: str
    icon: str
    dependencies: List[str]
    is_enabled: bool
    unmet_dependencies: List[str] = []

class ModuleCatalogResponse(BaseModel):
    modules: List[ModuleStatusResponse]
    total_active: int
    total_available: int

class ModuleToggleRequest(BaseModel):
    enabled: Optional[bool] = None  # Si es None, hace toggle (invierte estado actual)

class ModuleToggleResponse(BaseModel):
    slug: str
    name: str
    is_enabled: bool
    enabled_modules: List[str]
    message: str
