import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock, IconLoader2, IconBuildingStore, IconAlertCircle } from '@tabler/icons-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // login handles setting auth context, useEffect handles redirect
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-white dark:from-slate-950 dark:to-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="card rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl p-8">
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4 ring-4 ring-indigo-500/10">
              <IconBuildingStore size={26} stroke={1.75} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-secondary mt-1 max-w-xs">
              Accede al panel de control integral de tu empresa
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert-banner alert-banner-danger mb-6 text-sm" role="alert">
              <div className="flex items-center gap-2.5">
                <IconAlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="input-group mb-0">
              <label className="input-label" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <IconMail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="input input-with-icon h-11 text-sm placeholder:text-muted"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group mb-0">
              <div className="flex items-center justify-between">
                <label className="input-label" htmlFor="password">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <IconLock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  className="input input-with-icon h-11 text-sm placeholder:text-muted"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center h-11 text-sm font-semibold rounded-xl transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <IconLoader2 size={18} className="animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                'Entrar a la Plataforma'
              )}
            </button>
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} SaaS Vertical. Plataforma de gestión empresarial.
        </p>
      </div>
    </div>
  );
}
