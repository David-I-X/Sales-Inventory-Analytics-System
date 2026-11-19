import React from 'react';
import { Link } from 'react-router-dom';
import { IconMenu2, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../brand/BrandLogo';

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenMobileMenu }) => {
  const { user, hasModule } = useAuth();

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="header">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="btn-ghost p-1.5 rounded-md md:hidden"
            aria-label="Abrir navegación"
          >
            <IconMenu2 size={20} />
          </button>
        )}

        <Link to="/" className="md:hidden shrink-0" style={{ color: 'var(--text-primary)' }}>
          <BrandLogo variant="full" size="sm" />
        </Link>

        <div className="hidden md:flex items-center gap-2 text-[13px] min-w-0">
          <span style={{ color: 'var(--text-muted)' }}>Vertical</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span className="header-title truncate">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {hasModule('dian_invoicing') && (
          <Link to="/invoices" className="btn btn-primary btn-sm md:h-9 md:px-3.5 md:text-[13px]">
            <IconPlus size={15} stroke={2.4} />
            <span className="hidden sm:inline">Nueva Factura DIAN</span>
            <span className="sm:hidden">Factura</span>
          </Link>
        )}

        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
          <div className="text-right flex flex-col leading-tight">
            <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
              {user?.full_name || 'Usuario'}
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {user?.role === 'admin' ? 'Admin' : 'Visualizador'}
            </span>
          </div>
          <div className="avatar" title={user?.full_name || user?.email}>
            {getInitials(user?.full_name || user?.email || 'U')}
          </div>
        </div>
      </div>
    </header>
  );
};
