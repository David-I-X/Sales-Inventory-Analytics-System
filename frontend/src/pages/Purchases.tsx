import React, { useState, useEffect } from 'react';
import { 
  IconPlus, 
  IconShoppingCart, 
  IconTruck, 
  IconAlertTriangle, 
  IconRefresh,
  IconTrash
} from '@tabler/icons-react';
import { api } from '../services/api';
import type { Purchase, Supplier, Product } from '../types';

export const Purchases: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // New Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [items, setItems] = useState<Array<{ product_id: number; quantity: number; unit_cost: number }>>([
    { product_id: 0, quantity: 1, unit_cost: 0 }
  ]);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    nit: '',
    phone: '',
    email: '',
    contact_person: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [purchData, supData, prodData] = await Promise.all([
        api.get<Purchase[]>('/purchases'),
        api.get<Supplier[]>('/suppliers'),
        api.get<Product[]>('/inventory/products')
      ]);
      setPurchases(purchData);
      setSuppliers(supData);
      setProducts(prodData);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar compras';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: number) => {
    const newItems = [...items];
    if (field === 'product_id') {
      newItems[index].product_id = value;
      // Auto fill default cost from product catalog
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].unit_cost = prod.cost_price;
      }
    } else if (field === 'quantity') {
      newItems[index].quantity = value;
    } else if (field === 'unit_cost') {
      newItems[index].unit_cost = value;
    }
    setItems(newItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(it => it.product_id === 0 || it.quantity <= 0)) {
      setError('Por favor selecciona un producto válido para todos los ítems.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.post<Purchase>('/purchases', {
        supplier_id: selectedSupplierId ? Number(selectedSupplierId) : null,
        items,
        tax_rate: 0.19,
        notes: purchaseNotes || null
      });
      setShowModal(false);
      // Reset form
      setItems([{ product_id: 0, quantity: 1, unit_cost: 0 }]);
      setSelectedSupplierId('');
      setPurchaseNotes('');
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la compra';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const created = await api.post<Supplier>('/suppliers', newSupplier);
      setSuppliers([...suppliers, created]);
      setSelectedSupplierId(created.id);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', nit: '', phone: '', email: '', contact_person: '', address: '' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear proveedor';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Compras a Proveedores</h1>
          <p className="text-xs text-secondary mt-0.5">
            Registra entradas de stock y genera gastos contables automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="btn btn-secondary flex items-center gap-1.5" onClick={fetchData}>
            <IconRefresh size={16} />
            <span>Actualizar</span>
          </button>
          <button className="btn btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
            <IconPlus size={16} />
            <span>+ Nueva Compra</span>
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

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-label">Total Compras Registradas</div>
          <div className="stat-value">{purchases.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Proveedores Activos</div>
          <div className="stat-value text-indigo-600 dark:text-indigo-400">{suppliers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gasto Total en Compras</div>
          <div className="stat-value text-red-600 dark:text-red-400">
            {formatCOP(purchases.reduce((acc, p) => acc + p.total, 0))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented-control">
        <button
          className={`segmented-item ${activeTab === 'purchases' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <IconShoppingCart size={16} />
          <span>Órdenes de Compra</span>
          <span className="segmented-item-badge">{purchases.length}</span>
        </button>
        <button
          className={`segmented-item ${activeTab === 'suppliers' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <IconTruck size={16} />
          <span>Directorio de Proveedores</span>
          <span className="segmented-item-badge">{suppliers.length}</span>
        </button>
      </div>

      {/* Tab: Compras */}
      {activeTab === 'purchases' && (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th># Compra</th>
                <th>Proveedor</th>
                <th>Ítems Comprados</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">IVA (19%)</th>
                <th className="text-right">Total Pagado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-secondary">Cargando compras...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-secondary">
                    No hay órdenes de compra registradas aún.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono font-bold text-xs">{p.purchase_number}</td>
                    <td>
                      <div className="font-semibold text-primary flex items-center gap-1.5">
                        <IconTruck size={15} className="text-muted" />
                        <span>{p.supplier_name || 'Proveedor General'}</span>
                      </div>
                    </td>
                    <td className="text-sm">
                      {p.items && p.items.length > 0 ? (
                        <span className="badge badge-info">
                          {p.items.length} producto{p.items.length > 1 ? 's' : ''} ({p.items.reduce((sum, it) => sum + (it.quantity || 0), 0)} unids)
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-right text-muted font-mono">{formatCOP(p.subtotal)}</td>
                    <td className="text-right text-muted font-mono">{formatCOP(p.tax)}</td>
                    <td className="text-right font-bold font-mono text-red-600 dark:text-red-400">{formatCOP(p.total)}</td>
                    <td className="text-xs text-muted font-mono">
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Proveedores */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-primary">Proveedores Registrados</h3>
            <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={() => setShowSupplierModal(true)}>
              <IconPlus size={14} />
              <span>+ Nuevo Proveedor</span>
            </button>
          </div>
          <div className="table-container card">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre / Razón Social</th>
                  <th>NIT / Identificación</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Correo Electrónico</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-secondary">
                      No hay proveedores registrados aún.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-primary">{s.name}</td>
                      <td className="font-mono text-xs">{s.nit || '-'}</td>
                      <td className="text-sm">{s.contact_person || '-'}</td>
                      <td className="font-mono text-xs text-secondary">{s.phone || '-'}</td>
                      <td className="text-sm text-secondary">{s.email || '-'}</td>
                      <td className="text-xs text-muted">{s.address || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA COMPRA */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-2 text-primary font-bold">
                <IconShoppingCart size={20} className="text-indigo-500" />
                <h3 className="text-base">Registrar Compra a Proveedor</h3>
              </div>
              <button className="btn-ghost p-1 rounded-md text-muted hover:text-primary" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePurchase}>
              <div className="modal-body space-y-4">
                {/* Supplier selection */}
                <div className="flex items-end gap-2">
                  <div className="input-group flex-1 !mb-0">
                    <label className="input-label">Proveedor</label>
                    <select
                      className="input"
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Seleccione un proveedor (opcional)</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} {s.nit ? `(${s.nit})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs h-[38px]"
                    onClick={() => setShowSupplierModal(true)}
                  >
                    + Nuevo Proveedor
                  </button>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="input-label">Productos de la Compra</label>
                    <button
                      type="button"
                      className="btn-link font-semibold text-xs"
                      onClick={handleAddItem}
                    >
                      + Agregar Fila
                    </button>
                  </div>

                  <div className="border border-default rounded-lg p-2.5 bg-elevated space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          required
                          className="input flex-1 text-xs"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', Number(e.target.value))}
                        >
                          <option value={0}>Selecciona producto...</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              [{prod.sku}] {prod.name} (Stock: {prod.current_stock})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          required
                          min={1}
                          className="input w-20 text-center text-xs font-mono"
                          placeholder="Cant."
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        />

                        <input
                          type="number"
                          required
                          min={0}
                          className="input w-32 text-right text-xs font-mono"
                          placeholder="Costo Unit."
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', Number(e.target.value))}
                        />

                        <div className="w-28 text-right font-mono text-xs font-bold text-primary">
                          {formatCOP(item.quantity * item.unit_cost)}
                        </div>

                        <button
                          type="button"
                          className="btn-ghost p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-xs bg-elevated p-3 rounded-lg border border-default">
                    <div className="flex justify-between text-secondary">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-secondary">
                      <span>IVA (19%):</span>
                      <span className="font-mono">{formatCOP(tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-default pt-1.5 text-primary">
                      <span>Total Compra:</span>
                      <span className="font-mono text-red-600 dark:text-red-400">{formatCOP(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Notas / Observaciones</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ej: Factura de proveedor #9842, reposición de quincena..."
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Procesando...' : 'Confirmar y Guardar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: NUEVO PROVEEDOR */}
      {showSupplierModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="font-bold text-base text-primary">Registrar Nuevo Proveedor</h3>
              <button className="btn-ghost p-1 rounded text-muted hover:text-primary" onClick={() => setShowSupplierModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="modal-body space-y-3">
                <div className="input-group">
                  <label className="input-label">Razón Social / Nombre *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="ej: Distribuidora Nacional SAS"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">NIT / Cédula</label>
                    <input
                      type="text"
                      className="input font-mono"
                      placeholder="ej: 900123456-1"
                      value={newSupplier.nit}
                      onChange={(e) => setNewSupplier({ ...newSupplier, nit: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Teléfono</label>
                    <input
                      type="text"
                      className="input font-mono"
                      placeholder="+57300..."
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Email de Contacto</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="ventas@proveedor.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
