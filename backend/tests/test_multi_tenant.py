"""
test_multi_tenant.py — Tests críticos de aislamiento multi-tenant.
Verifica que los datos de un tenant NO son visibles para otro tenant.
Usa httpx directamente para evitar problemas de contexto con Playwright.
"""
import uuid
import httpx
import pytest
from tests.conftest import BASE_URL, API_PREFIX


def create_fresh_tenant(label: str) -> tuple[int, str]:
    """Helper: crea un tenant fresco y devuelve (tenant_id, api_key) usando httpx."""
    schema = f"isol_{uuid.uuid4().hex[:8]}"
    resp = httpx.post(f"{BASE_URL}{API_PREFIX}/tenants/register", json={
        "name": f"Isolation {label} {schema}",
        "schema_name": schema,
        "plan": "free"
    })
    assert resp.status_code == 200, f"Failed to create tenant {label}: {resp.text}"
    tenant_id = resp.json()["id"]

    resp = httpx.post(f"{BASE_URL}{API_PREFIX}/tenants/{tenant_id}/api-keys",
                      params={"label": "isolation"})
    assert resp.status_code == 200
    api_key = resp.json()["key"]
    return tenant_id, api_key


def tenant_client(api_key: str) -> httpx.Client:
    """Returns an httpx.Client pre-configured with the tenant's API key."""
    return httpx.Client(
        base_url=BASE_URL,
        headers={"x-api-key": api_key},
        timeout=30.0
    )


class TestMultiTenantIsolation:

    def test_contact_not_visible_across_tenants(self):
        """
        Un contacto creado en Tenant A NO debe aparecer en el Tenant B.
        Este es el test de seguridad más crítico del sistema SaaS.
        """
        _, key_a = create_fresh_tenant("A")
        _, key_b = create_fresh_tenant("B")

        with tenant_client(key_a) as client_a, tenant_client(key_b) as client_b:
            # Crear contacto en Tenant A
            phone_a = f"+57302{uuid.uuid4().hex[:7]}"
            resp = client_a.post(f"{API_PREFIX}/contacts/", json={
                "name": "Contacto Exclusivo de A",
                "phone": phone_a
            })
            assert resp.status_code == 200, f"Contact creation failed: {resp.text}"
            contact_a_id = resp.json()["id"]

            # Tenant B NO debe verlo en su lista
            resp_b = client_b.get(f"{API_PREFIX}/contacts/")
            assert resp_b.status_code == 200
            contacts_b = resp_b.json()
            ids_in_b = [c["id"] for c in contacts_b]
            assert contact_a_id not in ids_in_b, (
                f"¡FALLO DE AISLAMIENTO! Contacto {contact_a_id} de Tenant A "
                f"es visible en la lista de Tenant B"
            )

            # Tenant B tampoco puede acceder directamente por ID
            resp_direct = client_b.get(f"{API_PREFIX}/contacts/{contact_a_id}")
            assert resp_direct.status_code == 404, (
                f"¡FALLO DE AISLAMIENTO! Contacto {contact_a_id} de Tenant A "
                f"es accesible por ID desde Tenant B"
            )

    def test_invoice_not_visible_across_tenants(self):
        """
        Una factura del Tenant A NO debe aparecer en el Tenant B.
        """
        _, key_a = create_fresh_tenant("A-inv")
        _, key_b = create_fresh_tenant("B-inv")

        with tenant_client(key_a) as client_a, tenant_client(key_b) as client_b:
            phone = f"+57303{uuid.uuid4().hex[:7]}"
            resp_c = client_a.post(f"{API_PREFIX}/contacts/", json={
                "name": "Cliente A", "phone": phone
            })
            assert resp_c.status_code == 200, f"Contact creation failed: {resp_c.text}"
            contact = resp_c.json()

            invoice = client_a.post(f"{API_PREFIX}/dian/invoices/", json={
                "contact_id": contact["id"],
                "items": [{
                    "sku": "test_item", "description": "Test",
                    "quantity": 1, "unit_price": 100000, "tax_rate": 0.19
                }]
            }).json()
            invoice_id = invoice["id"]

            invoices_b = client_b.get(f"{API_PREFIX}/dian/invoices/").json()
            ids_in_b = [inv["id"] for inv in invoices_b]
            assert invoice_id not in ids_in_b, (
                f"¡FALLO DE AISLAMIENTO! Factura {invoice_id} de Tenant A "
                f"es visible en Tenant B"
            )

    def test_tenants_have_independent_data_sequences(self):
        """
        Ambos tenants pueden operar de forma totalmente independiente
        sin interferencia entre sus datos.
        """
        _, key_a = create_fresh_tenant("seq-A")
        _, key_b = create_fresh_tenant("seq-B")

        with tenant_client(key_a) as client_a, tenant_client(key_b) as client_b:
            phone_a = f"+57390{uuid.uuid4().hex[:7]}"  # hex prefix avoids int collision
            phone_b = f"+57391{uuid.uuid4().hex[:7]}"

            resp_a = client_a.post(f"{API_PREFIX}/contacts/", json={
                "name": "A Primero", "phone": phone_a
            })
            assert resp_a.status_code == 200, (
                f"Failed to create contact in tenant A: {resp_a.status_code} {resp_a.text}"
            )
            contact_a = resp_a.json()

            resp_b = client_b.post(f"{API_PREFIX}/contacts/", json={
                "name": "B Primero", "phone": phone_b
            })
            assert resp_b.status_code == 200, (
                f"Failed to create contact in tenant B: {resp_b.status_code} {resp_b.text}"
            )
            contact_b = resp_b.json()

            assert contact_a["name"] == "A Primero"
            assert contact_b["name"] == "B Primero"

            # Cada uno puede ver su propio contacto
            assert client_a.get(f"{API_PREFIX}/contacts/{contact_a['id']}").status_code == 200
            assert client_b.get(f"{API_PREFIX}/contacts/{contact_b['id']}").status_code == 200
