import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { MlAlert, LeadScoreItem, DemandForecastItem } from '../types';
import { 
  IconBell, 
  IconStar, 
  IconTrendingUp, 
  IconAlertCircle, 
  IconCheck, 
  IconPlayerPlay, 
  IconBrain,
  IconClock,
  IconFlame,
  IconSparkles
} from '@tabler/icons-react';

interface LeadRankingApiResponse {
  total_leads_analyzed: number;
  top_leads: LeadScoreItem[];
  generated_at: string;
}

interface DemandForecastApiResponse {
  forecast_horizon_days: number;
  predictions: DemandForecastItem[];
  generated_at: string;
}

export default function MlEngine() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'leads' | 'forecast'>('alerts');
  
  const [alerts, setAlerts] = useState<MlAlert[]>([]);
  const [leads, setLeads] = useState<LeadScoreItem[]>([]);
  const [forecast, setForecast] = useState<DemandForecastItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

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

  const fetchData = async (tab: string) => {
    setIsLoading(true);
    setError('');
    try {
      if (tab === 'alerts') {
        const data = await api.get<MlAlert[]>('/ml/alerts');
        setAlerts(data || []);
      } else if (tab === 'leads') {
        const res = await api.get<LeadRankingApiResponse | LeadScoreItem[]>('/ml/leads/ranking');
        if (Array.isArray(res)) {
          setLeads(res);
        } else if (res && 'top_leads' in res) {
          setLeads(res.top_leads || []);
        }
      } else if (tab === 'forecast') {
        const res = await api.get<DemandForecastApiResponse | DemandForecastItem[]>('/ml/forecast');
        if (Array.isArray(res)) {
          setForecast(res);
        } else if (res && 'predictions' in res) {
          setForecast(res.predictions || []);
        }
      }
    } catch {
      setError('Error al cargar datos del motor ML');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/ml/alerts/${id}/read`);
      fetchData('alerts');
    } catch {
      alert('Error al actualizar alerta');
    }
  };

  const handleTriggerPipeline = async () => {
    setIsTriggering(true);
    try {
      await api.post('/ml/trigger');
      alert('Pipeline de ML ejecutado exitosamente. Se han actualizado las predicciones y alertas.');
      fetchData(activeTab);
    } catch {
      alert('Error al ejecutar pipeline de ML');
    } finally {
      setIsTriggering(false);
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'churn_risk':
        return <span className="badge badge-danger">Riesgo Churn</span>;
      case 'upsell_opportunity':
        return <span className="badge badge-success">Oportunidad Venta</span>;
      case 'hot_lead':
        return <span className="badge badge-success">Lead Caliente</span>;
      case 'demand_spike':
        return <span className="badge badge-warning">Pico Demanda</span>;
      case 'demand_forecast':
        return <span className="badge badge-info">Proyección Demanda</span>;
      default:
        return <span className="badge badge-purple">{type.replace('_', ' ')}</span>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'churn_risk':
        return (
          <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
            <IconAlertCircle size={20} />
          </div>
        );
      case 'hot_lead':
        return (
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <IconFlame size={20} />
          </div>
        );
      case 'upsell_opportunity':
        return (
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
            <IconSparkles size={20} />
          </div>
        );
      case 'demand_spike':
      case 'demand_forecast':
        return (
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <IconTrendingUp size={20} />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <IconBrain size={20} />
          </div>
        );
    }
  };

  const getScoreBadge = (score: number | string) => {
    const num = typeof score === 'number' ? score : parseFloat(String(score));
    const formatted = typeof score === 'number' ? score.toFixed(1) : score;
    if (isNaN(num)) {
      return <span className="badge badge-info font-mono font-bold">{score}</span>;
    }
    if (num >= 80 || (num <= 10 && num >= 8)) {
      return <span className="badge badge-success font-mono font-bold">{formatted}</span>;
    } else if (num >= 50 || (num <= 10 && num >= 5)) {
      return <span className="badge badge-warning font-mono font-bold">{formatted}</span>;
    } else {
      return <span className="badge badge-danger font-mono font-bold">{formatted}</span>;
    }
  };

  const getProbabilityBadge = (prob: number | string) => {
    const num = typeof prob === 'number' ? prob : parseFloat(String(prob));
    const display = typeof prob === 'number' ? `${prob}%` : String(prob).includes('%') ? prob : `${prob}%`;
    if (isNaN(num) || num >= 70) {
      return <span className="badge badge-success font-mono font-bold">{display}</span>;
    } else if (num >= 40) {
      return <span className="badge badge-warning font-mono font-bold">{display}</span>;
    } else {
      return <span className="badge badge-danger font-mono font-bold">{display}</span>;
    }
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-7">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <IconBrain size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Motor de Inteligencia Artificial (ML)</h1>
            <p className="text-xs text-secondary mt-0.5">
              Modelos de Scoring de Leads, Predicción de Demanda a 14 días y Detección de Anomalías
            </p>
          </div>
        </div>
        <button 
          className="btn btn-secondary btn-sm flex items-center gap-2" 
          onClick={handleTriggerPipeline} 
          disabled={isTriggering}
          title="Entrenar y ejecutar modelos de ML ahora"
        >
          <IconPlayerPlay size={16} className={isTriggering ? 'animate-spin text-indigo-600 dark:text-indigo-400' : 'text-indigo-600 dark:text-indigo-400'} />
          <span>{isTriggering ? 'Ejecutando Modelos...' : 'Ejecutar Batch ML'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="segmented-control">
        <button 
          className={`segmented-item ${activeTab === 'alerts' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <IconBell size={16} />
          <span>Alertas de IA</span>
          {unreadAlertsCount > 0 && (
            <span className="segmented-item-badge">{unreadAlertsCount}</span>
          )}
        </button>
        <button 
          className={`segmented-item ${activeTab === 'leads' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <IconStar size={16} />
          <span>Lead Scoring Predictivo</span>
          {leads.length > 0 && (
            <span className="segmented-item-badge">{leads.length}</span>
          )}
        </button>
        <button 
          className={`segmented-item ${activeTab === 'forecast' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <IconTrendingUp size={16} />
          <span>Forecast 14 Días</span>
          {forecast.length > 0 && (
            <span className="segmented-item-badge">{forecast.length}</span>
          )}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="card overflow-hidden">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="py-16 text-center text-secondary flex flex-col items-center justify-center gap-3">
              <div className="animate-spin w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
              <p className="font-medium text-sm">Cargando datos del motor ML...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-secondary flex flex-col items-center justify-center gap-2">
              <IconAlertCircle size={40} className="text-red-500" />
              <p className="font-medium text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button className="btn btn-secondary btn-sm mt-2" onClick={() => fetchData(activeTab)}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Tab: Alertas */}
              {activeTab === 'alerts' && (
                <div>
                  {alerts.length === 0 ? (
                    <div className="py-12 text-center text-secondary text-sm flex flex-col items-center justify-center gap-2">
                      <IconCheck size={36} className="text-emerald-500 opacity-60" />
                      <p className="font-medium">No hay alertas en este momento</p>
                      <p className="text-xs text-muted">Todos los sistemas y prospectos operan dentro de parámetros normales</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-default)]">
                      {alerts.map(alert => (
                        <div 
                          key={alert.id} 
                          className={`px-4 py-3 border-b border-[var(--border-default)] flex items-center gap-3 transition-colors ${
                            alert.is_read ? 'bg-transparent' : 'bg-[var(--bg-elevated)]'
                          }`}
                        >
                          {getAlertIcon(alert.alert_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {getAlertBadge(alert.alert_type)}
                              {alert.generated_at && (
                                <span className="text-xs text-muted flex items-center gap-1 font-mono">
                                  <IconClock size={12} />
                                  {new Date(alert.generated_at).toLocaleString('es-CO')}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-primary leading-relaxed">
                              {formatMarkdownText(alert.message)}
                            </div>
                          </div>
                          {!alert.is_read && (
                            <button 
                              className="btn btn-sm btn-secondary flex items-center gap-1.5 shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold shadow-xs" 
                              onClick={() => handleMarkAsRead(alert.id)}
                              title="Marcar como leída"
                            >
                              <IconCheck size={15} />
                              <span className="hidden sm:inline">Marcar Leída</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Lead Scoring */}
              {activeTab === 'leads' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre Contacto</th>
                        <th>Teléfono</th>
                        <th>Etapa Funnel</th>
                        <th>Probabilidad de Cierre</th>
                        <th>Score ML</th>
                        <th>Explicabilidad / Razón</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-secondary text-sm">
                            No hay prospectos analizados
                          </td>
                        </tr>
                      ) : (
                        leads.map(lead => (
                          <tr key={lead.contact_id}>
                            <td className="font-semibold text-primary">{lead.name}</td>
                            <td className="font-mono text-xs text-secondary">{lead.phone || '-'}</td>
                            <td>
                              <span className="badge badge-info">{lead.funnel_stage || 'lead'}</span>
                            </td>
                            <td>{getProbabilityBadge(lead.probability_percentage)}</td>
                            <td>{getScoreBadge(lead.score)}</td>
                            <td className="text-xs text-secondary">{lead.reason || 'Comportamiento de compra activo'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab: Forecast 14 Días */}
              {activeTab === 'forecast' && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Producto / Servicio</th>
                        <th>Stock Actual</th>
                        <th>Demanda Estimada (14 días)</th>
                        <th>Acción Recomendada</th>
                        <th>Nivel de Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-secondary text-sm">
                            No hay datos de forecast disponibles
                          </td>
                        </tr>
                      ) : (
                        forecast.map((item, idx) => (
                          <tr key={idx}>
                            <td className="font-mono font-semibold text-primary">{item.item_sku}</td>
                            <td className="text-sm font-medium text-primary">{item.item_name}</td>
                            <td>
                              <span className="font-mono font-bold text-primary">{item.current_stock}</span>
                              <span className="text-xs text-secondary ml-1">uds</span>
                            </td>
                            <td>
                              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                {item.predicted_demand_14d}
                              </span>
                              <span className="text-xs text-secondary ml-1">uds</span>
                            </td>
                            <td>
                              <span className={`badge ${
                                item.recommended_action?.toLowerCase().includes('reorden') || item.recommended_action?.toLowerCase().includes('compra')
                                  ? 'badge-warning'
                                  : item.recommended_action?.toLowerCase().includes('promoc') || item.recommended_action?.toLowerCase().includes('liquid')
                                  ? 'badge-purple'
                                  : 'badge-info'
                              }`}>
                                {item.recommended_action}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                item.confidence_level?.toLowerCase().includes('alta') || item.confidence_level?.toLowerCase().includes('high')
                                  ? 'badge-success'
                                  : item.confidence_level?.toLowerCase().includes('media') || item.confidence_level?.toLowerCase().includes('medium')
                                  ? 'badge-info'
                                  : 'badge-warning'
                              }`}>
                                {item.confidence_level}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
