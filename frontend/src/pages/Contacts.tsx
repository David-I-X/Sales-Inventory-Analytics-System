import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { Contact } from '../types';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch, 
  IconAlertCircle, 
  IconUsers,
  IconX 
} from '@tabler/icons-react';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [funnelFilter, setFunnelFilter] = useState<'all' | 'new' | 'lead' | 'customer'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', funnel_stage: 'new' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    let result = contacts;
    if (funnelFilter !== 'all') {
      result = result.filter(c => (c.funnel_stage || 'new') === funnelFilter);
    }
    if (search) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search))
      );
    }
    setFilteredContacts(result);
  }, [search, funnelFilter, contacts]);

  const fetchContacts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.get<Contact[]>('/contacts');
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch {
      setError('Error al cargar contactos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phone: contact.phone || '',
        email: contact.email || '',
        funnel_stage: contact.funnel_stage || 'new'
      });
    } else {
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', funnel_stage: 'new' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingContact) {
        await api.patch(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      await fetchContacts();
      handleCloseModal();
    } catch {
      alert('Error al guardar contacto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
      try {
        await api.delete(`/contacts/${id}`);
        await fetchContacts();
      } catch {
        alert('Error al eliminar contacto');
      }
    }
  };

  const getFunnelBadge = (stage: string) => {
    switch (stage) {
      case 'new': 
        return <span className="badge badge-info">Nuevo</span>;
      case 'lead': 
        return <span className="badge badge-warning">Lead</span>;
      case 'customer': 
        return <span className="badge badge-success">Cliente</span>;
      default: 
        return <span className="badge">{stage}</span>;
    }
  };

  const getLeadScoreBadge = (score?: number | null) => {
    const val = score ?? 0;
    const formatted = val.toFixed(1);
    if (val >= 7.0 || val >= 70) {
      return <span className="badge badge-success font-mono">{formatted}</span>;
    }
    if (val >= 4.0 || val >= 40) {
      return <span className="badge badge-warning font-mono">{formatted}</span>;
    }
    return (
      <span className="badge font-mono bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
        {formatted}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <IconUsers size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Directorio de Contactos</h1>
            <p className="text-xs text-secondary mt-0.5">
              Gestiona prospectos, clientes y su estado en el funnel de ventas
            </p>
          </div>
        </div>
        <button className="btn btn-primary flex items-center gap-1.5" onClick={() => handleOpenModal()}>
          <IconPlus size={16} />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="alert-banner alert-banner-danger">
          <div className="flex items-center gap-2">
            <IconAlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Funnel Stage Filter */}
      <div className="segmented-control">
        <button
          className={`segmented-item ${funnelFilter === 'all' ? 'segmented-item-active' : ''}`}
          onClick={() => setFunnelFilter('all')}
        >
          <span>Todos</span>
          <span className="segmented-item-badge">{contacts.length}</span>
        </button>
        <button
          className={`segmented-item ${funnelFilter === 'new' ? 'segmented-item-active' : ''}`}
          onClick={() => setFunnelFilter('new')}
        >
          <span>Nuevos</span>
          <span className="segmented-item-badge">{contacts.filter(c => (c.funnel_stage || 'new') === 'new').length}</span>
        </button>
        <button
          className={`segmented-item ${funnelFilter === 'lead' ? 'segmented-item-active' : ''}`}
          onClick={() => setFunnelFilter('lead')}
        >
          <span>Leads Calificados</span>
          <span className="segmented-item-badge">{contacts.filter(c => c.funnel_stage === 'lead').length}</span>
        </button>
        <button
          className={`segmented-item ${funnelFilter === 'customer' ? 'segmented-item-active' : ''}`}
          onClick={() => setFunnelFilter('customer')}
        >
          <span>Clientes Activos</span>
          <span className="segmented-item-badge">{contacts.filter(c => c.funnel_stage === 'customer').length}</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted">
              <IconSearch size={16} />
            </span>
            <input 
              type="text" 
              className="input input-sm pl-9" 
              placeholder="Buscar por nombre, teléfono o email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted font-medium self-end sm:self-center">
            {filteredContacts.length} contacto{filteredContacts.length === 1 ? '' : 's'}
          </div>
        </div>
        
        <div className="card-body p-0">
          {isLoading ? (
            <div className="py-20 text-center text-secondary flex flex-col items-center justify-center gap-3">
              <div className="animate-spin w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full"></div>
              <p className="font-medium text-sm">Cargando contactos...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-10 text-center text-secondary text-sm">
              {search ? 'No se encontraron contactos que coincidan con la búsqueda.' : 'No hay contactos registrados.'}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Etapa</th>
                    <th>Lead Score</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map(contact => (
                    <tr key={contact.id}>
                      <td className="font-medium text-primary text-sm">{contact.name}</td>
                      <td className="font-mono text-sm text-secondary">{contact.phone || '-'}</td>
                      <td className="text-sm text-secondary">{contact.email || '-'}</td>
                      <td>{getFunnelBadge(contact.funnel_stage || 'new')}</td>
                      <td>{getLeadScoreBadge(contact.lead_score)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            className="btn btn-sm btn-secondary p-1.5 text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 rounded-md transition-colors shadow-xs" 
                            onClick={() => handleOpenModal(contact)} 
                            title="Editar contacto"
                          >
                            <IconEdit size={15} />
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 hover:bg-red-500/10 rounded-md transition-colors shadow-xs" 
                            onClick={() => handleDelete(contact.id)} 
                            title="Eliminar contacto"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {editingContact ? <IconEdit size={18} /> : <IconPlus size={18} />}
                </div>
                <h3 className="font-bold text-base text-primary">
                  {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                </h3>
              </div>
              <button 
                type="button" 
                className="btn-ghost p-1 rounded-md text-muted hover:text-primary transition-colors" 
                onClick={handleCloseModal}
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="input-group">
                  <label className="input-label">Nombre Completo *</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Teléfono (WhatsApp)</label>
                  <input 
                    type="text" 
                    className="input font-mono" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Ej. +573001234567" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="Ej. juan@empresa.com" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Etapa en el Funnel</label>
                  <select 
                    className="input" 
                    value={formData.funnel_stage} 
                    onChange={e => setFormData({...formData, funnel_stage: e.target.value})}
                  >
                    <option value="new">Nuevo Prospecto</option>
                    <option value="lead">Lead Calificado</option>
                    <option value="customer">Cliente Activo</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : editingContact ? 'Actualizar Contacto' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
