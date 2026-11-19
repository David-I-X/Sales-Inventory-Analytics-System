import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { quoteService } from '../services/quoteService';
import { catalogService } from '../services/catalogService';
import { moduleService } from '../services/moduleService';
import { api } from '../services/api';
import type {
  Quote,
  QuoteItem,
  Contact,
  ConvertToInvoiceResponse,
  Product,
  ModuleSettingValue,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconFileText,
  IconTrash,
  IconCheck,
  IconX,
  IconSend,
  IconFileInvoice,
  IconAlertCircle,
  IconCalendar,
  IconPackages,
  IconBolt,
  IconBookmarkPlus
} from '@tabler/icons-react';

interface QuoteFormItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  item_type: 'service' | 'product';
  sku?: string;
}

export default function Quotes() {
  const { hasModule } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);
  const [quoteDefaults, setQuoteDefaults] = useState<Record<string, ModuleSettingValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Catálogo / Tarifario Rápido
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [newCatalogItem, setNewCatalogItem] = useState({
    name: '',
    sku: '',
    category: '',
    item_type: 'service' as 'service' | 'product',
    unit_measure: 'servicio',
    sale_price: 0,
    description: '',
  });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('Cotización de Servicios / Productos');
  const [contactId, setContactId] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number>(0.19);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [terms, setTerms] = useState('Validez de la oferta: 15 días. Pago: 50% anticipo, 50% entrega.');
  const [notes, setNotes] = useState('');
  const [validUntilDays, setValidUntilDays] = useState<number>(15);
  const [formItems, setFormItems] = useState<QuoteFormItem[]>([
    { description: 'Instalación y Configuración de Equipos', quantity: 1, unit_price: 350000, discount: 0, item_type: 'service' }
  ]);

  // Modal Conversión a Factura DIAN
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<ConvertToInvoiceResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const [quotesRes, contactsRes, catalogRes, settingsRes] = await Promise.allSettled([
        quoteService.getQuotes(statusParam),
        api.get<Contact[]>('/contacts'),
        catalogService.getItems(),
        moduleService.getModuleSettings('quotes'),
      ]);
      if (quotesRes.status === 'fulfilled') {
        setQuotes(quotesRes.value || []);
      } else {
        throw quotesRes.reason;
      }
      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value || []);
      if (catalogRes.status === 'fulfilled') setCatalogItems(catalogRes.value || []);
      if (settingsRes.status === 'fulfilled') setQuoteDefaults(settingsRes.value.settings || {});
    } catch {
      setError('Error al cargar cotizaciones. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingQuoteId(null);
    setTitle('Cotización de Servicios / Productos');
    setContactId('');
    const defTax = Number(quoteDefaults.default_tax_rate ?? 0.19);
    const defTerms = String(
      quoteDefaults.default_terms ?? 'Validez de la oferta: 15 días. Pago: 50% anticipo, 50% entrega.'
    );
    const defDays = Number(quoteDefaults.default_validity_days ?? 15);
    setTaxRate(Number.isNaN(defTax) ? 0.19 : defTax);
    setGlobalDiscount(0);
    setTerms(defTerms);
    setNotes('');
    setValidUntilDays(Number.isNaN(defDays) ? 15 : defDays);
    setFormItems([
      { description: 'Servicio Profesional / Instalación Tec360', quantity: 1, unit_price: 350000, discount: 0, item_type: 'service' }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: Quote) => {
    if (q.status === 'invoiced') {
      alert('Esta cotización ya fue facturada electrónicamente y no puede modificarse.');
      return;
    }
    setEditingQuoteId(q.id);
    setTitle(q.title);
    setContactId(q.contact_id || '');
    setTaxRate(Number(q.tax_rate));
    setGlobalDiscount(Number(q.discount));
    setTerms(q.terms || '');
    setNotes(q.notes || '');
    
    // Mapear ítems existentes
    const itemsMapped: QuoteFormItem[] = (q.items || []).map((it) => ({
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unit_price) || 0,
      discount: Number(it.discount) || 0,
      item_type: (it.item_type as 'service' | 'product') || 'service',
      sku: it.sku || ''
    }));
    setFormItems(itemsMapped.length > 0 ? itemsMapped : [
      { description: 'Línea de Servicio', quantity: 1, unit_price: 0, discount: 0, item_type: 'service' }
    ]);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormItems([
      ...formItems,
      { description: '', quantity: 1, unit_price: 0, discount: 0, item_type: 'service' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteFormItem, value: unknown) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleInsertCatalogItem = (catalogIdStr: string) => {
    const prod = catalogItems.find(p => String(p.id) === catalogIdStr);
    if (!prod) return;
    const mapped: QuoteFormItem = {
      description: prod.name,
      quantity: 1,
      unit_price: Number(prod.sale_price) || 0,
      discount: 0,
      item_type: prod.item_type === 'product' ? 'product' : 'service',
      sku: prod.sku,
    };
    if (
      formItems.length === 1 &&
      (!formItems[0].description.trim() ||
        formItems[0].description === 'Servicio Profesional / Instalación Tec360') &&
      !formItems[0].sku
    ) {
      setFormItems([mapped]);
    } else {
      setFormItems([...formItems, mapped]);
    }
  };

  const handleApplyCatalogToRow = (index: number, catalogIdStr: string) => {
    const prod = catalogItems.find(p => String(p.id) === catalogIdStr);
    if (!prod) return;
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      description: prod.name,
      unit_price: Number(prod.sale_price) || 0,
      item_type: prod.item_type === 'product' ? 'product' : 'service',
      sku: prod.sku,
    };
    setFormItems(updated);
  };

  const handleSaveLineToCatalog = async (item: QuoteFormItem) => {
    if (!item.description.trim()) return;
    try {
      const created = await catalogService.createItem({
        name: item.description.trim(),
        sku: item.sku || undefined,
        item_type: item.item_type,
        unit_measure: item.item_type === 'service' ? 'servicio' : 'unidad',
        sale_price: Number(item.unit_price) || 0,
      });
      setCatalogItems(prev => [...prev, created]);
      setSuccessMsg(`"${created.name}" guardado en el Tarifario (${created.sku}).`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch {
      setError('No se pudo guardar el ítem en el catálogo (verifica si el SKU ya existe).');
    }
  };

  const handleCreateCatalogItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatalogItem.name.trim()) return;
    setCatalogSaving(true);
    try {
      const created = await catalogService.createItem({
        name: newCatalogItem.name.trim(),
        sku: newCatalogItem.sku.trim() || undefined,
        category: newCatalogItem.category.trim() || undefined,
        item_type: newCatalogItem.item_type,
        unit_measure: newCatalogItem.unit_measure.trim() || 'servicio',
        sale_price: Number(newCatalogItem.sale_price) || 0,
        description: newCatalogItem.description.trim() || undefined,
      });
      setCatalogItems(prev => [...prev, created]);
      setNewCatalogItem({
        name: '',
        sku: '',
        category: '',
        item_type: 'service',
        unit_measure: 'servicio',
        sale_price: 0,
        description: '',
      });
      setSuccessMsg(`Ítem "${created.name}" (${created.sku}) agregado al catálogo.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch {
      setError('Error al crear ítem en el catálogo.');
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleDeleteCatalogItem = async (id: number) => {
    try {
      await catalogService.deleteItem(id);
      setCatalogItems(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('No se pudo eliminar el ítem del catálogo.');
    }
  };

  // Cálculos en vivo
  const calcSubtotal = formItems.reduce((acc, it) => {
    const lineTotal = (Number(it.quantity) * Number(it.unit_price)) - Number(it.discount || 0);
    return acc + (lineTotal > 0 ? lineTotal : 0);
  }, 0);
  const calcTaxableBase = Math.max(0, calcSubtotal - globalDiscount);
  const calcTax = calcTaxableBase * taxRate;
  const calcTotal = calcTaxableBase + calcTax;

  const handleSaveQuote = async (e: FormEvent) => {
    e.preventDefault();
    if (formItems.some(it => !it.description.trim())) {
      setError('Todos los ítems deben tener una descripción válida.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const itemsPayload: QuoteItem[] = formItems.map(it => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        discount: Number(it.discount || 0),
        item_type: it.item_type,
        sku: it.sku || undefined
      }));

      if (editingQuoteId) {
        // ACTUALIZAR COTIZACIÓN EXISTENTE
        await quoteService.updateQuote(editingQuoteId, {
          title,
          contact_id: contactId ? Number(contactId) : null,
          items: itemsPayload,
          tax_rate: taxRate,
          discount: globalDiscount,
          terms,
          notes
        });
        setSuccessMsg('Cotización actualizada exitosamente con los nuevos términos y precios.');
      } else {
        // CREAR NUEVA COTIZACIÓN
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validUntilDays);

        await quoteService.createQuote({
          title,
          contact_id: contactId ? Number(contactId) : null,
          items: itemsPayload,
          tax_rate: taxRate,
          discount: globalDiscount,
          terms,
          notes,
          valid_until: expiryDate.toISOString()
        });
        setSuccessMsg('Cotización creada exitosamente con número correlativo.');
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Error al guardar la cotización. Revisa los datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatus = async (quoteId: number, newStatus: string) => {
    try {
      await quoteService.updateQuoteStatus(quoteId, newStatus);
      fetchData();
    } catch {
      setError(`Error al cambiar el estado a '${newStatus}'.`);
    }
  };

  const handleStartConvert = (q: Quote) => {
    setConvertingQuote(q);
    setConvertResult(null);
    setError('');
  };

  const handleConfirmConvert = async () => {
    if (!convertingQuote) return;
    setIsConverting(true);
    setError('');

    try {
      const res = await quoteService.convertToInvoice(convertingQuote.id);
      setConvertResult(res);
      setSuccessMsg(res.message);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setError('Error al emitir factura electrónica ante la DIAN vía Factus.');
    } finally {
      setIsConverting(false);
    }
  };

  // Filtrado en memoria por búsqueda
  const filteredQuotes = quotes.filter(q => {
    if (!searchQuery) return true;
    const qStr = searchQuery.toLowerCase();
    const matchNum = q.quote_number.toLowerCase().includes(qStr);
    const matchTitle = q.title.toLowerCase().includes(qStr);
    const matchClient = (q.contact_name || '').toLowerCase().includes(qStr);
    return matchNum || matchTitle || matchClient;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Borrador</span>;
      case 'sent':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Enviada</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">Aprobada</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Rechazada</span>;
      case 'invoiced':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono">Facturada DIAN</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <IconFileText className="text-indigo-600 dark:text-indigo-400" size={28} />
            Cotizaciones & Presupuestos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión comercial para PyMEs de servicios y productos: emite propuestas, actualiza tarifas y convierte a Factura DIAN.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCatalogModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-lg shadow-xs transition-colors"
            title="Gestionar Tarifario de Servicios y Productos"
          >
            <IconPackages size={18} className="text-indigo-500" />
            Catálogo / Tarifario ({catalogItems.length})
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <IconPlus size={18} />
            Nueva Cotización
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-300 text-sm">
          <IconAlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
          <IconCheck size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cotizaciones</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{quotes.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">En Negociación</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {quotes.filter(q => q.status === 'draft' || q.status === 'sent').length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aprobadas / Listas</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {quotes.filter(q => q.status === 'approved').length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Facturadas DIAN</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {quotes.filter(q => q.status === 'invoiced').length}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 sm:border-none">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'draft', label: 'Borradores' },
            { id: 'sent', label: 'Enviadas' },
            { id: 'approved', label: 'Aprobadas' },
            { id: 'invoiced', label: 'Facturadas' },
            { id: 'rejected', label: 'Rechazadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por número, título o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
            <p>Cargando cotizaciones...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <IconFileText size={48} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No hay cotizaciones registradas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Crea tu primera cotización formal para presentar propuestas de servicios o productos a tus clientes.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <IconPlus size={16} />
              Crear Cotización
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Propuesta / Cliente</th>
                  <th className="px-4 py-3">Vigencia</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {q.quote_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white">{q.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {q.contact_name ? `Cliente: ${q.contact_name}` : 'Cliente no asignado'}
                        {q.invoice_number && (
                          <span className="ml-2 text-purple-600 dark:text-purple-400 font-mono font-semibold">
                            (Factura: {q.invoice_number})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <IconCalendar size={14} />
                        {new Date(q.valid_until).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                      ${Number(q.total).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Editar / Actualizar */}
                        {q.status !== 'invoiced' && (
                          <button
                            onClick={() => handleOpenEditModal(q)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Actualizar / Modificar Cotización"
                          >
                            <IconEdit size={16} />
                          </button>
                        )}

                        {/* Botones de Cambio Rápido de Estado */}
                        {q.status === 'draft' && (
                          <button
                            onClick={() => handleQuickStatus(q.id, 'sent')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors"
                            title="Marcar como Enviada"
                          >
                            <IconSend size={16} />
                          </button>
                        )}
                        {(q.status === 'draft' || q.status === 'sent') && (
                          <button
                            onClick={() => handleQuickStatus(q.id, 'approved')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                            title="Marcar como Aprobada"
                          >
                            <IconCheck size={16} />
                          </button>
                        )}

                        {/* Botón Convertir a Factura DIAN */}
                        {q.status !== 'invoiced' && hasModule('dian_invoicing') && (
                          <button
                            onClick={() => handleStartConvert(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
                            title="Convertir a Factura DIAN"
                          >
                            <IconFileInvoice size={14} />
                            Facturar DIAN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL CREAR / ACTUALIZAR COTIZACIÓN                     */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconFileText className="text-indigo-600" size={22} />
                {editingQuoteId ? 'Actualizar Cotización' : 'Nueva Cotización de Negocio'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Propuesta *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Instalación Cámaras de Seguridad IP"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cliente / Contacto Asignado
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Contacto --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista dinámica de ítems */}
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Líneas de Servicios / Productos
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg px-2 py-1">
                      <IconBolt size={14} className="text-indigo-500 shrink-0" />
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleInsertCatalogItem(e.target.value);
                        }}
                        className="text-xs bg-transparent text-indigo-700 dark:text-indigo-300 font-medium focus:outline-hidden max-w-[230px]"
                      >
                        <option value="">⚡ Agregar desde Catálogo / Tarifario...</option>
                        {catalogItems.some(c => (c.item_type || 'product') === 'service') && (
                          <optgroup label="Servicios">
                            {catalogItems
                              .filter(c => (c.item_type || 'product') === 'service')
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} — ${Number(c.sale_price).toLocaleString('es-CO')}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {catalogItems.some(c => (c.item_type || 'product') !== 'service') && (
                          <optgroup label="Productos">
                            {catalogItems
                              .filter(c => (c.item_type || 'product') !== 'service')
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  [{c.sku}] {c.name} — ${Number(c.sale_price).toLocaleString('es-CO')}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <IconPlus size={14} /> Línea Manual
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <div className="w-full sm:w-28 shrink-0">
                          <select
                            value={item.item_type}
                            onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="service">Servicio</option>
                            <option value="product">Producto</option>
                          </select>
                        </div>

                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            required
                            placeholder="Descripción del servicio o producto..."
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto items-center">
                          <div className="w-20">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Cant."
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                            />
                          </div>

                          <div className="w-32">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              placeholder="Precio Unit."
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveLineToCatalog(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Guardar esta línea en el Catálogo / Tarifario"
                          >
                            <IconBookmarkPlus size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={formItems.length === 1}
                            className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                            title="Eliminar línea"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </div>

                      {catalogItems.length > 0 && (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleApplyCatalogToRow(idx, e.target.value);
                            }}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs"
                          >
                            <option value="">Rellenar esta fila con ítem del catálogo...</option>
                            {catalogItems.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.item_type === 'service' ? '[SRV]' : '[PRD]'} {c.name} (${Number(c.sale_price).toLocaleString('es-CO')})
                              </option>
                            ))}
                          </select>
                          {item.sku && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ajustes económicos y vigencia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Tasa de IVA
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={0.19}>19% (General)</option>
                    <option value={0.05}>5% (Especial)</option>
                    <option value={0.00}>0% (Exento / Sin IVA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Descuento Global ($ COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right"
                  />
                </div>

                {!editingQuoteId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Vigencia de la Oferta
                    </label>
                    <select
                      value={validUntilDays}
                      onChange={(e) => setValidUntilDays(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={7}>7 días</option>
                      <option value={15}>15 días (Estándar)</option>
                      <option value={30}>30 días (1 mes)</option>
                      <option value={60}>60 días</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Términos y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Condiciones Comerciales
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Notas Internas / Para el Cliente
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones de negociación..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Resumen de Totales */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex justify-between items-center text-sm">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Subtotal: ${calcSubtotal.toLocaleString('es-CO')} | IVA: ${calcTax.toLocaleString('es-CO')}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  Total Cotizado: ${calcTotal.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Guardando...' : editingQuoteId ? 'Actualizar Cotización' : 'Crear Cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CONVERTIR A FACTURA ELECTRÓNICA DIAN              */}
      {/* ======================================================== */}
      {convertingQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconFileInvoice className="text-purple-600" size={20} />
                Emisión de Factura DIAN
              </h3>
              <button
                onClick={() => setConvertingQuote(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <IconX size={18} />
              </button>
            </div>

            {convertResult ? (
              <div className="mt-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">¡Factura DIAN Emitida con Éxito!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Número oficial asignado: <span className="font-mono font-bold text-purple-600">{convertResult.invoice_number}</span>
                  </p>
                  {convertResult.cufe && (
                    <p className="text-[10px] font-mono text-slate-400 break-all mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      CUFE: {convertResult.cufe}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setConvertingQuote(null)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  ¿Deseas emitir formalmente la Factura Electrónica ante la DIAN para la cotización{' '}
                  <span className="font-bold font-mono text-indigo-600">{convertingQuote.quote_number}</span>?
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{convertingQuote.contact_name || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor a facturar:</span>
                    <span className="font-bold text-slate-900 dark:text-white">${Number(convertingQuote.total).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Proveedor Fiscal:</span>
                    <span className="font-semibold text-purple-600">Factus API V2 (DIAN)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setConvertingQuote(null)}
                    disabled={isConverting}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmConvert}
                    disabled={isConverting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isConverting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Emitiendo en DIAN...
                      </>
                    ) : (
                      <>
                        <IconFileInvoice size={16} />
                        Confirmar y Emitir DIAN
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CATÁLOGO / TARIFARIO DE SERVICIOS Y PRODUCTOS      */}
      {/* ======================================================== */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 my-8 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IconPackages className="text-indigo-500" size={22} />
                Catálogo / Tarifario de Servicios y Productos
              </h2>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Formulario rápido para agregar al tarifario */}
            <form onSubmit={handleCreateCatalogItem} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Agregar Nuevo Servicio o Producto Reutilizable
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <select
                  value={newCatalogItem.item_type}
                  onChange={(e) => {
                    const t = e.target.value as 'service' | 'product';
                    setNewCatalogItem({
                      ...newCatalogItem,
                      item_type: t,
                      unit_measure: t === 'service' ? 'servicio' : 'unidad',
                    });
                  }}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="service">Servicio / Póliza</option>
                  <option value="product">Producto</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Nombre (Ej: Instalación Cámara IP)"
                  value={newCatalogItem.name}
                  onChange={(e) => setNewCatalogItem({ ...newCatalogItem, name: e.target.value })}
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  required
                  min={0}
                  step="1000"
                  placeholder="Tarifa ($ COP)"
                  value={newCatalogItem.sale_price}
                  onChange={(e) => setNewCatalogItem({ ...newCatalogItem, sale_price: Number(e.target.value) })}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-right"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Código / SKU (Opcional)"
                  value={newCatalogItem.sku}
                  onChange={(e) => setNewCatalogItem({ ...newCatalogItem, sku: e.target.value })}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
                <input
                  type="text"
                  placeholder="Categoría (Ej: CCTV, Soporte)"
                  value={newCatalogItem.category}
                  onChange={(e) => setNewCatalogItem({ ...newCatalogItem, category: e.target.value })}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Unidad (servicio, hora, mes)"
                  value={newCatalogItem.unit_measure}
                  onChange={(e) => setNewCatalogItem({ ...newCatalogItem, unit_measure: e.target.value })}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={catalogSaving}
                  className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                >
                  {catalogSaving ? 'Guardando...' : '+ Guardar en Tarifario'}
                </button>
              </div>
            </form>

            {/* Listado de ítems */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              {catalogItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Aún no hay servicios ni productos registrados en el tarifario.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Nombre / Unidad</th>
                      <th className="px-3 py-2 text-right">Tarifa</th>
                      <th className="px-3 py-2 text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {catalogItems.map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">{c.sku}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (c.item_type || 'product') === 'service'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {(c.item_type || 'product') === 'service' ? 'Servicio' : 'Producto'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                          {c.name} <span className="text-slate-400">({c.unit_measure})</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          ${Number(c.sale_price).toLocaleString('es-CO')}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCatalogItem(c.id)}
                            className="p-1 text-slate-400 hover:text-red-500"
                            title="Desactivar del catálogo"
                          >
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
