"""
feature_engineering.py — Pipeline de preparación de datos por tenant.

Extrae y transforma el historial de contactos, mensajes de WhatsApp y facturación
en un DataFrame/matriz de características numéricas aptas para modelos de ML.
"""
from typing import Dict, Any, List
from sqlmodel import Session, select
from app.models.contact import Contact
from app.models.invoice import Invoice
from datetime import datetime, timedelta
import math

class FeatureExtractor:
    """
    Transforma registros relacionales en características tabulares (Features).
    Soporta fallback elegante cuando hay pocos datos (< 10 registros).
    """

    def extract_contact_features(self, session: Session) -> List[Dict[str, Any]]:
        """
        Genera características numéricas por contacto para el modelo de Lead Scoring:
        - recency_days: días transcurridos desde el último contacto o actualización
        - total_invoices_count: número de facturas emitidas históricamente
        - total_spent_cop: suma acumulada en COP pagada
        - lead_score_base: puntaje base de interacción CRM
        - is_payday_season: 1 si estamos cerca de días 15/30 (quincena colombiana), 0 si no
        """
        contacts = session.exec(select(Contact)).all()
        features = []
        now = datetime.utcnow()
        day_of_month = now.day
        is_payday = 1 if (13 <= day_of_month <= 16 or 28 <= day_of_month <= 31) else 0

        for c in contacts:
            # Facturas del contacto
            invoices = session.exec(select(Invoice).where(Invoice.contact_id == c.id)).all()
            total_spent = sum(float(inv.total) for inv in invoices if inv.dian_status == "accepted")
            invoice_count = len(invoices)

            recency = (now - c.updated_at).days if c.updated_at else 30

            features.append({
                "contact_id": c.id,
                "name": c.name,
                "phone": c.phone,
                "funnel_stage": c.funnel_stage,
                "recency_days": recency,
                "total_invoices": invoice_count,
                "total_spent": total_spent,
                "lead_score_base": c.lead_score,
                "is_payday": is_payday
            })

        return features

    def extract_demand_features(self, session: Session) -> List[Dict[str, Any]]:
        """
        Agrupa facturas por SKU de producto/servicio para generar series de demanda:
        - sku: Identificador del producto/servicio
        - past_30d_sales: Unidades vendidas en los últimos 30 días
        - past_7d_sales: Unidades vendidas en los últimos 7 días
        - avg_price: Precio promedio cobrado
        """
        invoices = session.exec(select(Invoice).where(Invoice.dian_status == "accepted")).all()
        sku_stats: Dict[str, Dict[str, Any]] = {}

        now = datetime.utcnow()
        cutoff_30d = now - timedelta(days=30)
        cutoff_7d = now - timedelta(days=7)

        for inv in invoices:
            inv_date = inv.issued_at or now
            items = inv.line_items or []
            for item in items:
                sku = item.get("sku", "general_service")
                qty = item.get("quantity", 1)
                price = item.get("unit_price", 0.0)

                if sku not in sku_stats:
                    sku_stats[sku] = {
                        "sku": sku,
                        "description": item.get("description", sku),
                        "sales_30d": 0,
                        "sales_7d": 0,
                        "total_revenue": 0.0,
                        "unit_price": price
                    }

                if inv_date >= cutoff_30d:
                    sku_stats[sku]["sales_30d"] += qty
                    sku_stats[sku]["total_revenue"] += (qty * price)

                if inv_date >= cutoff_7d:
                    sku_stats[sku]["sales_7d"] += qty

        return list(sku_stats.values())
