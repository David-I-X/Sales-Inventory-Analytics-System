from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.contact import Contact
from app.services.nlp_service import nlp_service
from app.core.config import settings
from pydantic import BaseModel
import httpx
from datetime import datetime

router = APIRouter()

class WhatsAppMessage(BaseModel):
    contact_id: int
    text: str

# In production, this token should be stored in the tenant table or config to allow WhatsApp Cloud API validation
META_VERIFY_TOKEN = "my_secure_verify_token_123"

@router.get("/whatsapp/webhook")
async def verify_webhook(request: Request):
    """
    Endpoint para que Meta (WhatsApp) verifique el Webhook.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode == "subscribe" and token == META_VERIFY_TOKEN:
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="Invalid verification token")

async def process_whatsapp_message(message_data: dict, phone_number: str, text: str, tenant_api_key: str):
    """
    Procesa un mensaje en background, hace el NLP, y lo guarda en base de datos.
    """
    from app.core.database import engine
    from app.core.tenant import get_tenant_by_api_key_sync
    
    with Session(engine) as session:
        try:
            tenant = get_tenant_by_api_key_sync(tenant_api_key, session)
            
            # Analyze intention
            intent, confidence = nlp_service.classify_intent(text)
            
            # Find or create contact
            statement = select(Contact).where(Contact.phone == phone_number)
            contact = session.exec(statement).first()
            
            if not contact:
                contact = Contact(
                    name="Unknown (WhatsApp)", 
                    phone=phone_number,
                    funnel_stage="new"
                )
                session.add(contact)
                session.commit()
                session.refresh(contact)
                
            # Update funnel stage based on intent
            if intent == "sales_inquiry":
                contact.funnel_stage = "lead"
                contact.lead_score += 10
            elif intent == "invoice_request":
                contact.funnel_stage = "customer"
            
            contact.updated_at = datetime.utcnow()
            session.add(contact)
            session.commit()

            # Send Webhook back to origin system (Tec360) so they can answer or create a ticket
            if tenant.webhook_url:
                payload = {
                    "event": "whatsapp.message_received",
                    "contact_id": contact.id,
                    "phone": contact.phone,
                    "text": text,
                    "intent": intent,
                    "confidence": confidence
                }
                async with httpx.AsyncClient() as client:
                    await client.post(tenant.webhook_url, json=payload, timeout=5.0)
        except Exception as e:
            print(f"Background task error: {e}")


@router.post("/whatsapp/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks, tenant: Tenant = Depends(get_tenant_by_api_key)):
    """
    Recibe los mensajes de WhatsApp entrantes desde la Meta Graph API.
    Siempre responde 200 rápido para que Meta no reintente el envío.
    """
    try:
        body = await request.body()
        if not body:
            return {"status": "ok"}
        data = await request.json()
    except Exception:
        return {"status": "ok"}

    try:
        entry = data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if messages:
            msg = messages[0]
            phone_number = msg.get("from")

            if "text" in msg:
                text = msg["text"]["body"]
                background_tasks.add_task(
                    process_whatsapp_message,
                    message_data=data,
                    phone_number=phone_number,
                    text=text,
                    # HACK: Pass the active API key to the background task to re-authenticate
                    # since Dependency injection doesn't carry over context automatically
                    tenant_api_key=request.headers.get("x-api-key")
                )
    except Exception as e:
        print(f"Error parsing Meta payload: {e}")

    return {"status": "ok"}

@router.post("/whatsapp/send")
async def send_whatsapp(
    msg_in: WhatsAppMessage,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Envía un mensaje saliente de WhatsApp usando la Cloud API (Simulado).
    """
    contact = session.get(Contact, msg_in.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    # En producción: POST a https://graph.facebook.com/vX.X/{phone_number_id}/messages
    # async with httpx.AsyncClient() as client:
    #     await client.post(...)
    
    return {"status": "sent", "to": contact.phone, "text": msg_in.text}
