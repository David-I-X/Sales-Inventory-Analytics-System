import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { Invoice, Contact } from '../types';
import { 
  IconPlus, 
  IconAlertTriangle, 
  IconFileText, 
  IconTrash, 
  IconFileInvoice,
  IconRefresh,
  IconQrcode
} from '@tabler/icons-react';

interface InvoiceFormItem {
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // New invoice state
  const [contactId, setContactId] = useState<number | ''>('');
  const [lineItems, setLineItems] = useState<InvoiceFormItem[]>([
    { sku: 'ITEM-01', description: 'Servicio / Producto', quantity: 1, unit_price: 50000 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [invData, contData] = await Promise.all([
        api.get<Invoice[]>('/dian/invoices'),
        api.get<Contact[]>('/contacts')
      ]);
      setInvoices(invData || []);
      setContacts(contData || []);
    } catch {
      setError('Error al cargar datos de facturación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLine = () => {
    const nextIdx = lineItems.length + 1;
    setLineItems([...lineItems, { sku: `ITEM-0${nextIdx}`, description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
  };

  const handleLineChange = (index: number, field: keyof InvoiceFormItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const tax_amount = subtotal * 0.19;
    const total_amount = subtotal + tax_amount;
    return { subtotal, tax_amount, total_amount };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactId || lineItems.length === 0) return;
    
    setIsSaving(true);
    try {
      const payload = {
        contact_id: Number(contactId),
        items: lineItems.map(item => ({
          sku: item.sku || 'SKU-GEN',
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_rate: 0.19
        }))
      };
      
      await api.post('/dian/invoices/', payload);
      await fetchData();
      setIsPanelOpen(false);
      setLineItems([{ sku: 'ITEM-01', description: 'Servicio / Producto', quantity: 1, unit_price: 50000 }]);
      setContactId('');
    } catch {
      alert('Error al crear y timbrar la factura DIAN');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
        return <span className="badge badge-info">Borrador</span>;
      case 'accepted': 
        return <span className="badge badge-success">Aceptada DIAN</span>;
      case 'rejected': 
        return <span className="badge badge-danger">Rechazada</span>;
      default: 
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const getContactName = (id: number | null | undefined) => {
    if (!id) return 'Consumidor Final';
    return contacts.find(c => c.id === id)?.name || `Contacto #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Facturación Electrónica DIAN</h1>
          <p className="text-xs text-secondary mt-0.5">
            Emisión, timbrado electrónico con CUFE y seguimiento en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="btn btn-secondary flex items-center gap-1.5" onClick={fetchData} title="Actualizar datos">
            <IconRefresh size={16} />
            <span>Actualizar</span>
          </button>
          <button className="btn btn-primary flex items-center gap-1.5" onClick={() => setIsPanelOpen(true)}>
            <IconPlus size={16} />
            <span>+ Nueva Factura</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-label">Facturas Emitidas</div>
          <div className="stat-value">{invoices.length}</div>
          <div className="text-[11px] text-muted font-medium">Total documentos registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Facturado</div>
          <div className="stat-value text-emerald-600 dark:text-emerald-400">
            {formatMoney(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
          </div>
          <div className="text-[11px] text-muted font-medium">Incluye IVA 19%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aceptadas DIAN</div>
          <div className="stat-value text-indigo-600 dark:text-indigo-400">
            {invoices.filter(i => (i.dian_status || 'accepted') === 'accepted').length}
          </div>
          <div className="text-[11px] text-muted font-medium">Validación DIAN exitosa</div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th># Factura</th>
                <th>Cliente</th>
                <th>Fecha Emisión</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Total (IVA 19%)</th>
                <th>Estado DIAN</th>
                <th>CUFE</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-secondary">
                      <div className="animate-spin w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
                      <p className="font-medium text-xs">Cargando facturas DIAN...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-red-500">
                      <IconAlertTriangle size={36} />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-secondary">
                      <IconFileText size={40} className="text-muted opacity-60" />
                      <p className="font-medium text-sm">No hay facturas emitidas</p>
                      <p className="text-xs text-muted">Crea una nueva factura electrónica para comenzar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => {
                  const pdfUrl = invoice.pdf_url || (invoice.dian_response?.data as Record<string, unknown> | undefined)?.links && ((invoice.dian_response?.data as Record<string, unknown>).links as Record<string, string>).public_url;
                  const qrUrl = invoice.qr_url || (invoice.dian_response?.data as Record<string, unknown> | undefined)?.links && ((invoice.dian_response?.data as Record<string, unknown>).links as Record<string, string>).qr;

                  return (
                    <tr key={invoice.id}>
                      <td className="font-mono font-bold text-xs text-primary">{invoice.invoice_number}</td>
                      <td>
                        <span className="font-semibold text-primary">{getContactName(invoice.contact_id)}</span>
                      </td>
                      <td className="text-xs text-muted font-mono">
                        {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('es-CO') : '-'}
                      </td>
                      <td className="text-right font-mono text-muted text-xs">
                        {formatMoney(invoice.subtotal)}
                      </td>
                      <td className="text-right font-mono font-bold text-xs text-primary">
                        {formatMoney(invoice.total)}
                      </td>
                      <td>{getStatusBadge(invoice.dian_status || 'accepted')}</td>
                      <td>
                        <span 
                          className="text-xs font-mono text-muted truncate max-w-[120px] block cursor-help" 
                          title={invoice.cufe || ''}
                        >
                          {invoice.cufe ? `${invoice.cufe.substring(0, 16)}...` : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1.5">
                          {pdfUrl ? (
                            <a
                              href={String(pdfUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1 text-[11px] font-medium transition-colors"
                              title="Ver Factura en PDF (Factus)"
                            >
                              <IconFileText size={13} />
                              <span>PDF</span>
                            </a>
                          ) : null}
                          {qrUrl ? (
                            <a
                              href={String(qrUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center gap-1 text-[11px] font-medium transition-colors"
                              title="Verificar en DIAN (Catálogo VPFE)"
                            >
                              <IconQrcode size={13} />
                              <span>DIAN</span>
                            </a>
                          ) : null}
                          {!pdfUrl && !qrUrl && (
                            <span className="text-[11px] text-muted">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Panel: Nueva Factura */}
      {isPanelOpen && (
        <div className="fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2 text-primary font-bold">
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <IconFileInvoice size={18} />
              </div>
              <h3 className="text-base tracking-tight">Nueva Factura Electrónica</h3>
            </div>
            <button 
              type="button" 
              className="btn-ghost p-1.5 rounded-md text-muted hover:text-primary transition-colors" 
              onClick={() => setIsPanelOpen(false)}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="input-group !mb-0">
                <label className="input-label">Cliente Receptor</label>
                <select 
                  className="input" 
                  required 
                  value={contactId} 
                  onChange={e => setContactId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Selecciona un cliente</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="input-label !mb-0">Ítems / Conceptos</label>
                  <button 
                    type="button" 
                    className="btn-link font-semibold text-xs flex items-center gap-1" 
                    onClick={handleAddLine}
                  >
                    <IconPlus size={14} />
                    <span>Añadir Ítem</span>
                  </button>
                </div>
                
                <div className="space-y-2.5">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        className="input input-sm flex-1 text-xs" 
                        placeholder="Descripción" 
                        required 
                        value={item.description} 
                        onChange={e => handleLineChange(index, 'description', e.target.value)} 
                      />
                      <input 
                        type="number" 
                        className="input input-sm w-16 text-center text-xs font-mono" 
                        placeholder="Cant" 
                        min="1" 
                        required 
                        value={item.quantity} 
                        onChange={e => handleLineChange(index, 'quantity', Number(e.target.value))} 
                      />
                      <input 
                        type="number" 
                        className="input input-sm w-28 text-right text-xs font-mono" 
                        placeholder="Precio" 
                        min="0"
                        required 
                        value={item.unit_price} 
                        onChange={e => handleLineChange(index, 'unit_price', Number(e.target.value))} 
                      />
                      {lineItems.length > 1 && (
                        <button 
                          type="button" 
                          className="btn-ghost p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors shrink-0" 
                          onClick={() => handleRemoveLine(index)}
                          title="Eliminar fila"
                        >
                          <IconTrash size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-elevated)] rounded-xl p-4 border border-[var(--border-default)] space-y-2 text-xs">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-primary">{formatMoney(calculateTotals().subtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>IVA (19%):</span>
                  <span className="font-mono font-medium text-primary">{formatMoney(calculateTotals().tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-[var(--border-default)] pt-2 text-primary">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{formatMoney(calculateTotals().total_amount)}</span>
                </div>
              </div>
            </form>
          </div>
          
          <div className="p-4 border-t border-[var(--border-default)] flex items-center justify-end gap-3 bg-[var(--bg-elevated)]">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPanelOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="invoice-form" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Emitiendo DIAN...' : 'Emitir Factura DIAN'}
            </button>
          </div>
        </div>
      )}
      
      {/* Slide-over backdrop overlay */}
      {isPanelOpen && (
        <div 
          className="modal-overlay z-40" 
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}
