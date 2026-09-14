from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.supplier import Supplier
from app.schemas.inventory import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
)

router = APIRouter()

@router.get("", response_model=List[SupplierResponse])
@router.get("/", response_model=List[SupplierResponse], include_in_schema=False)
def list_suppliers(
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(Supplier)
    if is_active is not None:
        statement = statement.where(Supplier.is_active == is_active)
    
    suppliers = session.exec(statement.order_by(Supplier.name)).all()
    if search:
        s = search.lower()
        suppliers = [sup for sup in suppliers if s in sup.name.lower() or (sup.nit and s in sup.nit.lower())]
    return suppliers

@router.post("", response_model=SupplierResponse)
@router.post("/", response_model=SupplierResponse, include_in_schema=False)
def create_supplier(
    supplier_in: SupplierCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    supplier = Supplier(
        name=supplier_in.name,
        nit=supplier_in.nit,
        phone=supplier_in.phone,
        email=supplier_in.email,
        address=supplier_in.address,
        contact_person=supplier_in.contact_person,
        notes=supplier_in.notes,
        is_active=True,
    )
    session.add(supplier)
    session.flush()
    session.commit()
    return supplier

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return supplier

@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    update_data = supplier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
        
    session.add(supplier)
    session.flush()
    session.commit()
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    supplier.is_active = False
    session.add(supplier)
    session.commit()
    return {"message": "Proveedor desactivado exitosamente", "id": supplier_id}
