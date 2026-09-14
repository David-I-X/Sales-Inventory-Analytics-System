import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Contact, Invoice, MlAlert, LeadScoreItem, InventoryDashboard, AccountingDashboard } from '../types';
import { 
  IconFileInvoice, 
  IconPackages, 
  IconAlertTriangle, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconCash, 
  IconBrain, 
  IconReceipt2, 
  IconShoppingCart,
  IconChevronRight,
  IconPhone,
  IconClock
} from '@tabler/icons-react';

interface LeadRankingApiResponse {
  total_leads_analyzed: number;
  top_leads: LeadScoreItem[];
  generated_at: string;
}

export default function Dashboard() {
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [invoicesCount, setInvoicesCount] = useState<number>(0);
  const [accountingDash, setAccountingDash] = useState<AccountingDashboard | null>(null);
  const [inventoryDash, setInventoryDash] = useState<InventoryDashboard | null>(null);
  const [topLead, setTopLead] = useState<LeadScoreItem | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<MlAlert[]>([]);
  const [topLeadsList, setTopLeadsList] = useState<LeadScoreItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [contactsData, invoicesData, alertsData, leadsRes, accData, invData] = await Promise.all([
          api.get<Contact[]>('/contacts').catch(() => []),
          api.get<Invoice[]>('/dian/invoices').catch(() => []),
          api.get<MlAlert[]>('/ml/alerts?is_read=false').catch(() => []),
          api.get<LeadRankingApiResponse | LeadScoreItem[]>('/ml/leads/ranking').catch(() => null),
          api.get<AccountingDashboard>('/accounting/dashboard').catch(() => null),
          api.get<InventoryDashboard>('/inventory/dashboard').catch(() => null)
        ]);
        
        setContactsCount(contactsData?.length || 0);
        setInvoicesCount(invoicesData?.length || 0);
        setAccountingDash(accData);
        setInventoryDash(invData);
        
        let leads: LeadScoreItem[] = [];
        if (leadsRes) {
          if (Array.isArray(leadsRes)) {
            leads = leadsRes;
          } else if ('top_leads' in leadsRes && Array.isArray(leadsRes.top_leads)) {
            leads = leadsRes.top_leads;
          }
        }

        if (leads.length > 0) {
          setTopLead(leads[0]);
          setTopLeadsList(leads.slice(0, 5));
        }
        
        if (alertsData && Array.isArray(alertsData)) {
          setRecentAlerts(alertsData.slice(0, 5));
        }
      } catch (err) {
        setError('Error al cargar los datos del dashboard.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const getAlertBadgeClass = (type: string) => {
    switch(type) {
      case 'churn_risk': return 'badge-danger';
      case 'upsell_opportunity': return 'badge-success';
      case 'demand_spike': return 'badge-warning';
      default: return 'badge-purple';
    }
  };

  const getAlertLabel = (type: string) => {
    switch(type) {
      case 'churn_risk': return 'Riesgo Churn';
      case 'upsell_opportunity': return 'Oportunidad';
      case 'demand_spike': return 'Pico Demanda';
      default: return 'Alerta IA';
    }
  };

  // Helper to parse simple markdown bold **text** into JSX strong elements
  const formatMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-secondary flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
        <p className="font-medium text-sm">Cargando Dashboard Ejecutivo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {error && (
        <div className="alert-banner alert-banner-danger">
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-red-500" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Dashboard Ejecutivo</h1>
          <p className="text-xs text-secondary mt-0.5">
            Visibilidad 360° de finanzas, inventario e inteligencia comercial.
          </p>
        </div>
        {topLead && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs text-purple-700 dark:text-purple-300">
            <IconBrain size={18} className="text-purple-500 shrink-0" />
            <span>
              <strong>Lead Top:</strong> {topLead.name} <span className="opacity-75 font-mono">({topLead.probability_percentage}%)</span>
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
         BLOQUE 1: FINANZAS DEL MES
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconCash size={16} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Finanzas del Mes
            </h2>
          </div>
          <Link to="/accounting" className="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
            <span>Ver detalle contable</span>
            <IconChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingresos */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Ingresos / Ventas</div>
                <div className="stat-value text-emerald-600 dark:text-emerald-400">
                  {accountingDash ? formatCOP(accountingDash.month_income) : '$0'}
                </div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--accent-success)' }}>
                <IconTrendingUp size={22} />
              </div>
            </div>
            <div className="text-[11px] text-muted">Facturas DIAN emitidas</div>
          </div>

          {/* Gastos */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Gastos Operativos</div>
                <div className="stat-value text-red-600 dark:text-red-400">
                  {accountingDash ? formatCOP(accountingDash.month_expenses) : '$0'}
                </div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--accent-danger)' }}>
                <IconTrendingDown size={22} />
              </div>
            </div>
            <div className="text-[11px] text-muted">Compras a proveedores + Fijos</div>
          </div>

          {/* Utilidad Neta */}
          <div className="stat-card" style={{ borderLeft: `4px solid ${accountingDash?.is_profitable ? 'var(--accent-primary)' : 'var(--accent-warning)'}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Utilidad Neta</div>
                <div className={`stat-value ${accountingDash?.is_profitable ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {accountingDash ? formatCOP(accountingDash.month_net_profit) : '$0'}
                </div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-info-bg)', color: 'var(--accent-primary)' }}>
                <IconReceipt2 size={22} />
              </div>
            </div>
            <div>
              <span className={`badge ${accountingDash?.is_profitable ? 'badge-success' : 'badge-danger'}`}>
                {accountingDash?.is_profitable ? '✅ Rentable' : '⚠️ Déficit'}
              </span>
            </div>
          </div>

          {/* Facturas Emitidas */}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--border-strong)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Facturas Emitidas</div>
                <div className="stat-value">{invoicesCount}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <IconFileInvoice size={22} />
              </div>
            </div>
            <div className="text-[11px] text-muted">Total acumulado en el mes</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         BLOQUE 2: INVENTARIO & BODEGA
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconPackages size={16} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Inventario & Bodega
            </h2>
          </div>
          <Link to="/inventory" className="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
            <span>Gestionar productos</span>
            <IconChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div>
              <div className="stat-label">Catálogo Activo</div>
              <div className="stat-value">{inventoryDash?.total_products || 0} SKUs</div>
            </div>
            <div className="text-[11px] text-muted font-medium">
              {inventoryDash?.total_units_in_stock || 0} unidades físicas en bodega
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Valor Activos en Bodega</div>
              <div className="stat-value text-indigo-600 dark:text-indigo-400">
                {inventoryDash ? formatCOP(inventoryDash.total_inventory_value) : '$0'}
              </div>
            </div>
            <div className="text-[11px] text-muted">Valuación a costo de compra</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-label">Alertas de Stock Bajo</div>
                <div className="stat-value text-amber-600 dark:text-amber-400">
                  {inventoryDash?.low_stock_count || 0}
                </div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--accent-warning)' }}>
                <IconAlertTriangle size={22} />
              </div>
            </div>
            <div>
              {inventoryDash && inventoryDash.low_stock_count > 0 ? (
                <Link to="/purchases" className="btn btn-sm btn-warning mt-1 flex items-center gap-1.5 font-semibold text-xs py-1 px-2.5 shadow-xs">
                  <IconShoppingCart size={14} />
                  <span>Reponer stock crítico</span>
                </Link>
              ) : (
                <span className="text-[11px] text-muted">Niveles de stock óptimos</span>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        {inventoryDash && inventoryDash.low_stock_items.length > 0 && (
          <div className="alert-banner alert-banner-warning">
            <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
              <IconAlertTriangle size={18} className="text-amber-500 shrink-0" />
              <span>
                <strong>Atención requerida:</strong> {inventoryDash.low_stock_items.map(i => `${i.name} (${i.current_stock} unids)`).join(', ')} están por debajo del stock mínimo.
              </span>
            </div>
            <Link to="/purchases" className="btn btn-sm btn-primary shrink-0">
              <IconShoppingCart size={15} />
              <span>+ Crear Compra</span>
            </Link>
          </div>
        )}
      </div>

      {/* =========================================================================
         BLOQUE 3: INTELIGENCIA ARTIFICIAL & CRM
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <IconBrain size={16} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Inteligencia Artificial & Leads
            </h2>
          </div>
          <Link to="/ml" className="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold">
            <span>Ver Motor ML completo</span>
            <IconChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Leads Ranking Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="font-bold text-sm text-primary">Top Contactos con Mayor Probabilidad</h3>
                <span className="text-[11px] text-muted">Lead Scoring predictivo ({contactsCount} contactos)</span>
              </div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Probabilidad</th>
                    <th>Motivo de IA</th>
                  </tr>
                </thead>
                <tbody>
                  {topLeadsList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-secondary text-sm">
                        No hay suficientes datos registrados para calcular ranking.
                      </td>
                    </tr>
                  ) : (
                    topLeadsList.map((lead) => {
                      const probClean = String(lead.probability_percentage).replace('%', '');
                      return (
                        <tr key={lead.contact_id}>
                          <td>
                            <div className="font-semibold text-sm text-primary">{lead.name}</div>
                            {lead.phone && (
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5 font-mono">
                                <IconPhone size={12} />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-xs font-mono text-primary w-9">{probClean}%</span>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                                  style={{ width: `${probClean}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="text-xs text-secondary max-w-xs">{lead.reason}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent ML Alerts Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="font-bold text-sm text-primary">Alertas Predictivas</h3>
                <span className="text-[11px] text-muted">Diagnósticos generados por los modelos</span>
              </div>
            </div>
            <div className="card-body p-3.5">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm">
                  No hay alertas pendientes del Motor ML.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 rounded-xl border border-default bg-surface hover:border-strong transition-colors shadow-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`badge ${getAlertBadgeClass(alert.alert_type)}`}>
                          {getAlertLabel(alert.alert_type)}
                        </span>
                        <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                          <IconClock size={12} />
                          {new Date(alert.generated_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                      <div className="text-xs text-secondary leading-relaxed">
                        {formatMarkdownText(alert.message)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
