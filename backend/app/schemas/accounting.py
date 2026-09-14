from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class ExpenseCreate(BaseModel):
    category: str  # proveedores, arriendo, nomina, servicios, transporte, impuestos, otros
    amount: Decimal = Field(gt=0)
    description: str
    entry_date: Optional[datetime] = None

class IncomeCreate(BaseModel):
    category: str = "comisiones"  # comisiones, recargas_tecnicos, suscripciones, ventas, otros
    amount: Decimal = Field(gt=0)
    description: str
    reference_type: Optional[str] = "manual"
    reference_id: Optional[int] = None
    entry_date: Optional[datetime] = None

class AccountingEntryResponse(BaseModel):
    id: int
    entry_type: str  # income | expense
    amount: Decimal
    category: str
    description: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    entry_date: datetime
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DailyCashFlowItem(BaseModel):
    date: str  # YYYY-MM-DD
    income: Decimal
    expense: Decimal
    net: Decimal

class CategoryBreakdownItem(BaseModel):
    category: str
    total: Decimal
    percentage: float
    count: int

class AccountingDashboardResponse(BaseModel):
    current_month: str
    month_income: Decimal
    month_expenses: Decimal
    month_net_profit: Decimal
    is_profitable: bool
    income_count: int
    expense_count: int
    daily_cash_flow: List[DailyCashFlowItem]
    expenses_by_category: List[CategoryBreakdownItem]
    recent_entries: List[AccountingEntryResponse]

class MonthlyPnLResponse(BaseModel):
    month: str
    gross_revenue: Decimal           # Total ventas / ingresos operacionales
    cost_of_goods_sold: Decimal      # Compras a proveedores
    gross_profit: Decimal            # Utilidad Bruta = Ingresos - Costo Ventas
    gross_margin_percentage: float
    operating_expenses: Decimal      # Arriendo + Nómina + Servicios + Otros
    net_operating_income: Decimal    # Utilidad Neta
    net_margin_percentage: float
