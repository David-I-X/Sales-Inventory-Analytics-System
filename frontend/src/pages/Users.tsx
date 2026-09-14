import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { IconPlus, IconUser, IconShield, IconAlertCircle, IconUsersGroup, IconX } from '@tabler/icons-react';
import { Navigate } from 'react-router-dom';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'viewer' });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<User[]>('/auth/admin/users');
      setUsers(data || []);
    } catch {
      setError('Error al cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/auth/admin/users', formData);
      await fetchUsers();
      setIsModalOpen(false);
      setFormData({ email: '', password: '', full_name: '', role: 'viewer' });
    } catch {
      alert('Error al crear usuario. Verifica que el correo no esté ya registrado.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconUsersGroup size={16} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Gestión de Usuarios del Tenant</h1>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Control de acceso de miembros de tu equipo a este espacio de trabajo
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <IconPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger">
          <div className="flex items-center gap-2">
            <IconAlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Users Card & Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-secondary text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        <span>Cargando usuarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-secondary text-sm">
                      No hay usuarios registrados en este tenant.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="avatar w-7 h-7 text-xs font-semibold">
                            {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : <IconUser size={14} />}
                          </div>
                          <span className="font-medium text-primary">{u.full_name || 'Sin nombre'}</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{u.email}</td>
                      <td>
                        {u.role === 'admin' ? (
                          <span className="badge badge-purple">
                            <IconShield size={12} />
                            <span>Administrador</span>
                          </span>
                        ) : (
                          <span className="badge badge-info">
                            <IconUser size={12} />
                            <span>Visualizador</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="text-base font-semibold text-primary">Crear Nuevo Usuario</h3>
              <button
                type="button"
                className="btn-ghost p-1 rounded-md text-muted hover:text-primary transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="input-group">
                  <label className="input-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Ej. Ana Gómez"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ana@empresa.com"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Contraseña Temporal</label>
                  <input
                    type="password"
                    className="input"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Rol de Acceso</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="viewer">Visualizador (Lectura general)</option>
                    <option value="admin">Administrador (Control total del Tenant)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
