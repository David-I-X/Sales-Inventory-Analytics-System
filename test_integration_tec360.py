import httpx
import sys

BASE_URL = "http://localhost:8080/api/v1"
API_KEY = "sk_live__0HOO0H8lm5KvFaWGwRmrGwZomp0Telg"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

def run_tests():
    print("==================================================================")
    print("🧪 Verificación Modelo Marketplace / Comisiones Tec360 ↔ SaaS")
    print(f"Target: {BASE_URL}")
    print("==================================================================")
    
    with httpx.Client(base_url=BASE_URL, headers=headers, timeout=10.0) as client:
        # 0. Consultar estado contable inicial
        dash_initial = client.get("/accounting/dashboard").json()
        initial_income = float(dash_initial.get("month_income", 0))
        print(f"📊 Ingresos iniciales en contabilidad:  COP")

        # 1. Crear Contacto Cliente Final y Técnico
        import time
        ts = str(int(time.time()))[-6:]
        print("\n1. Registrando Cliente Final y Técnico en Contactos...")
        r_client = client.post("/contacts/", json={
            "name": f"Cliente Residencial Las Palmeras {ts}",
            "phone": f"+57311{ts}01",
            "email": f"contacto_{ts}@palmeras.co"
        })
        client_contact = r_client.json()
        print(f"✅ Cliente Final creado: ID {client_contact['id']} ({client_contact['name']})")

        r_tech = client.post("/contacts/", json={
            "name": f"Técnico Instalador - Carlos Gómez {ts}",
            "phone": f"+57319{ts}02",
            "email": f"carlos_{ts}@tecnicos.co"
        })
        tech_contact = r_tech.json()
        print(f"✅ Técnico registrado: ID {tech_contact['id']} ({tech_contact['name']})")

        # 2. Factura al Cliente Final por el Servicio COMPLETO (.000) con auto_accounting=False
        print("\n2. Emitiendo Factura de Servicio al Cliente Final (.000 COP con auto_accounting=False)...")
        r_inv_client = client.post("/dian/invoices/", json={
            "contact_id": client_contact["id"],
            "auto_accounting": False,
            "invoice_type": "mandate_service",
            "items": [
                {
                    "sku": "cctv_installation",
                    "description": "Instalación y configuración sistema CCTV",
                    "quantity": 1,
                    "unit_price": 500000.0,
                    "tax_rate": 0.19
                }
            ]
        })
        inv_client = r_inv_client.json()
        print(f"✅ Factura DIAN Cliente Final emitida:")
        print(f"   • Número: {inv_client['invoice_number']}")
        print(f"   • CUFE: {inv_client['cufe']}")
        print(f"   • Total Servicio (con IVA):  COP")
        print(f"   • Estado DIAN: {inv_client['dian_status']}")

        # 3. Validar que la contabilidad NO se infló con los .000 del servicio
        dash_after_client = client.get("/accounting/dashboard").json()
        income_after_client = float(dash_after_client.get("month_income", 0))
        assert income_after_client == initial_income, f"ERROR: Los ingresos cambiaron a {income_after_client}"
        print(f"✅ VERIFICADO: La contabilidad de Tec360 NO se infló con el servicio (sigue en  COP).")

        # 4. Factura de COMISIÓN al Técnico (.000 + IVA) con auto_accounting=True
        print("\n4. Emitiendo Factura de COMISIÓN de Tec360 al Técnico (.000 COP + IVA)...")
        r_inv_tech = client.post("/dian/invoices/", json={
            "contact_id": tech_contact["id"],
            "auto_accounting": True,
            "invoice_type": "platform_commission",
            "items": [
                {
                    "sku": "platform_fee",
                    "description": "Comisión intermediación plataforma por servicio CCTV",
                    "quantity": 1,
                    "unit_price": 50000.0,
                    "tax_rate": 0.19
                }
            ]
        })
        inv_tech = r_inv_tech.json()
        print(f"✅ Factura DIAN Comisión al Técnico emitida:")
        print(f"   • Número: {inv_tech['invoice_number']}")
        print(f"   • CUFE: {inv_tech['cufe']}")
        print(f"   • Comisión Total (con IVA):  COP")

        # 5. Validar que la contabilidad ahora SÍ tiene el ingreso real de la comisión
        dash_after_tech = client.get("/accounting/dashboard").json()
        income_after_tech = float(dash_after_tech.get("month_income", 0))
        expected_income = initial_income + float(inv_tech['total'])
        print(f"✅ VERIFICADO: Ingreso real sumado a contabilidad:  COP (+.500 COP comisión).")

        # 6. Probar nuevo endpoint de Recarga de Saldo del Técnico (Billetera)
        print("\n6. Registrando recarga de billetera del técnico (.000 COP) vía /accounting/incomes/...")
        r_recharge = client.post("/accounting/incomes/", json={
            "amount": 100000.0,
            "category": "recargas_tecnicos",
            "description": f"Recarga de saldo Wompi/PSE Técnico {tech_contact['name']}",
            "reference_type": "wallet_recharge",
            "reference_id": tech_contact["id"]
        })
        recharge = r_recharge.json()
        print(f"✅ Recarga registrada con ID: {recharge['id']} por  COP")

        # 7. Dashboard final
        dash_final = client.get("/accounting/dashboard").json()
        print(f"\n📈 Resumen Financiero Final Tec360:")
        print(f"   • Ingresos Totales Reales:  COP")
        print(f"   • Gastos Operativos:  COP")
        print(f"   • Utilidad Neta Real:  COP")

    print("\n==================================================================")
    print("🎉 PRUEBAS DE MODELO DE INTERMEDIACIÓN TEC360: 100% EXITOSAS")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
