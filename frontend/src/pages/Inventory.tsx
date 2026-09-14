import React, { useState, useEffect } from 'react';
import { 
  IconPlus, 
  IconAlertTriangle, 
  IconPackages, 
  IconCash, 
  IconTrendingUp,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconAdjustmentsHorizontal,
  IconRefresh,
  IconSearch,
  IconHistory,
  IconChartBar
} from '@tabler/icons-react';
import { api } from '../services/api';
import type { Product, InventoryMovement, InventoryDashboard } from '../types';

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'dashboard'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit_measure: 'unidad',
    sale_price: 0,
    cost_price: 0,
    current_stock: 0,
    min_stock: 5,
  });
  
  const [adjustmentData, setAdjustmentData] = useState({
    product_id: 0,
    new_stock: 0,
    reason: 'Ajuste de inventario físico'
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [prodsData, movsData, dashData] = await Promise.all([
        api.get<Product[]>('/inventory/products'),
        api.get<InventoryMovement[]>('/inventory/movements'),
        api.get<InventoryDashboard>('/inventory/dashboard')
      ]);

      setProducts(prodsData);
      setMovements(movsData);
      setDashboard(dashData);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar datos de inventario';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post<Product>('/inventory/products', formData);
      setShowProductModal(false);
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        unit_measure: 'unidad',
        sale_price: 0,
        cost_price: 0,
        current_stock: 0,
        min_stock: 5,
      });
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar producto';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post<Product>('/inventory/adjustments', adjustmentData);
      setShowAdjustmentModal(false);
      await fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al ajustar stock';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const openAdjustmentModal = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustmentData({
      product_id: prod.id,
      new_stock: prod.current_stock,
      reason: 'Conteo físico de inventario'
    });
    setShowAdjustmentModal(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Inventario & Stock</h1>
          <p className="text-xs text-secondary mt-0.5">Control en tiempo real de catálogo, entradas, salidas y valuación de activos.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={fetchData}
            title="Recargar datos"
          >
            <IconRefresh size={16} />
            <span>Actualizar</span>
          </button>
          <button 
            className="btn btn-primary flex items-center gap-1.5"
            onClick={() => setShowProductModal(true)}
          >
            <IconPlus size={16} />
            <span>Nuevo Producto</span>
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

      {/* Tabs Navigation */}
      <div className="segmented-control">
        <button
          className={`segmented-item ${activeTab === 'products' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <IconPackages size={16} />
          <span>Catálogo de Productos</span>
          <span className="segmented-item-badge">{products.length}</span>
        </button>
        <button
          className={`segmented-item ${activeTab === 'movements' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <IconHistory size={16} />
          <span>Histórico de Movimientos</span>
          <span className="segmented-item-badge">{movements.length}</span>
        </button>
        <button
          className={`segmented-item ${activeTab === 'dashboard' ? 'segmented-item-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <IconChartBar size={16} />
          <span>KPIs & Valuación</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
                <IconSearch size={16} />
              </span>
              <input
                type="text"
                className="input input-with-icon"
                placeholder="Buscar por SKU o nombre de producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {categories.length > 0 && (
              <select
                className="input sm:w-56"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c as string}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* Products Table */}
          <div className="table-container card">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Stock Actual</th>
                  <th className="text-right">Precio Venta</th>
                  <th className="text-right">Costo Unitario</th>
                  <th className="text-right">Valor en Bodega</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-secondary">Cargando inventario...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-secondary">
                      No se encontraron productos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs font-semibold">{p.sku}</td>
                      <td>
                        <div className="font-semibold text-primary">{p.name}</div>
                        {p.description && <div className="text-xs text-muted mt-0.5">{p.description}</div>}
                      </td>
                      <td>
                        {p.category ? (
                          <span className="badge badge-info">{p.category}</span>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            p.current_stock === 0
                              ? 'badge-danger'
                              : p.is_low_stock
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {p.current_stock} {p.unit_measure}s
                        </span>
                      </td>
                      <td className="text-right font-medium font-mono text-primary">{formatCOP(p.sale_price)}</td>
                      <td className="text-right text-muted font-mono">{formatCOP(p.cost_price)}</td>
                      <td className="text-right font-semibold font-mono text-indigo-600 dark:text-indigo-400">{formatCOP(p.stock_value)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-secondary inline-flex items-center gap-1.5 font-medium shadow-xs hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={() => openAdjustmentModal(p)}
                          title="Ajustar stock físico"
                        >
                          <IconAdjustmentsHorizontal size={14} className="text-indigo-500" />
                          <span>Ajustar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto / SKU</th>
                <th className="text-center">Tipo</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Costo Ref.</th>
                <th>Origen / Notas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-secondary">Cargando movimientos...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-secondary">
                    Aún no hay movimientos de inventario registrados.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs text-muted font-mono">
                      {new Date(m.created_at).toLocaleString('es-CO')}
                    </td>
                    <td>
                      <div className="font-semibold text-primary">{m.product_name}</div>
                      <div className="font-mono text-xs text-muted">{m.product_sku}</div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          m.movement_type === 'entry'
                            ? 'badge-success'
                            : m.movement_type === 'exit'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {m.movement_type === 'entry' && <IconArrowDownLeft size={13} className="inline mr-1" />}
                        {m.movement_type === 'exit' && <IconArrowUpRight size={13} className="inline mr-1" />}
                        {m.movement_type === 'entry' ? 'Entrada' : m.movement_type === 'exit' ? 'Salida' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="text-center font-bold font-mono">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="text-right text-muted font-mono">{formatCOP(m.unit_cost)}</td>
                    <td className="text-xs text-secondary">
                      <span className="font-semibold uppercase px-1.5 py-0.5 rounded bg-elevated border border-default mr-1.5">
                        {m.reference_type}
                      </span>
                      {m.notes && <span>{m.notes}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: INVENTORY KPIS & DASHBOARD */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-label">Total Productos</div>
                  <div className="stat-value">{dashboard.total_products}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-info-bg)', color: 'var(--accent-primary)' }}>
                  <IconPackages size={22} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-label">Valor en Bodega</div>
                  <div className="stat-value text-indigo-600 dark:text-indigo-400">{formatCOP(dashboard.total_inventory_value)}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--accent-success)' }}>
                  <IconCash size={22} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-label">Unidades Totales</div>
                  <div className="stat-value">{dashboard.total_units_in_stock}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-purple-bg)', color: 'var(--accent-purple)' }}>
                  <IconTrendingUp size={22} />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-label">Alertas Stock Bajo</div>
                  <div className="stat-value text-amber-600 dark:text-amber-400">{dashboard.low_stock_count}</div>
                </div>
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--accent-warning)' }}>
                  <IconAlertTriangle size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts Table */}
          {dashboard.low_stock_items.length > 0 && (
            <div className="card border-amber-500/30">
              <div className="card-header">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <IconAlertTriangle size={18} />
                  <span>Productos con Stock Crítico (Acción Requerida)</span>
                </div>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Producto</th>
                      <th className="text-center">Stock Actual</th>
                      <th className="text-center">Stock Mínimo</th>
                      <th className="text-center">Déficit Requerido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.low_stock_items.map((item) => (
                      <tr key={item.product_id}>
                        <td className="font-mono text-xs font-semibold">{item.sku}</td>
                        <td className="font-semibold text-primary">{item.name}</td>
                        <td className="text-center">
                          <span className="badge badge-danger">{item.current_stock}</span>
                        </td>
                        <td className="text-center text-muted font-mono">{item.min_stock}</td>
                        <td className="text-center font-bold text-red-600 font-mono">
                          +{item.deficit} unidades
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NUEVO PRODUCTO */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="font-bold text-base text-primary">Registrar Nuevo Producto</h3>
              <button className="btn-ghost p-1 rounded-md text-muted hover:text-primary" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">SKU / Código *</label>
                    <input
                      type="text"
                      required
                      className="input font-mono"
                      placeholder="ej: GPS-4G-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Categoría</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="ej: Dispositivos"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Nombre del Producto / Servicio *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="ej: GPS Tracker 4G Vehicular"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Descripción</label>
                  <textarea
                    className="input !h-auto"
                    rows={2}
                    placeholder="Detalles técnicos o características..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="input-group">
                    <label className="input-label">Precio Venta *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="input font-mono"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Costo Unitario *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className="input font-mono"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Unidad de Medida</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.unit_measure}
                      onChange={(e) => setFormData({ ...formData, unit_measure: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="input-group">
                    <label className="input-label">Stock Inicial en Bodega</label>
                    <input
                      type="number"
                      min={0}
                      className="input font-mono"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Stock Mínimo de Alerta</label>
                    <input
                      type="number"
                      min={1}
                      className="input font-mono"
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE DE INVENTARIO */}
      {showAdjustmentModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="font-bold text-base text-primary">Ajuste de Stock Físico</h3>
              <button className="btn-ghost p-1 rounded-md text-muted hover:text-primary" onClick={() => setShowAdjustmentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body space-y-4">
                <div className="p-3 rounded-lg border border-default bg-elevated text-xs space-y-1">
                  <div><strong>Producto:</strong> {selectedProduct.name}</div>
                  <div><strong>SKU:</strong> <span className="font-mono">{selectedProduct.sku}</span></div>
                  <div><strong>Stock Actual en Sistema:</strong> <span className="font-semibold text-primary">{selectedProduct.current_stock} {selectedProduct.unit_measure}s</span></div>
                </div>

                <div className="input-group">
                  <label className="input-label">Nuevo Conteo Real en Bodega *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="input font-mono text-base font-bold"
                    value={adjustmentData.new_stock}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, new_stock: Number(e.target.value) })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Motivo del Ajuste *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="ej: Conteo físico mensual, merma, producto dañado..."
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustmentModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Aplicando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
