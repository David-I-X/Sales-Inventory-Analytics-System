from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session, select
from typing import List, Optional, Dict
from decimal import Decimal
from datetime import datetime, timedelta
import io
import csv

from app.core.database import get_session
from app.core.tenant import get_tenant_by_api_key
from app.models.tenant import Tenant
from app.models.accounting_entry import AccountingEntry
from app.schemas.accounting import (
    ExpenseCreate,
    IncomeCreate,
    AccountingEntryResponse,
    DailyCashFlowItem,
    CategoryBreakdownItem,
    AccountingDashboardResponse,
    MonthlyPnLResponse,
)

router = APIRouter()

@router.get("/entries", response_model=List[AccountingEntryResponse])
@router.get("/entries/", response_model=List[AccountingEntryResponse], include_in_schema=False)
def list_entries(
    entry_type: Optional[str] = None,
    category: Optional[str] = None,
    month: Optional[str] = None,  # YYYY-MM
    limit: int = 100,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    statement = select(AccountingEntry)
    if entry_type:
        statement = statement.where(AccountingEntry.entry_type == entry_type)
    if category:
        statement = statement.where(AccountingEntry.category == category)
        
    entries = session.exec(statement.order_by(AccountingEntry.entry_date.desc()).limit(limit)).all()
    
    if month:
        entries = [e for e in entries if e.entry_date.strftime("%Y-%m") == month]
        
    return entries

@router.post("/expenses", response_model=AccountingEntryResponse)
@router.post("/expenses/", response_model=AccountingEntryResponse, include_in_schema=False)
def create_expense(
    expense_in: ExpenseCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    entry = AccountingEntry(
        entry_type="expense",
        amount=expense_in.amount,
        category=expense_in.category,
        description=expense_in.description,
        reference_type="manual",
        entry_date=expense_in.entry_date or datetime.utcnow(),
    )
    session.add(entry)
    session.flush()
    session.commit()
    return entry

@router.post("/incomes", response_model=AccountingEntryResponse)
@router.post("/incomes/", response_model=AccountingEntryResponse, include_in_schema=False)
def create_income(
    income_in: IncomeCreate,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    """
    Registra un ingreso directo o recarga de saldo/comisión sin pasar por factura de venta tradicional.
    Ideal para modelos de marketplace / comisiones (Tec360 recargas de técnicos).
    """
    entry = AccountingEntry(
        entry_type="income",
        amount=income_in.amount,
        category=income_in.category,
        description=income_in.description,
        reference_type=income_in.reference_type or "manual",
        reference_id=income_in.reference_id,
        entry_date=income_in.entry_date or datetime.utcnow(),
    )
    session.add(entry)
    session.flush()
    session.commit()
    return entry

@router.get("/dashboard", response_model=AccountingDashboardResponse)
@router.get("/dashboard/", response_model=AccountingDashboardResponse, include_in_schema=False)
def get_accounting_dashboard(
    month: Optional[str] = None,  # YYYY-MM, default current month
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    now = datetime.utcnow()
    target_month_str = month or now.strftime("%Y-%m")
    
    entries = session.exec(select(AccountingEntry).order_by(AccountingEntry.entry_date.desc())).all()
    month_entries = [e for e in entries if e.entry_date.strftime("%Y-%m") == target_month_str]
    
    total_income = Decimal("0.00")
    total_expenses = Decimal("0.00")
    income_count = 0
    expense_count = 0
    
    daily_map: Dict[str, Dict[str, Decimal]] = {}
    category_map: Dict[str, Dict[str, Any]] = {}
    
    for e in month_entries:
        date_key = e.entry_date.strftime("%Y-%m-%d")
        if date_key not in daily_map:
            daily_map[date_key] = {"income": Decimal("0.00"), "expense": Decimal("0.00")}
            
        if e.entry_type == "income":
            total_income += e.amount
            income_count += 1
            daily_map[date_key]["income"] += e.amount
        else:
            total_expenses += e.amount
            expense_count += 1
            daily_map[date_key]["expense"] += e.amount
            
            cat = e.category or "otros"
            if cat not in category_map:
                category_map[cat] = {"total": Decimal("0.00"), "count": 0}
            category_map[cat]["total"] += e.amount
            category_map[cat]["count"] += 1
            
    net_profit = total_income - total_expenses
    
    # Sort daily cashflow by date
    daily_flow = []
    for d in sorted(daily_map.keys()):
        inc = daily_map[d]["income"]
        exp = daily_map[d]["expense"]
        daily_flow.append(DailyCashFlowItem(
            date=d,
            income=inc,
            expense=exp,
            net=inc - exp
        ))
        
    # Category breakdown
    cat_breakdown = []
    for cat, data in category_map.items():
        pct = float((data["total"] / total_expenses) * 100) if total_expenses > 0 else 0.0
        cat_breakdown.append(CategoryBreakdownItem(
            category=cat,
            total=data["total"],
            percentage=round(pct, 1),
            count=data["count"]
        ))
    cat_breakdown.sort(key=lambda x: x.total, reverse=True)
    
    return AccountingDashboardResponse(
        current_month=target_month_str,
        month_income=total_income,
        month_expenses=total_expenses,
        month_net_profit=net_profit,
        is_profitable=net_profit >= 0,
        income_count=income_count,
        expense_count=expense_count,
        daily_cash_flow=daily_flow,
        expenses_by_category=cat_breakdown,
        recent_entries=month_entries[:10]
    )

@router.get("/pnl", response_model=MonthlyPnLResponse)
@router.get("/pnl/", response_model=MonthlyPnLResponse, include_in_schema=False)
def get_monthly_pnl(
    month: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    now = datetime.utcnow()
    target_month_str = month or now.strftime("%Y-%m")
    
    entries = session.exec(select(AccountingEntry)).all()
    month_entries = [e for e in entries if e.entry_date.strftime("%Y-%m") == target_month_str]
    
    gross_revenue = Decimal("0.00")
    cogs = Decimal("0.00")
    operating_expenses = Decimal("0.00")
    
    for e in month_entries:
        if e.entry_type == "income":
            gross_revenue += e.amount
        else:
            if e.category == "proveedores":
                cogs += e.amount
            else:
                operating_expenses += e.amount
                
    gross_profit = gross_revenue - cogs
    gross_margin = float((gross_profit / gross_revenue) * 100) if gross_revenue > 0 else 0.0
    net_operating_income = gross_profit - operating_expenses
    net_margin = float((net_operating_income / gross_revenue) * 100) if gross_revenue > 0 else 0.0
    
    return MonthlyPnLResponse(
        month=target_month_str,
        gross_revenue=gross_revenue,
        cost_of_goods_sold=cogs,
        gross_profit=gross_profit,
        gross_margin_percentage=round(gross_margin, 1),
        operating_expenses=operating_expenses,
        net_operating_income=net_operating_income,
        net_margin_percentage=round(net_margin, 1)
    )

@router.get("/export")
@router.get("/export/", include_in_schema=False)
def export_accounting_csv(
    month: Optional[str] = None,
    tenant: Tenant = Depends(get_tenant_by_api_key),
    session: Session = Depends(get_session)
):
    now = datetime.utcnow()
    target_month_str = month or now.strftime("%Y-%m")
    
    entries = session.exec(select(AccountingEntry).order_by(AccountingEntry.entry_date.asc())).all()
    month_entries = [e for e in entries if e.entry_date.strftime("%Y-%m") == target_month_str]
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    
    # Header
    writer.writerow(["ID", "Fecha", "Tipo", "Categoria", "Descripcion", "Monto (COP)", "Referencia Tipo", "Referencia ID"])
    
    for e in month_entries:
        writer.writerow([
            e.id,
            e.entry_date.strftime("%Y-%m-%d %H:%M"),
            "Ingreso" if e.entry_type == "income" else "Gasto",
            e.category,
            e.description,
            float(e.amount),
            e.reference_type or "",
            e.reference_id or ""
        ])
        
    csv_content = output.getvalue().encode("utf-8-sig")  # BOM for Excel compatibility in Spanish
    filename = f"contabilidad_{tenant.schema_name}_{target_month_str}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
