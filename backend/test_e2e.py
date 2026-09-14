"""
Script de prueba end-to-end para el SaaS Vertical Backend.
Ejecuta el flujo completo:
  1. Registrar un Tenant
  2. Generar un API Key
  3. Crear un Contacto
  4. Crear una Factura DIAN
  5. Listar Facturas
  6. Ver detalle de Factura
"""
import httpx
import json
import sys

BASE = "http://127.0.0.1:8000/api/v1"
SEPARATOR = "=" * 60

def step(n, title):
    print(f"\n{SEPARATOR}")
    print(f"  PASO {n}: {title}")
    print(SEPARATOR)

def check(response, expected=None):
    ok = response.status_code < 400
    status = "✅" if ok else "❌"
    print(f"  {status} Status: {response.status_code}")
    try:
        data = response.json()
        print(f"  Response: {json.dumps(data, indent=2, default=str)}")
    except Exception:
        print(f"  Response: {response.text}")
    if not ok:
        print("  ⚠️  FALLO — abortando...")
        sys.exit(1)
    return data if ok else None


with httpx.Client(timeout=30.0) as client:
    
    # ── 1. Registrar tenant ──
    step(1, "Registrar Tenant 'Tec360'")
    r = client.post(f"{BASE}/tenants/register", json={
        "name": "Tec360 Seguridad",
        "schema_name": "tec360",
        "plan": "pro"
    })
    tenant = check(r)
    tenant_id = tenant["id"]

    # ── 2. Generar API Key ──
    step(2, "Generar API Key")
    r = client.post(f"{BASE}/tenants/{tenant_id}/api-keys?label=test-key")
    key_data = check(r)
    api_key = key_data["key"]
    print(f"\n  🔑 API Key: {api_key}")
    
    # Headers para todas las peticiones autenticadas
    headers = {"x-api-key": api_key}

    # ── 3. Verificar tenant autenticado ──
    step(3, "GET /tenants/me (verificar auth)")
    r = client.get(f"{BASE}/tenants/me", headers=headers)
    check(r)
    
    # ── 4. Crear contacto ──
    step(4, "Crear Contacto")
    r = client.post(f"{BASE}/contacts/", headers=headers, json={
        "name": "Juan Pérez",
        "phone": "+573001234567",
        "email": "juan@example.com"
    })
    contact = check(r)
    contact_id = contact["id"]

    # ── 5. Listar contactos ──
    step(5, "Listar Contactos")
    r = client.get(f"{BASE}/contacts/", headers=headers)
    check(r)
    
    # ── 6. Crear factura DIAN ──
    step(6, "Crear Factura DIAN")
    r = client.post(f"{BASE}/dian/invoices/", headers=headers, json={
        "contact_id": contact_id,
        "items": [
            {
                "sku": "CAM-001",
                "description": "Cámara de seguridad HD",
                "quantity": 2,
                "unit_price": 250000,
                "tax_rate": 0.19
            },
            {
                "sku": "INST-001",
                "description": "Instalación profesional",
                "quantity": 1,
                "unit_price": 150000,
                "tax_rate": 0.19
            }
        ]
    })
    invoice = check(r)

    # ── 7. Listar facturas ──
    step(7, "Listar Facturas")
    r = client.get(f"{BASE}/dian/invoices/", headers=headers)
    check(r)

    # ── 8. Ver detalle de factura ──
    step(8, "Ver detalle de factura")
    r = client.get(f"{BASE}/dian/invoices/{invoice['id']}", headers=headers)
    check(r)

    # ── Resumen ──
    print(f"\n{SEPARATOR}")
    print("  🎉 TODOS LOS TESTS PASARON EXITOSAMENTE")
    print(SEPARATOR)
    print(f"\n  Tenant ID:       {tenant_id}")
    print(f"  API Key:         {api_key}")
    print(f"  Contact ID:      {contact_id}")
    print(f"  Invoice ID:      {invoice['id']}")
    print(f"  Invoice Number:  {invoice['invoice_number']}")
    print(f"  CUFE:            {invoice.get('cufe', 'N/A')}")
    print(f"  DIAN Status:     {invoice['dian_status']}")
    print(f"  Total:           ${invoice['total']:,.2f} COP")
    print()
