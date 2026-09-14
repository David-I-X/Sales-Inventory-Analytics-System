from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from datetime import datetime

router = APIRouter()

@router.post("", response_model=ContactResponse, include_in_schema=False)
@router.post("/", response_model=ContactResponse)
def create_contact(
    contact_in: ContactCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Creates a new contact within the tenant's isolated schema.
    """
    # Check for duplicate phone
    if contact_in.phone:
        statement = select(Contact).where(Contact.phone == contact_in.phone)
        existing = session.exec(statement).first()
        if existing:
            raise HTTPException(status_code=400, detail="A contact with this phone already exists")
    
    contact = Contact(
        name=contact_in.name,
        phone=contact_in.phone,
        email=contact_in.email
    )
    session.add(contact)
    session.flush()
    session.commit()
    return contact

@router.get("", response_model=List[ContactResponse], include_in_schema=False)
@router.get("/", response_model=List[ContactResponse])
def list_contacts(
    skip: int = 0, limit: int = 100,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Lists all contacts for the authenticated tenant.
    """
    statement = select(Contact).offset(skip).limit(limit)
    contacts = session.exec(statement).all()
    return contacts

@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Gets a specific contact by ID.
    """
    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    contact_in: ContactUpdate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Updates a contact's information.
    """
    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contact, key, value)
    
    contact.updated_at = datetime.utcnow()
    session.add(contact)
    session.flush()
    session.commit()
    return contact

@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Deletes a contact.
    """
    contact = session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    session.delete(contact)
    session.commit()
    return {"ok": True, "deleted_id": contact_id}
