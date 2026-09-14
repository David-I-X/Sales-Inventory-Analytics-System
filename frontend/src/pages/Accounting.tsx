import React, { useState, useEffect } from 'react';
import { 
  IconPlus, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconCash, 
  IconArrowUpRight, 
  IconArrowDownLeft, 
  IconAlertTriangle, 
  IconFileSpreadsheet 
} from '@tabler/icons-react';
import { api } from '../services/api';
import type { AccountingDashboard, AccountingEntry } from '../types';

export const Accounting: React.FC = () => {
  const [dashboard, setDashboard] = useState<AccountingDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Expense Form
  const [expenseData, setExpenseData] = useState({
    category: 'arriendo',
    amount: 0,
    description: '',
    entry_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AccountingDashboard>('/accounting/dashboard');
      setDashboard(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar contabilidad';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseData.amount <= 0 || !expenseData.description) {
      setError('Por favor ingresa un monto válido y una descripción.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.post<AccountingEntry>('/accounting/expenses', {
        ...expenseData,
        amount: Number(expenseData.amount),
        entry_date: new Date(expenseData.entry_date).toISOString()
      });
      setShowExpenseModal(false);
      setExpenseData({
        category: 'arriendo',
        amount: 0,
        description: '',
        entry_date: new Date().toISOString().split('T')[0]
      });
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar el gasto';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/v1/accounting/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'x-api-key': localStorage.getItem('api_key') || ''
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contabilidad_${dashboard?.current_month || 'mes'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error al descargar el archivo CSV.');
    }
  };

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const filteredEntries = dashboard?.recent_entries.filter(e => {
    if (typeFilter === 'all') return true;
    return e.entry_type === typeFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Contabilidad & Flujo de Caja</h1>
          <p className="text-xs text-secondary mt-0.5">
            Visibilidad financiera en tiempo real. Sincronización automática de facturas DIAN y compras.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="btn btn-secondary flex items-center gap-1.5" onClick={handleExportCSV}>
            <IconFileSpreadsheet size={16} className="text-emerald-600" />
            <span>📥 Exportar para Contador (CSV)</span>
          </button>
          <button className="btn btn-primary flex items-center gap-1.5" onClick={() => setShowExpenseModal(true)}>
            <IconPlus size={16} />
            <span>+ Registrar Gasto</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Financial KPIs Banner */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Ingresos del Mes ({dashboard.income_count} ventas)</div>
                <div className="stat-value text-emerald-600 dark:text-emerald-400">{formatCOP(dashboard.month_income)}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--accent-success)' }}>
                <IconTrendingUp size={22} />
              </div>
            </div>
            <div className="text-[11px] text-muted">100% sincronizado con facturas DIAN</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Gastos del Mes ({dashboard.expense_count} registros)</div>
                <div className="stat-value text-red-600 dark:text-red-400">{formatCOP(dashboard.month_expenses)}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--accent-danger)' }}>
                <IconTrendingDown size={22} />
              </div>
            </div>
            <div className="text-[11px] text-muted">Compras a proveedores + Gastos fijos</div>
          </div>

          <div className="stat-card" style={{ borderLeft: `4px solid ${dashboard.is_profitable ? 'var(--accent-primary)' : 'var(--accent-warning)'}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Utilidad Neta del Mes</div>
                <div className={`stat-value ${dashboard.is_profitable ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {formatCOP(dashboard.month_net_profit)}
                </div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-info-bg)', color: 'var(--accent-primary)' }}>
                <IconCash size={22} />
              </div>
            </div>
            <div>
              <span className={`badge ${dashboard.is_profitable ? 'badge-success' : 'badge-danger'}`}>
                {dashboard.is_profitable ? '✅ Operación Rentable' : '⚠️ Operación en Déficit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Daily Cashflow & Category Breakdown */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Cash Flow */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="font-bold text-sm text-primary">Flujo de Caja Diario</h3>
              <span className="text-xs text-muted font-mono">{dashboard.current_month}</span>
            </div>
            <div className="card-body">
              {dashboard.daily_cash_flow.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">Sin movimientos registrados este mes.</div>
              ) : (
                <div className="space-y-3">
                  {dashboard.daily_cash_flow.map((flow) => {
                    const incWidth = Math.min(100, Math.round((flow.income / (flow.income + flow.expense || 1)) * 100));
                    return (
                      <div key={flow.date} className="p-3 rounded-xl border border-default bg-elevated text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{flow.date}</span>
                          <span className={`font-mono font-bold ${flow.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            Neto: {formatCOP(flow.net)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted">
                          <span className="text-emerald-600 dark:text-emerald-400">Ingresos: +{formatCOP(flow.income)}</span>
                          <span className="text-red-600 dark:text-red-400">Gastos: -{formatCOP(flow.expense)}</span>
                        </div>
                        {/* Visual bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${incWidth}%` }}></div>
                          <div className="bg-red-500 h-full" style={{ width: `${100 - incWidth}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Expenses by Category */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-bold text-sm text-primary">Desglose de Gastos por Categoría</h3>
            </div>
            <div className="card-body">
              {dashboard.expenses_by_category.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">No hay gastos registrados aún.</div>
              ) : (
                <div className="space-y-4">
                  {dashboard.expenses_by_category.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold capitalize text-primary">{cat.category}</span>
                        <div className="text-right">
                          <span className="font-bold font-mono mr-2 text-primary">{formatCOP(cat.total)}</span>
                          <span className="text-muted font-mono">({cat.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accounting Entries Table */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-sm text-primary">Movimientos del Mes</h3>
          <div className="segmented-control">
            <button
              className={`segmented-item ${typeFilter === 'all' ? 'segmented-item-active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              <span>Todos</span>
              <span className="segmented-item-badge">{dashboard?.recent_entries.length || 0}</span>
            </button>
            <button
              className={`segmented-item ${typeFilter === 'income' ? 'segmented-item-active' : ''}`}
              onClick={() => setTypeFilter('income')}
            >
              <IconTrendingUp size={14} className={typeFilter === 'income' ? 'text-white' : 'text-emerald-500'} />
              <span>Ingresos</span>
            </button>
            <button
              className={`segmented-item ${typeFilter === 'expense' ? 'segmented-item-active' : ''}`}
              onClick={() => setTypeFilter('expense')}
            >
              <IconTrendingDown size={14} className={typeFilter === 'expense' ? 'text-white' : 'text-red-500'} />
              <span>Gastos</span>
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Referencia</th>
                <th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-secondary">Cargando movimientos...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-secondary">
                    No se encontraron registros contables.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs text-muted font-mono">
                      {new Date(e.entry_date).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      <span className={`badge ${e.entry_type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {e.entry_type === 'income' ? (
                          <>
                            <IconArrowDownLeft size={13} className="inline mr-1" />
                            Ingreso
                          </>
                        ) : (
                          <>
                            <IconArrowUpRight size={13} className="inline mr-1" />
                            Gasto
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-xs capitalize px-2 py-0.5 rounded bg-elevated border border-default text-primary">
                        {e.category}
                      </span>
                    </td>
                    <td className="font-medium text-primary">{e.description}</td>
                    <td className="text-xs text-muted font-mono">
                      {e.reference_type ? `${e.reference_type} #${e.reference_id || ''}` : '-'}
                    </td>
                    <td className={`text-right font-bold font-mono ${e.entry_type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {e.entry_type === 'income' ? '+' : '-'}{formatCOP(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR GASTO */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="font-bold text-base text-primary">Registrar Nuevo Gasto Operativo</h3>
              <button className="btn-ghost p-1 rounded text-muted hover:text-primary" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateExpense}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Categoría *</label>
                    <select
                      className="input"
                      value={expenseData.category}
                      onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                    >
                      <option value="arriendo">Arriendo</option>
                      <option value="nomina">Nómina / Salarios</option>
                      <option value="servicios">Servicios Públicos / Internet</option>
                      <option value="transporte">Transporte / Gasolina</option>
                      <option value="impuestos">Impuestos / Tasas</option>
                      <option value="proveedores">Proveedores / Materiales</option>
                      <option value="otros">Otros Gastos</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Monto (COP) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      className="input font-mono font-bold"
                      placeholder="ej: 350000"
                      value={expenseData.amount || ''}
                      onChange={(e) => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Descripción del Gasto *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="ej: Pago de internet fibra óptica oficina"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Fecha del Gasto</label>
                  <input
                    type="date"
                    required
                    className="input font-mono"
                    value={expenseData.entry_date}
                    onChange={(e) => setExpenseData({ ...expenseData, entry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
