import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  IconFileInvoice, 
  IconFileText,
  IconReceipt2, 
  IconPackages, 
  IconShoppingCart, 
  IconBrandWhatsapp, 
  IconFlame, 
  IconTrendingUp, 
  IconCheck, 
  IconAlertCircle, 
  IconApps,
  IconSparkles,
  IconRefresh,
  IconSettings,
  IconX,
  IconCreditCard
} from '@tabler/icons-react';
import { moduleService } from '../services/moduleService';
import { useAuth } from '../context/AuthContext';
import type { ModuleStatus, ModuleSettingValue } from '../types';

export default function Modules() {
  const { updateEnabledModules } = useAuth();
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [totalActive, setTotalActive] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Configuración por módulo (module_settings)
  const [configuringModule, setConfiguringModule] = useState<ModuleStatus | null>(null);
  const [formSettings, setFormSettings] = useState<Record<string, ModuleSettingValue>>({});
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await moduleService.getModules();
      setModules(res.modules);
      setTotalActive(res.total_active);
    } catch (err: unknown) {
      console.error(err);
      setFeedback({ type: 'error', message: 'No se pudo cargar el catálogo de módulos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggle = async (mod: ModuleStatus) => {
    setTogglingSlug(mod.slug);
    setFeedback(null);
    try {
      const res = await moduleService.toggleModule(mod.slug, !mod.is_enabled);
      setFeedback({ type: 'success', message: res.message });
      // Actualizar inmediatamente el AuthContext para que el Sidebar responda sin recargar
      updateEnabledModules(res.enabled_modules);
      await fetchModules();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Error al cambiar el estado del módulo.';
      setFeedback({ type: 'error', message: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
    } finally {
      setTogglingSlug(null);
    }
  };

  const handleOpenConfig = async (mod: ModuleStatus) => {
    setConfiguringModule(mod);
    setFormSettings({ ...(mod.settings || {}) });
    try {
      const res = await moduleService.getModuleSettings(mod.slug);
      setFormSettings(res.settings || {});
    } catch {
      // Usa settings precargados del catálogo si falla recarga puntual
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!configuringModule) return;
    setSavingSettings(true);
    setFeedback(null);
    try {
      const res = await moduleService.updateModuleSettings(configuringModule.slug, formSettings);
      setFeedback({ type: 'success', message: res.message });
      setConfiguringModule(null);
      await fetchModules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la configuración del módulo.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSavingSettings(false);
    }
  };

  const setSettingVal = (key: string, value: ModuleSettingValue) => {
    setFormSettings(prev => ({ ...prev, [key]: value }));
  };

  const getModuleIcon = (iconName: string) => {
    const props = { size: 24, className: "shrink-0" };
    switch (iconName) {
      case 'IconFileInvoice':
        return <IconFileInvoice {...props} />;
      case 'IconFileText':
        return <IconFileText {...props} />;
      case 'IconReceipt2':
        return <IconReceipt2 {...props} />;
      case 'IconPackages':
        return <IconPackages {...props} />;
      case 'IconShoppingCart':
        return <IconShoppingCart {...props} />;
      case 'IconBrandWhatsapp':
        return <IconBrandWhatsapp {...props} />;
      case 'IconFlame':
        return <IconFlame {...props} />;
      case 'IconTrendingUp':
        return <IconTrendingUp {...props} />;
      default:
        return <IconApps {...props} />;
    }
  };

  const categories = ['all', ...Array.from(new Set(modules.map(m => m.category)))];

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <IconSparkles size={14} />
              Arquitectura Modular "A la Carta"
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Centro de Herramientas y Servicios
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Adapta el software exactamente al modelo de tu empresa. Activa únicamente las herramientas que utilizas y apaga las que no necesitas con un solo clic.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 shrink-0">
            <div className="text-center px-3">
              <span className="block text-2xl font-bold text-emerald-400">{totalActive}</span>
              <span className="text-xs text-slate-400">Activas</span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-3">
              <span className="block text-2xl font-bold text-slate-200">{modules.length}</span>
              <span className="text-xs text-slate-400">Disponibles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <IconCheck size={18} className="text-emerald-400 shrink-0" /> : <IconAlertCircle size={18} className="text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-xs opacity-70 hover:opacity-100 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filtros de Categoría */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            {cat === 'all' ? 'Todos los Módulos' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Tarjetas de Módulos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <IconRefresh size={32} className="animate-spin text-indigo-400" />
          <p className="text-sm">Cargando herramientas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((mod) => {
            const isToggling = togglingSlug === mod.slug;
            return (
              <div 
                key={mod.slug}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                  mod.is_enabled
                    ? 'bg-slate-900/80 border-indigo-500/30 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-900/30 border-slate-800/80 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Top Bar: Icono + Categoría + Estado */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      mod.is_enabled 
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700/40'
                    }`}>
                      {getModuleIcon(mod.icon)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/40">
                        {mod.category}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        mod.is_enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {mod.is_enabled ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Nombre y Descripción */}
                  <h3 className="font-semibold text-base text-slate-100 mb-1.5">
                    {mod.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                {/* Footer: Dependencias y Switch Toggle */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {mod.dependencies.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <IconAlertCircle size={14} className="text-amber-400 shrink-0" />
                      <span>Requiere: <strong>{mod.dependencies.map(d => modules.find(m => m.slug === d)?.name || d).join(', ')}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenConfig(mod)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                      title={`Configurar ajustes de ${mod.name}`}
                    >
                      <IconSettings size={14} className="text-indigo-400" />
                      <span>Configurar</span>
                    </button>

                    <button
                      onClick={() => handleToggle(mod)}
                      disabled={isToggling}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer disabled:opacity-50 ${
                        mod.is_enabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                      aria-label={`Alternar ${mod.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mod.is_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Configuración de Módulo (module_settings) */}
      {configuringModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {getModuleIcon(configuringModule.icon)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Configurar: {configuringModule.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ajustes independientes por empresa guardados en <span className="font-mono">module_settings</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringModule(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              {configuringModule.slug === 'dian_invoicing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Prefijo Autorizado DIAN</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={String(formSettings.prefix ?? 'SETT')}
                        onChange={(e) => setSettingVal('prefix', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Resolución DIAN #</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={String(formSettings.resolution_number ?? '')}
                        onChange={(e) => setSettingVal('resolution_number', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Rango Desde</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.numbering_range_from ?? 1)}
                        onChange={(e) => setSettingVal('numbering_range_from', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Rango Hasta</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.numbering_range_to ?? 5000)}
                        onChange={(e) => setSettingVal('numbering_range_to', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Ambiente Factus</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        value={String(formSettings.environment ?? 'sandbox')}
                        onChange={(e) => setSettingVal('environment', e.target.value)}
                      >
                        <option value="sandbox">Sandbox (Pruebas)</option>
                        <option value="production">Producción DIAN</option>
                      </select>
                    </div>
                  </div>

                  {/* Sección Factus Pay */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                        <IconCreditCard size={16} />
                        <span>Factus Pay — Pasarela y Links de Pago</span>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formSettings.factus_pay_enabled ?? true)}
                          onChange={(e) => setSettingVal('factus_pay_enabled', e.target.checked)}
                          className="rounded border-slate-600 text-indigo-600"
                        />
                        <span>Habilitado</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Merchant / Comercio ID</label>
                        <input
                          type="text"
                          placeholder="Ej: fpay_merchant_..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                          value={String(formSettings.factus_pay_merchant_id ?? '')}
                          onChange={(e) => setSettingVal('factus_pay_merchant_id', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Método de Recaudo Preferido</label>
                        <select
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                          value={String(formSettings.default_payment_method ?? 'factus_pay')}
                          onChange={(e) => setSettingVal('default_payment_method', e.target.value)}
                        >
                          <option value="factus_pay">Factus Pay (Links / PSE / Tarjeta)</option>
                          <option value="transfer">Transferencia Bancaria</option>
                          <option value="cash">Efectivo / Caja</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {configuringModule.slug === 'quotes' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Vigencia por Defecto (días)</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.default_validity_days ?? 15)}
                        onChange={(e) => setSettingVal('default_validity_days', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">IVA por Defecto</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        value={Number(formSettings.default_tax_rate ?? 0.19)}
                        onChange={(e) => setSettingVal('default_tax_rate', Number(e.target.value))}
                      >
                        <option value={0.19}>19% (General)</option>
                        <option value={0.05}>5% (Especial)</option>
                        <option value={0}>0% (Exento)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">NIT de la Empresa</label>
                      <input
                        type="text"
                        placeholder="900.123.456-7"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        value={String(formSettings.company_nit ?? '')}
                        onChange={(e) => setSettingVal('company_nit', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono Comercial</label>
                      <input
                        type="text"
                        placeholder="+57 300 000 0000"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        value={String(formSettings.company_phone ?? '')}
                        onChange={(e) => setSettingVal('company_phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Términos y Condiciones Predeterminados</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      value={String(formSettings.default_terms ?? '')}
                      onChange={(e) => setSettingVal('default_terms', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Información de Pago / Factus Pay</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      value={String(formSettings.bank_account_info ?? '')}
                      onChange={(e) => setSettingVal('bank_account_info', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {configuringModule.slug === 'accounting' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formSettings.auto_accounting_invoices ?? true)}
                      onChange={(e) => setSettingVal('auto_accounting_invoices', e.target.checked)}
                    />
                    <span>Registrar ingreso automáticamente al emitir Facturas DIAN</span>
                  </label>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Régimen Tributario</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                      value={String(formSettings.fiscal_regime ?? 'responsable_iva')}
                      onChange={(e) => setSettingVal('fiscal_regime', e.target.value)}
                    >
                      <option value="responsable_iva">Responsable de IVA</option>
                      <option value="no_responsable">No Responsable de IVA</option>
                      <option value="regimen_simple">Régimen Simple (RST)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ReteFuente Serv. (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.retefuente_services_pct ?? 4)}
                        onChange={(e) => setSettingVal('retefuente_services_pct', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ReteFuente Prod. (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.retefuente_products_pct ?? 2.5)}
                        onChange={(e) => setSettingVal('retefuente_products_pct', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ReteICA (%)</label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                        value={Number(formSettings.reteica_pct ?? 0.966)}
                        onChange={(e) => setSettingVal('reteica_pct', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {configuringModule.slug !== 'dian_invoicing' &&
                configuringModule.slug !== 'quotes' &&
                configuringModule.slug !== 'accounting' && (
                  <div className="space-y-3">
                    {Object.entries(formSettings).map(([key, val]) => (
                      <div key={key}>
                        {typeof val === 'boolean' ? (
                          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={val}
                              onChange={(e) => setSettingVal(key, e.target.checked)}
                            />
                            <span className="font-mono text-slate-300">{key}</span>
                          </label>
                        ) : typeof val === 'number' ? (
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">{key}</label>
                            <input
                              type="number"
                              step="any"
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs"
                              value={val}
                              onChange={(e) => setSettingVal(key, Number(e.target.value))}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">{key}</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                              value={String(val ?? '')}
                              onChange={(e) => setSettingVal(key, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfiguringModule(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
