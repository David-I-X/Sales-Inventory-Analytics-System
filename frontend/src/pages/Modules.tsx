import { useState, useEffect } from 'react';
import { 
  IconFileInvoice, 
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
  IconRefresh
} from '@tabler/icons-react';
import { moduleService } from '../services/moduleService';
import { useAuth } from '../context/AuthContext';
import type { ModuleStatus } from '../types';

export default function Modules() {
  const { updateEnabledModules } = useAuth();
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [totalActive, setTotalActive] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const getModuleIcon = (iconName: string) => {
    const props = { size: 24, className: "shrink-0" };
    switch (iconName) {
      case 'IconFileInvoice':
        return <IconFileInvoice {...props} />;
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

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      {mod.is_enabled ? 'Herramienta contratada' : 'Disponible para activar'}
                    </span>

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
    </div>
  );
}
