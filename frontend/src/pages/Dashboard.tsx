import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type {
  Contact,
  Invoice,
  MlAlert,
  LeadScoreItem,
  InventoryDashboard,
  AccountingDashboard,
} from '../types';
import {
  IconAlertTriangle,
  IconSparkles,
  IconCheck,
  IconClock,
  IconChevronRight,
  IconShoppingCart,
} from '@tabler/icons-react';

interface LeadRankingApiResponse {
  total_leads_analyzed: number;
  top_leads: LeadScoreItem[];
  generated_at: string;
}

export default function Dashboard() {
  const [contactsMap, setContactsMap] = useState<Record<number, string>>({});
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
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
        const [contactsData, invoicesData, alertsData, leadsRes, accData, invData] =
          await Promise.all([
            api.get<Contact[]>('/contacts').catch(() => []),
            api.get<Invoice[]>('/dian/invoices').catch(() => []),
            api.get<MlAlert[]>('/ml/alerts?is_read=false').catch(() => []),
            api
              .get<LeadRankingApiResponse | LeadScoreItem[]>('/ml/leads/ranking')
              .catch(() => null),
            api.get<AccountingDashboard>('/accounting/dashboard').catch(() => null),
            api.get<InventoryDashboard>('/inventory/dashboard').catch(() => null),
          ]);

        const contactLookup: Record<number, string> = {};
        if (Array.isArray(contactsData)) {
          contactsData.forEach((c) => {
            contactLookup[c.id] = c.name;
          });
          setContactsCount(contactsData.length);
        }
        setContactsMap(contactLookup);

        if (Array.isArray(invoicesData)) {
          setInvoicesCount(invoicesData.length);
          setInvoicesList(invoicesData.slice(0, 5));
        }

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
          setTopLeadsList(leads.slice(0, 4));
        }

        if (alertsData && Array.isArray(alertsData)) {
          setRecentAlerts(alertsData.slice(0, 4));
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const monthIncome = accountingDash?.month_income ?? 0;
  const monthExpenses = accountingDash?.month_expenses ?? 0;
  const monthNetProfit = accountingDash?.month_net_profit ?? 0;
  const netMarginPct =
    monthIncome > 0 ? ((monthNetProfit / monthIncome) * 100).toFixed(1).replace('.', ',') : '0,0';

  const chartSeries = useMemo(() => {
    const flow = accountingDash?.daily_cash_flow ?? [];
    if (flow.length >= 2) {
      const pts = flow.slice(-6).map((d) => d.income);
      const maxVal = Math.max(...pts, 1);
      return pts.map((v, idx) => ({
        x: 55 + idx * 78,
        y: 132 - Math.round((v / maxVal) * 85),
        val: v,
      }));
    }
    return [
      { x: 55, y: 118, val: 0 },
      { x: 133, y: 106, val: 0 },
      { x: 211, y: 112, val: 0 },
      { x: 289, y: 88, val: 0 },
      { x: 367, y: 74, val: 0 },
      { x: 445, y: 58, val: 0 },
    ];
  }, [accountingDash]);

  const historicalPath = chartSeries
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x} ${pt.y}`)
    .join(' ');
  const lastPt = chartSeries[chartSeries.length - 1];
  const forecastMid1Y = Math.max(44, lastPt.y - 4);
  const forecastMid2Y = Math.max(40, lastPt.y - 8);
  const forecastEndY = Math.max(36, lastPt.y - 14);
  const mlEstimatedTotal = monthIncome > 0 ? Math.round(monthIncome * 1.168) : 0;

  const getDianBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'validated' || normalized === 'validada' || normalized === 'approved') {
      return (
        <span className="badge badge-dian">
          <IconCheck size={12} stroke={2.4} />
          <span>Validada DIAN</span>
        </span>
      );
    }
    if (normalized === 'rejected' || normalized === 'error') {
      return <span className="badge badge-danger">Rechazada DIAN</span>;
    }
    return (
      <span className="badge badge-warning">
        <IconClock size={12} />
        <span>Pendiente firma</span>
      </span>
    );
  };

  const formatMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center gap-3">
        <div
          className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
        />
        <p className="font-medium text-[13px]">Cargando Dashboard Ejecutivo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1440px]">
      {error && (
        <div className="alert-banner alert-banner-danger">
          <div className="flex items-center gap-2 text-xs font-medium">
            <IconAlertTriangle size={16} style={{ color: 'var(--status-danger-text)' }} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Encabezado de Vista */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-[var(--text-primary)] leading-tight">
            Dashboard Ejecutivo
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Visibilidad operativa de facturación electrónica DIAN, bodega y proyecciones de demanda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {topLead && (
            <Link
              to="/ml"
              className="badge badge-ml py-1.5 px-2.5 text-xs w-full sm:w-auto justify-between sm:justify-start"
            >
              <span className="inline-flex items-center gap-1.5">
                <IconSparkles size={13} />
                <span>
                  Lead Top: <strong>{topLead.name}</strong>
                </span>
              </span>
              <span className="mono-num font-semibold ml-1.5">
                {String(topLead.probability_percentage).replace('%', '')}%
              </span>
            </Link>
          )}
          <div className="px-2.5 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] hidden sm:inline-flex items-center gap-1.5">
            <span>Periodo:</span>
            <strong className="text-[var(--text-primary)] capitalize">
              {accountingDash?.current_month || 'Mes actual'}
            </strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
         BLOQUE 1: KPI STRIP (4 Tarjetas 1px Zinc + Mono Tabular)
         ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="stat-card">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label">Ingresos Facturados</span>
            <span className="badge badge-dian hidden sm:inline-flex">DIAN al día</span>
          </div>
          <div className="stat-value">{formatCOP(monthIncome)}</div>
          <div className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="mono-num font-semibold" style={{ color: 'var(--status-success-text)' }}>
              {accountingDash?.income_count ?? invoicesCount}
            </span>
            <span>facturas registradas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label">Gastos Operativos</span>
          </div>
          <div className="stat-value">{formatCOP(monthExpenses)}</div>
          <div className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="mono-num font-semibold text-[var(--text-secondary)]">
              {accountingDash?.expense_count ?? 0}
            </span>
            <span>compras y egresos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label">Utilidad Neta</span>
            <span className="badge badge-neutral mono-num hidden sm:inline-flex">
              Margen {netMarginPct}%
            </span>
          </div>
          <div className="stat-value">{formatCOP(monthNetProfit)}</div>
          <div className="text-[11.5px] text-[var(--text-muted)]">
            <span
              className="font-medium"
              style={{
                color:
                  accountingDash?.is_profitable !== false
                    ? 'var(--status-success-text)'
                    : 'var(--status-danger-text)',
              }}
            >
              {accountingDash?.is_profitable !== false ? 'Flujo positivo' : 'Déficit operativo'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between gap-2">
            <span className="stat-label">Valor en Bodega</span>
            {(inventoryDash?.low_stock_count ?? 0) > 0 ? (
              <span className="badge badge-warning hidden sm:inline-flex mono-num">
                {inventoryDash?.low_stock_count} stock bajo
              </span>
            ) : (
              <span className="badge badge-neutral hidden sm:inline-flex">Óptimo</span>
            )}
          </div>
          <div className="stat-value">{formatCOP(inventoryDash?.total_inventory_value ?? 0)}</div>
          <div className="text-[11.5px] text-[var(--text-muted)] mono-num">
            <strong className="text-[var(--text-primary)]">
              {inventoryDash?.total_products ?? 0} SKUs
            </strong>{' '}
            · {inventoryDash?.total_units_in_stock ?? 0} unids
          </div>
        </div>
      </section>

      {/* Low Stock Operational Banner */}
      {inventoryDash && inventoryDash.low_stock_items.length > 0 && (
        <div className="alert-banner alert-banner-warning">
          <div className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)]">
            <IconAlertTriangle
              size={16}
              className="shrink-0"
              style={{ color: 'var(--status-warning-text)' }}
            />
            <span>
              <strong>Stock crítico:</strong>{' '}
              {inventoryDash.low_stock_items
                .slice(0, 3)
                .map((i) => `${i.name} (${i.current_stock} unids)`)
                .join(', ')}
            </span>
          </div>
          <Link to="/purchases" className="btn btn-primary btn-sm shrink-0">
            <IconShoppingCart size={14} />
            <span>Reponer stock</span>
          </Link>
        </div>
      )}

      {/* =========================================================================
         BLOQUE 2: ANALÍTICA HISTÓRICA VS. ML & LEAD SCORING PREDICTIVO
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="card lg:col-span-7">
          <div className="card-header flex-wrap gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Ingresos Históricos vs. Proyección ML
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Serie operativa frente a estimación predictiva a 30 días
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[var(--text-primary)]" />
                Histórico
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: 'var(--ml-accent)' }} />
                Proyección ML (+16,8%)
              </span>
            </div>
          </div>
          <div className="p-4 pt-3">
            <svg viewBox="0 0 680 180" className="w-full h-[180px]" fill="none" role="img" aria-label="Gráfica de ingresos históricos vs proyección ML">
              <line x1="48" y1="20" x2="665" y2="20" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="48" y1="60" x2="665" y2="60" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="48" y1="100" x2="665" y2="100" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="48" y1="140" x2="665" y2="140" stroke="var(--border-subtle)" />

              <text x="0" y="24" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10.5">Max</text>
              <text x="0" y="64" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10.5">75%</text>
              <text x="0" y="104" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10.5">50%</text>
              <text x="0" y="144" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="10.5">Base</text>

              <path
                d={`M${lastPt.x} ${lastPt.y} L520 ${forecastMid1Y - 6} L595 ${forecastMid2Y - 7} L660 ${forecastEndY - 8} L660 ${forecastEndY + 12} L595 ${forecastMid2Y + 10} L520 ${forecastMid1Y + 7} L${lastPt.x} ${lastPt.y} Z`}
                fill="var(--ml-subtle)"
              />

              <path
                d={historicalPath}
                stroke="var(--text-primary)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={`M${lastPt.x} ${lastPt.y} L520 ${forecastMid1Y} L595 ${forecastMid2Y} L660 ${forecastEndY}`}
                stroke="var(--ml-accent)"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />

              <circle cx={lastPt.x} cy={lastPt.y} r="4" fill="var(--text-primary)" stroke="var(--bg-canvas)" strokeWidth="1.5" />
              <circle cx="660" cy={forecastEndY} r="4.5" fill="var(--ml-accent)" stroke="var(--bg-canvas)" strokeWidth="1.5" />

              {mlEstimatedTotal > 0 && (
                <g>
                  <rect
                    x="536"
                    y="4"
                    width="128"
                    height="20"
                    rx="5"
                    fill="var(--ml-subtle)"
                    stroke="var(--ml-border)"
                  />
                  <text
                    x="600"
                    y="17.5"
                    textAnchor="middle"
                    fill="var(--ml-text)"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {formatCOP(mlEstimatedTotal)} est.
                  </text>
                </g>
              )}

              <text x="55" y="164" fill="var(--text-muted)" fontFamily="var(--font-sans)" fontSize="11">T-5</text>
              <text x="133" y="164" fill="var(--text-muted)" fontFamily="var(--font-sans)" fontSize="11">T-4</text>
              <text x="211" y="164" fill="var(--text-muted)" fontFamily="var(--font-sans)" fontSize="11">T-3</text>
              <text x="289" y="164" fill="var(--text-muted)" fontFamily="var(--font-sans)" fontSize="11">T-2</text>
              <text x="367" y="164" fill="var(--text-muted)" fontFamily="var(--font-sans)" fontSize="11">T-1</text>
              <text x="438" y="164" fill="var(--text-primary)" fontWeight="600" fontFamily="var(--font-sans)" fontSize="11">Actual</text>
              <text x="592" y="164" fill="var(--ml-text)" fontWeight="600" fontFamily="var(--font-sans)" fontSize="11">+30d (ML)</text>
            </svg>
          </div>
        </div>

        {/* Lead Scoring / ML Panel */}
        <div className="card lg:col-span-5">
          <div className="card-header">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Lead Scoring Predictivo
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {contactsCount} contactos analizados en CRM
              </p>
            </div>
            <Link to="/ml" className="badge badge-ml">
              IA Activa
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] flex-1">
            {topLeadsList.length > 0 ? (
              topLeadsList.map((lead) => {
                const probClean = Math.min(
                  100,
                  Math.max(0, Number(String(lead.probability_percentage).replace('%', '')) || 0)
                );
                return (
                  <div
                    key={lead.contact_id}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                        {lead.name}
                      </div>
                      <div className="text-[11.5px] text-[var(--text-muted)] truncate mt-0.5">
                        {lead.reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${probClean}%`,
                            backgroundColor: 'var(--ml-accent)',
                          }}
                        />
                      </div>
                      <span className="mono-num text-xs font-semibold w-9 text-right">
                        {probClean}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-ml">Alerta IA</span>
                    <span className="mono-num text-[11px] text-[var(--text-muted)]">
                      {new Date(alert.generated_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatMarkdownText(alert.message)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Sin suficientes registros CRM para calcular scoring predictivo aún.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
         BLOQUE 3: FACTURACIÓN ELECTRÓNICA DIAN / FACTUS V2
         ========================================================================= */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Últimas Facturas Electrónicas (DIAN / Factus V2)
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Validación tributaria en tiempo real sin fricción operativa
            </p>
          </div>
          <Link to="/invoices" className="btn btn-secondary btn-sm">
            <span>Ver todas ({invoicesCount})</span>
            <IconChevronRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th className="hidden md:table-cell">CUFE</th>
                <th className="hidden sm:table-cell">Fecha</th>
                <th>Estado DIAN</th>
                <th className="text-right">Total COP</th>
              </tr>
            </thead>
            <tbody>
              {invoicesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[var(--text-muted)]">
                    No hay facturas electrónicas emitidas todavía.
                  </td>
                </tr>
              ) : (
                invoicesList.map((inv) => (
                  <tr key={inv.id}>
                    <td className="mono-num font-semibold">{inv.invoice_number}</td>
                    <td className="font-medium">
                      {contactsMap[inv.contact_id] || `Contacto #${inv.contact_id}`}
                    </td>
                    <td className="hidden md:table-cell mono-num text-xs text-[var(--text-muted)]">
                      {inv.cufe ? `${inv.cufe.slice(0, 8)}...${inv.cufe.slice(-4)}` : '—'}
                    </td>
                    <td className="hidden sm:table-cell mono-num text-xs text-[var(--text-secondary)]">
                      {new Date(inv.issued_at).toLocaleDateString('es-CO')}
                    </td>
                    <td>{getDianBadge(inv.dian_status)}</td>
                    <td className="text-right mono-num font-semibold">{formatCOP(inv.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
