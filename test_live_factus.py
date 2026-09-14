import urllib.request
import json
import time

base_url = 'http://localhost/api/v1'
api_key = 'sk_live__0HOO0H8lm5KvFaWGwRmrGwZomp0Telg'

headers = {
    'x-api-key': api_key,
    'Content-Type': 'application/json'
}

# 1. Obtener o crear contacto ficticio para sandbox
fake_phone = f"+57300{str(int(time.time()))[-7:]}"
req_contact = urllib.request.Request(
    f"{base_url}/contacts/",
    data=json.dumps({
        "name": "Cliente Ficticio Demo Sandbox",
        "phone": fake_phone,
        "email": "sandbox-demo@ejemplo-pruebas.com"
    }).encode("utf-8"),
    headers=headers
)

try:
    with urllib.request.urlopen(req_contact) as resp:
        contact = json.loads(resp.read().decode("utf-8"))
        print(f"Contacto ficticio creado: ID {contact['id']}")
except Exception as e:
    req_list = urllib.request.Request(f"{base_url}/contacts/", headers=headers)
    with urllib.request.urlopen(req_list) as resp:
        contacts = json.loads(resp.read().decode("utf-8"))
        contact = contacts[0]
        print(f"Usando contacto: ID {contact['id']}")

# 2. Emitir Factura Electronica con Factus V2
invoice_payload = {
    "contact_id": contact["id"],
    "auto_accounting": True,
    "items": [
        {
            "sku": "SRV-TEST-01",
            "description": "Mantenimiento Técnico Pruebas Sandbox",
            "quantity": 1,
            "unit_price": 75000.0,
            "tax_rate": 0.19
        }
    ]
}

req_inv = urllib.request.Request(
    f"{base_url}/dian/invoices/",
    data=json.dumps(invoice_payload).encode("utf-8"),
    headers=headers
)

print("Enviando factura a Factus V2 Sandbox...")
with urllib.request.urlopen(req_inv) as resp:
    inv = json.loads(resp.read().decode("utf-8"))
    print("========================================================")
    print("  FACTURA ELECTRONICA TIMBRADA EXITOSAMENTE EN FACTUS")
    print("========================================================")
    print("ID Interno:", inv.get("id"))
    print("Numero Consecutivo DIAN:", inv.get("invoice_number"))
    print("CUFE:", inv.get("cufe"))
    print("Estado DIAN:", inv.get("dian_status"))
    print("Subtotal:", inv.get("subtotal"))
    print("IVA (19%):", inv.get("tax"))
    print("Total:", inv.get("total"))
    print("Enlace QR DIAN:", inv.get("qr_url"))
    print("Enlace PDF Factus:", inv.get("pdf_url"))
    print("Mensaje DIAN:", inv.get("dian_response", {}).get("dian_message"))
    print("========================================================")
