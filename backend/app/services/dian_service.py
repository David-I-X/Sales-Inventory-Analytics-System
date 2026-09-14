import httpx
import uuid
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class DianService:
    def __init__(self):
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    async def _get_auth_token(self) -> str:
        """
        Obtiene y cachea el token OAuth 2.0 de Factus API V2.
        Reutiliza el token en memoria hasta 2 minutos antes de su vencimiento.
        """
        now = time.time()
        if self._access_token and now < (self._token_expires_at - 120):
            return self._access_token

        auth_url = f"{settings.FACTUS_API_URL.rstrip('/')}/oauth/token"
        payload = {
            "grant_type": "password",
            "client_id": settings.FACTUS_CLIENT_ID,
            "client_secret": settings.FACTUS_CLIENT_SECRET,
            "username": settings.FACTUS_USERNAME,
            "password": settings.FACTUS_PASSWORD
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(auth_url, data=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(f"Error autenticando con Factus V2: {resp.status_code} - {resp.text}")
                raise RuntimeError(f"Error de autenticación Factus: {resp.status_code}")

            data = resp.json()
            self._access_token = data.get("access_token")
            expires_in = data.get("expires_in", 3600)
            self._token_expires_at = now + expires_in
            logger.info("Token de Factus V2 renovado exitosamente")
            return self._access_token

    def _sanitize_customer_for_sandbox(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        En el entorno Sandbox público, NUNCA se envían datos reales.
        Esta función genera datos ficticios que cumplen todas las reglas de la DIAN.
        """
        suffix = str(int(time.time()))[-6:]
        return {
            "identification_document_code": "13",  # Cédula de ciudadanía
            "identification": "222222222222",      # Consumidor final estándar DIAN / Sandbox
            "names": f"Cliente Sandbox Demo {suffix}",
            "address": "Calle Falsa 123 Sandbox",
            "email": "sandbox-facturas@ejemplo-pruebas.com",
            "phone": "3000000000",
            "legal_organization_code": "2",        # Persona Natural
            "tribute_code": "ZZ",                  # No aplica
            "country_code": "CO",
            "responsibilities": ["R-99-PN"],       # No responsable
            "municipality_code": "11001"           # Bogotá D.C.
        }

    async def send_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Envía una factura electrónica a la DIAN a través de Factus API V2.
        Si FACTUS_ENVIRONMENT == 'simulation', ejecuta el simulador local sin red.
        """
        # 1. Modo Simulación desconectado (fallback o testing unitario rápido)
        if settings.FACTUS_ENVIRONMENT == "simulation":
            import asyncio
            await asyncio.sleep(0.5)
            cufe_dummy = str(uuid.uuid4()).replace("-", "")
            return {
                "status": "accepted",
                "number": invoice_data.get("invoice_number", f"SETT-{int(time.time())}"),
                "cufe": cufe_dummy,
                "dian_message": "Procesado Correctamente (Simulación).",
                "qr_url": f"https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey={cufe_dummy}",
                "pdf_url": "https://api-sandbox.factus.com.co/simulated-pdf",
                "timestamp": datetime.utcnow().isoformat()
            }

        # 2. Modo Real / Sandbox contra Factus API V2
        try:
            token = await self._get_auth_token()
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {token}"
            }

            # Preparar información del cliente
            raw_customer = invoice_data.get("customer", {})
            if settings.FACTUS_ENVIRONMENT == "sandbox":
                customer_payload = self._sanitize_customer_for_sandbox(raw_customer)
            else:
                metadata = raw_customer.get("metadata", {})
                legal_org = metadata.get("legal_organization_code", "2")
                cust_name = raw_customer.get("name", "Consumidor Final")
                customer_payload = {
                    "identification_document_code": metadata.get("identification_document_code", "13"),
                    "identification": str(metadata.get("identification") or "222222222222"),
                    "names": cust_name if legal_org == "2" else None,
                    "company": cust_name if legal_org == "1" else None,
                    "address": metadata.get("address", "Calle 1 # 1-1"),
                    "email": raw_customer.get("email", "facturacion@empresa.com"),
                    "phone": raw_customer.get("phone", "3000000000"),
                    "legal_organization_code": legal_org,
                    "tribute_code": metadata.get("tribute_code", "ZZ"),
                    "country_code": "CO",
                    "responsibilities": ["R-99-PN"],
                    "municipality_code": metadata.get("municipality_code", "11001")
                }

            # Preparar ítems de la factura
            raw_items = invoice_data.get("items", [])
            items_payload = []
            if not raw_items:
                subtotal = float(invoice_data.get("subtotal") or invoice_data.get("total", 50000.0))
                items_payload.append({
                    "code_reference": "SRV-GEN",
                    "name": "Servicio General Sandbox",
                    "quantity": "1.00",
                    "discount_rate": "0.00",
                    "price": f"{subtotal:.2f}",
                    "unit_measure_code": "94",
                    "standard_code": "999",
                    "taxes": [{"code": "01", "rate": "19.00"}]
                })
            else:
                for idx, it in enumerate(raw_items):
                    price = float(it.get("unit_price", 0.0))
                    qty = float(it.get("quantity", 1.0))
                    tax_r = float(it.get("tax_rate", 0.19))
                    tax_pct = tax_r * 100.0 if tax_r <= 1.0 else tax_r
                    
                    item_name = it.get("description") or it.get("name") or f"Item {idx+1}"
                    if settings.FACTUS_ENVIRONMENT == "sandbox":
                        item_name = f"[Sandbox] {item_name}"

                    items_payload.append({
                        "code_reference": it.get("sku") or f"SKU-{idx+1:03d}",
                        "name": item_name,
                        "quantity": f"{qty:.2f}",
                        "discount_rate": "0.00",
                        "price": f"{price:.2f}",
                        "unit_measure_code": "94",
                        "standard_code": "999",
                        "taxes": [{"code": "01", "rate": f"{tax_pct:.2f}"}]
                    })

            # Calcular total a reportar en medios de pago
            total_amount = float(invoice_data.get("total", 0.0))
            if total_amount <= 0:
                sub = sum(float(i["price"]) * float(i["quantity"]) for i in items_payload)
                total_amount = sub * 1.19

            # Generar reference_code único para evitar colisiones 409
            base_ref = invoice_data.get("invoice_number", f"INV-{int(time.time())}")
            ref_code = f"{base_ref}-{int(time.time())}"

            factus_body = {
                "reference_code": ref_code,
                "document": "01",
                "numbering_range_id": settings.FACTUS_NUMBERING_RANGE_ID,
                "operation_type": "10",
                "observation": invoice_data.get("observation", "Factura emitida desde SaaS Vertical"),
                "payment_details": [
                    {
                        "payment_form": "1",             # Contado
                        "payment_method_code": "10",     # Efectivo
                        "amount": f"{total_amount:.2f}"
                    }
                ],
                "cash_rounding_amount": "0.00",
                "customer": customer_payload,
                "items": items_payload
            }

            validate_url = f"{settings.FACTUS_API_URL.rstrip('/')}/v2/bills/validate"
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(validate_url, json=factus_body, headers=headers)
                
                # Caso Exitoso (200 OK / 201 Created)
                if resp.status_code in (200, 201):
                    res_json = resp.json()
                    data = res_json.get("data", {})
                    links = data.get("links", {})
                    is_val = data.get("is_validated", True)
                    
                    return {
                        "status": "accepted" if is_val else "sent",
                        "number": data.get("number"),
                        "cufe": data.get("cufe"),
                        "dian_message": res_json.get("message", "Documento validado con éxito por la DIAN"),
                        "qr_url": links.get("qr"),
                        "pdf_url": links.get("public_url"),
                        "validated_at": data.get("validated_at"),
                        "data": data,
                        "reference_code": ref_code,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                
                # Caso Conflicto (409) si la referencia ya existía
                elif resp.status_code == 409:
                    res_json = resp.json()
                    data = res_json.get("data", {})
                    links = data.get("links", {})
                    return {
                        "status": "accepted",
                        "number": data.get("number"),
                        "cufe": data.get("cufe"),
                        "dian_message": "Factura ya registrada previamente en Factus",
                        "qr_url": links.get("qr"),
                        "pdf_url": links.get("public_url"),
                        "validated_at": data.get("validated_at"),
                        "data": data,
                        "reference_code": ref_code,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                
                # Errores de validación DIAN / Factus
                else:
                    logger.error(f"Error Factus validate ({resp.status_code}): {resp.text}")
                    try:
                        err_json = resp.json()
                    except Exception:
                        err_json = {"detail": resp.text}
                        
                    return {
                        "status": "rejected",
                        "number": invoice_data.get("invoice_number"),
                        "cufe": None,
                        "dian_message": f"Rechazada por Factus/DIAN ({resp.status_code}): {err_json.get('message', resp.text)}",
                        "error_details": err_json,
                        "timestamp": datetime.utcnow().isoformat()
                    }

        except Exception as e:
            logger.exception(f"Excepción comunicando con Factus API V2: {e}")
            return {
                "status": "rejected",
                "number": invoice_data.get("invoice_number"),
                "cufe": None,
                "dian_message": f"Error de comunicación con Factus: {str(e)}",
                "error_details": {"error": str(e)},
                "timestamp": datetime.utcnow().isoformat()
            }

dian_service = DianService()
