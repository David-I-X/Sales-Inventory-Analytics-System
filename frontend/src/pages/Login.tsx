import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { BrandLogo } from '../components/brand/BrandLogo';
import {
  IconMail,
  IconLock,
  IconLoader2,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconSun,
  IconMoon,
  IconCircleCheck,
  IconUser,
  IconBuildingStore,
} from '@tabler/icons-react';

type AuthTab = 'login' | 'signup';

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASS = 'admin123';

export default function Login() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registro autoservicio de empresa
  const [companyName, setCompanyName] = useState('');
  const [businessProfile, setBusinessProfile] = useState<'services' | 'complete'>('services');
  const [fullName, setFullName] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signupCompany, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      if (activeTab === 'login') {
        await login(email, password, rememberMe);
      } else {
        await signupCompany(
          {
            company_name: companyName,
            business_profile: businessProfile,
            full_name: fullName,
            email,
            password,
          },
          rememberMe
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'No se pudo completar la autenticación. Verifica tus datos.');
      } else {
        setError('No se pudo completar la autenticación. Verifica tus datos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setActiveTab('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError('');
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div
      className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[540px_1fr] transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
    >
      {/* Columna Izquierda: Autenticación y Onboarding */}
      <section className="flex flex-col justify-between px-6 py-5 sm:px-12 sm:py-8 lg:px-14">
        {/* Barra Superior con Logo Oficial + Selector de Tema */}
        <header className="flex items-center justify-between gap-3">
          <BrandLogo variant="full" size="md" />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] border text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            aria-label={theme === 'light' ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro'}
          >
            {theme === 'light' ? <IconSun size={14} /> : <IconMoon size={14} />}
            <span className="hidden sm:inline">{theme === 'light' ? 'Tema Claro' : 'Tema Oscuro'}</span>
            <span className="sm:hidden">{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
          </button>
        </header>

        {/* Contenedor Central del Formulario */}
        <main className="w-full max-w-[400px] mx-auto my-1 sm:my-6 space-y-3.5 sm:space-y-5">
          {/* Badge DIAN compacto visible en móvil (en desktop vive en la columna derecha) */}
          <div className="flex lg:hidden">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[11px] font-semibold"
              style={{
                backgroundColor: 'var(--status-success-bg)',
                borderColor: 'var(--brand-border)',
                color: 'var(--status-success-text)',
              }}
            >
              <IconCircleCheck size={13} />
              <span>DIAN · Factus API V2 + Factus Pay</span>
            </span>
          </div>

          {/* Control Segmentado Iniciar Sesión / Crear Empresa */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-[10px] border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
            role="tablist"
            aria-label="Modo de acceso"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => switchTab('login')}
              className="h-8 rounded-[7px] text-[13px] transition-colors cursor-pointer"
              style={
                activeTab === 'login'
                  ? {
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 600,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid transparent',
                      fontWeight: 500,
                    }
              }
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              onClick={() => switchTab('signup')}
              className="h-8 rounded-[7px] text-[13px] transition-colors cursor-pointer"
              style={
                activeTab === 'signup'
                  ? {
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 600,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid transparent',
                      fontWeight: 500,
                    }
              }
            >
              Crear Empresa
            </button>
          </div>

          {/* Encabezado */}
          <div>
            <h1 className="text-[20px] sm:text-2xl font-bold tracking-[-0.025em] leading-tight text-[var(--text-primary)]">
              {activeTab === 'login' ? 'Iniciar sesión en Vertical' : 'Registra tu empresa'}
            </h1>
            <p className="text-[12.5px] sm:text-[13.5px] text-[var(--text-secondary)] mt-1.5 leading-[1.45] sm:leading-relaxed">
              {activeTab === 'login' ? (
                <>
                  <span className="hidden sm:inline">
                    Accede al centro de control comercial, fiscal y predictivo de tu empresa.
                  </span>
                  <span className="sm:hidden">
                    Accede al panel comercial y fiscal de tu empresa.
                  </span>
                </>
              ) : (
                'Aprovisiona tu esquema aislado en segundos con facturación DIAN y módulos a la carta.'
              )}
            </p>
          </div>

          {/* Banner de Error */}
          {error && (
            <div className="alert-banner alert-banner-danger text-sm" role="alert">
              <div className="flex items-center gap-2.5">
                <IconAlertCircle size={17} className="shrink-0" style={{ color: 'var(--status-danger-text)' }} />
                <span className="text-xs font-medium leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {activeTab === 'signup' && (
              <>
                <div className="input-group !mb-0">
                  <label className="input-label" htmlFor="company_name">
                    Nombre de la Empresa
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                      <IconBuildingStore size={16} />
                    </span>
                    <input
                      id="company_name"
                      type="text"
                      className="input input-with-icon h-10 text-sm"
                      placeholder="Ej: Tec360 Soluciones S.A.S."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group !mb-0">
                  <label className="input-label" htmlFor="business_profile">
                    Modelo Operativo Inicial
                  </label>
                  <select
                    id="business_profile"
                    className="input h-10 text-sm"
                    value={businessProfile}
                    onChange={(e) => setBusinessProfile(e.target.value as 'services' | 'complete')}
                  >
                    <option value="services">Servicios y Proyectos (Cotizaciones + DIAN + IA)</option>
                    <option value="complete">Comercio e Inventario Completo (Incluye Bodega)</option>
                  </select>
                </div>

                <div className="input-group !mb-0">
                  <label className="input-label" htmlFor="full_name">
                    Nombre del Administrador
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                      <IconUser size={16} />
                    </span>
                    <input
                      id="full_name"
                      type="text"
                      className="input input-with-icon h-10 text-sm"
                      placeholder="Carlos Mendoza"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="input-group !mb-0">
              <label className="input-label" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <IconMail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="input input-with-icon h-10 text-sm"
                  placeholder="admin@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group !mb-0">
              <label className="input-label" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                  <IconLock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input input-with-icon h-10 text-sm pr-10"
                  placeholder={activeTab === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={activeTab === 'signup' ? 6 : undefined}
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {/* Mantener sesión iniciada (Checkbox accesible WCAG AAA) + Chip JWT */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs sm:text-[12.5px] text-[var(--text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <span
                  aria-hidden="true"
                  className="w-4 h-4 rounded-[4px] inline-flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)]"
                  style={{
                    backgroundColor: rememberMe ? 'var(--brand-solid)' : 'var(--bg-canvas)',
                    border: rememberMe ? '1px solid transparent' : '1px solid var(--border-strong)',
                    color: 'var(--brand-on-primary)',
                  }}
                >
                  {rememberMe && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M2 6.2L4.8 9L10 3"
                        stroke="var(--brand-on-primary)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="hidden sm:inline">Mantener sesión iniciada</span>
                <span className="sm:hidden">Mantener sesión</span>
              </label>
              <span
                className="font-mono text-[11px] px-2 py-0.5 rounded-[6px] border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                JWT · SHA-256
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center h-10 text-[13.5px] font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <IconLoader2 size={16} className="animate-spin" />
                  <span>{activeTab === 'login' ? 'Autenticando...' : 'Creando empresa...'}</span>
                </div>
              ) : activeTab === 'login' ? (
                'Entrar a la Plataforma'
              ) : (
                'Crear Empresa e Ingresar'
              )}
            </button>
          </form>

          {/* Tarjeta Acceso Rápido Demo (paridad estricta sin clipping) */}
          {activeTab === 'login' && (
            <div
              className="rounded-[10px] border px-3.5 py-3 flex items-center justify-between gap-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-[var(--text-primary)]">
                  Acceso Rápido Demo
                </div>
                <div className="font-mono text-[11px] text-[var(--text-muted)] leading-snug">
                  <span className="hidden sm:inline">
                    {DEMO_EMAIL} · Distribuidora Los Andes S.A.S.
                  </span>
                  <span className="sm:hidden">{DEMO_EMAIL}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                disabled={isLoading}
                className="btn btn-secondary btn-sm h-[30px] text-[11.5px] rounded-[7px] shrink-0"
              >
                Autocompletar
              </button>
            </div>
          )}
        </main>

        {/* Footer Izquierdo */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] sm:text-[11.5px] text-[var(--text-muted)]">
          <span>
            &copy; {new Date().getFullYear()} Vertical
            <span className="sm:hidden"> · Gestión empresarial PyME</span>
          </span>
          <span className="font-mono hidden sm:inline">Schema-per-Tenant Isolation</span>
          <span className="font-mono sm:hidden">Schema-per-Tenant · PostgreSQL 15</span>
        </footer>
      </section>

      {/* Columna Derecha: Showcase B2B Operativo (Solo Desktop >= lg) */}
      <aside
        className="hidden lg:flex flex-col justify-between px-12 py-10 xl:px-14 border-l"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Topbar de Garantías */}
        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] border text-[11.5px] font-semibold"
            style={{
              backgroundColor: 'var(--status-success-bg)',
              borderColor: 'var(--brand-border)',
              color: 'var(--status-success-text)',
            }}
          >
            <IconCircleCheck size={14} />
            <span>DIAN · Factus API V2 + Factus Pay</span>
          </span>
          <span
            className="font-mono text-[11.5px] font-medium px-2.5 py-1 rounded-[6px] border"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            PostgreSQL 15 · Multi-Tenant
          </span>
        </div>

        {/* Hero Editorial */}
        <div className="max-w-[680px]">
          <h2 className="text-[28px] xl:text-[30px] font-bold tracking-[-0.03em] leading-[1.18] text-[var(--text-primary)]">
            Control comercial, fiscal y predictivo en una sola arquitectura.
          </h2>
          <p className="mt-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
            Unifica cotizaciones actualizables, tarifario de servicios, facturación electrónica DIAN, recaudo con Factus Pay y modelos predictivos de demanda y cierre.
          </p>
        </div>

        {/* Bento Grid Operativo */}
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Flujo Comercial & Fiscal */}
          <div
            className="col-span-2 rounded-xl border p-5 space-y-3.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Trazabilidad Comercial & Fiscal</span>
              <span className="font-mono font-medium text-[var(--text-muted)]">Flujo automatizado</span>
            </div>

            <div className="grid grid-cols-[1fr_20px_1fr_20px_1fr] items-center gap-2.5">
              <div
                className="rounded-lg border p-3 space-y-1"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  1 · Cotización
                </div>
                <div className="font-mono tabular-nums text-[13px] font-semibold text-[var(--text-primary)]">
                  COT-0004
                </div>
                <div className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  $ 452.200 COP · Servicio
                </div>
              </div>

              <div className="text-center text-sm text-[var(--text-muted)]" aria-hidden="true">→</div>

              <div
                className="rounded-lg border p-3 space-y-1"
                style={{
                  backgroundColor: 'var(--brand-subtle)',
                  borderColor: 'var(--brand-border)',
                }}
              >
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: 'var(--status-success-text)' }}
                >
                  2 · Factura DIAN
                </div>
                <div className="font-mono tabular-nums text-[13px] font-semibold text-[var(--text-primary)]">
                  SETT-0033
                </div>
                <div className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
                  $ 1.356.600 COP · CUFE OK
                </div>
              </div>

              <div className="text-center text-sm text-[var(--text-muted)]" aria-hidden="true">→</div>

              <div
                className="rounded-lg border p-3 space-y-1"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  3 · Contabilidad
                </div>
                <div className="font-mono tabular-nums text-[13px] font-semibold text-[var(--text-primary)]">
                  Asiento #38
                </div>
                <div className="font-mono text-xs text-[var(--text-secondary)]">
                  Factus Pay Activo
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Motor Predictivo IA (Violeta exclusivo ML) */}
          <div
            className="rounded-xl border p-5 flex flex-col justify-between gap-3.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Motor Predictivo IA</span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--ml-subtle)',
                  borderColor: 'var(--ml-border)',
                  color: 'var(--ml-text)',
                }}
              >
                ML Lead Scoring
              </span>
            </div>

            <div>
              <div className="font-mono tabular-nums text-[28px] font-semibold tracking-[-0.025em] leading-none text-[var(--text-primary)]">
                94,0%
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                Propensión de cierre calculada sobre{' '}
                <strong className="text-[var(--text-primary)]">Construcciones Modernas S.A.</strong>
              </p>
            </div>

            <svg viewBox="0 0 320 56" width="100%" height="56" fill="none" aria-hidden="true">
              <path
                d="M4 44 L56 38 L108 40 L160 28 L212 24 L264 14 L316 8"
                stroke="var(--ml-accent)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M212 24 L264 14 L316 8"
                stroke="var(--ml-accent)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="316" cy="8" r="4" fill="var(--ml-accent)" />
            </svg>
          </div>

          {/* Card 3: Arquitectura Modular */}
          <div
            className="rounded-xl border p-5 flex flex-col justify-between gap-3.5"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Arquitectura "A la Carta"</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--status-success-text)' }}>
                8 Módulos
              </span>
            </div>

            <div>
              <div className="text-[28px] font-semibold tracking-[-0.025em] leading-none text-[var(--text-primary)]">
                100% Modular
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                Activa herramientas según tu operación de servicios o inventario físico.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Cotizaciones', 'Facturación DIAN', 'Contabilidad'].map((mod) => (
                <span
                  key={mod}
                  className="text-[11.5px] font-semibold px-2.5 py-1 rounded-[6px] border"
                  style={{
                    backgroundColor: 'var(--brand-subtle)',
                    borderColor: 'var(--brand-border)',
                    color: 'var(--status-success-text)',
                  }}
                >
                  {mod}
                </span>
              ))}
              {['Inventario', 'CRM WhatsApp'].map((mod) => (
                <span
                  key={mod}
                  className="text-[11.5px] font-medium px-2.5 py-1 rounded-[6px] border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Derecho */}
        <div
          className="pt-4 border-t flex items-center justify-between text-xs text-[var(--text-muted)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span>Vertical OS / Vertical ERP para PyMEs colombianas</span>
          <span className="font-mono">WCAG 2.2 AA · Rotación JWT</span>
        </div>
      </aside>
    </div>
  );
}
