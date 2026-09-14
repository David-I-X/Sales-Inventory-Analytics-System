import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconMoon, IconSun, IconLock, IconPalette, IconShield } from '@tabler/icons-react';

export default function Profile() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-7">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Mi Perfil</h1>
        <p className="text-xs text-secondary mt-0.5">
          Información de usuario, organización y preferencias del sistema
        </p>
      </div>

      {/* User Information Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconUser size={16} />
            </div>
            <h3 className="text-sm font-semibold text-primary">Información de la Cuenta</h3>
          </div>
        </div>
        <div className="card-body space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-primary truncate">{user.full_name || 'Usuario'}</h2>
              <p className="text-sm text-secondary truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondary block mb-1">
                Rol Asignado
              </span>
              <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-info'}`}>
                {user.role === 'admin' ? 'Administrador' : 'Visualizador'}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondary block mb-1">
                Inquilino / Tenant
              </span>
              <span className="font-mono font-bold text-sm text-primary">
                Tenant #{user.tenant_id}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondary block mb-1">
                Estado
              </span>
              <span className="badge badge-success">Activo</span>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-secondary block mb-1">
                Fecha de Registro
              </span>
              <span className="text-sm font-mono text-primary">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('es-CO') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UI Preferences Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconPalette size={16} />
            </div>
            <h3 className="text-sm font-semibold text-primary">Preferencias de Interfaz</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm text-primary">Tema Visual</p>
              <p className="text-xs text-secondary mt-0.5">Alterna entre Modo Claro y Modo Oscuro</p>
            </div>
            <button className="btn btn-secondary btn-sm flex items-center gap-1.5 shrink-0" onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <IconMoon size={16} />
                  <span>Modo Oscuro</span>
                </>
              ) : (
                <>
                  <IconSun size={16} />
                  <span>Modo Claro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <IconShield size={16} />
            </div>
            <h3 className="text-sm font-semibold text-primary">Seguridad</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm text-primary">Contraseña & Tokens</p>
              <p className="text-xs text-secondary mt-0.5">Protegido con JWT, Rotación y Anti Brute-force</p>
            </div>
            <button 
              className="btn btn-ghost btn-sm flex items-center gap-1.5 shrink-0 text-secondary hover:text-primary"
              onClick={() => alert('Para cambiar contraseña contacte al administrador o utilice el flujo de recuperación.')}
            >
              <IconLock size={16} />
              <span>Seguridad</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
