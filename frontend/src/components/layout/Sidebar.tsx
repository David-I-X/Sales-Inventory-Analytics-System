import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconLayoutGrid,
  IconUsers,
  IconFileInvoice,
  IconPackages,
  IconShoppingCart,
  IconReceipt2,
  IconBrain,
  IconUserPlus,
  IconUser,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconApps,
  IconFileText,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BrandLogo } from '../brand/BrandLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout, hasModule } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`;

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${
        mobileOpen ? 'sidebar-mobile-open' : ''
      }`}
    >
      <div className="sidebar-header">
        {!collapsed ? (
          <div className="sidebar-brand">
            <BrandLogo variant="full" size="md" />
            {user?.tenant_id && (
              <span className="sidebar-tenant-name">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                />
                <span>{user.tenant_name || `Empresa #${user.tenant_id}`}</span>
              </span>
            )}
          </div>
        ) : (
          <div className="mx-auto">
            <BrandLogo variant="mark" size="md" />
          </div>
        )}

        <button
          className="btn-ghost p-1.5 rounded-md hidden md:inline-flex"
          onClick={toggleSidebar}
          aria-label="Alternar barra lateral"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? (
            <IconLayoutSidebarLeftExpand size={17} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={17} />
          )}
        </button>

        {onCloseMobile && (
          <button
            className="btn-ghost p-1.5 rounded-md md:hidden"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          >
            <IconX size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Operación</div>}

          <NavLink to="/" className={navClass} end onClick={handleLinkClick}>
            <IconLayoutGrid size={17} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Dashboard</span>}
          </NavLink>

          <NavLink to="/contacts" className={navClass} onClick={handleLinkClick}>
            <IconUsers size={17} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Contactos CRM</span>}
          </NavLink>

          {hasModule('quotes') && (
            <NavLink to="/quotes" className={navClass} onClick={handleLinkClick}>
              <IconFileText size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Cotizaciones</span>}
            </NavLink>
          )}

          {hasModule('dian_invoicing') && (
            <NavLink to="/invoices" className={navClass} onClick={handleLinkClick}>
              <IconFileInvoice size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Facturas DIAN</span>}
            </NavLink>
          )}

          {hasModule('inventory') && (
            <NavLink to="/inventory" className={navClass} onClick={handleLinkClick}>
              <IconPackages size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Inventario</span>}
            </NavLink>
          )}

          {hasModule('purchases') && (
            <NavLink to="/purchases" className={navClass} onClick={handleLinkClick}>
              <IconShoppingCart size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Compras</span>}
            </NavLink>
          )}

          {hasModule('accounting') && (
            <NavLink to="/accounting" className={navClass} onClick={handleLinkClick}>
              <IconReceipt2 size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Contabilidad</span>}
            </NavLink>
          )}

          {(hasModule('ml_leads') || hasModule('ml_inventory')) && (
            <NavLink to="/ml" className={navClass} onClick={handleLinkClick}>
              <IconBrain
                size={17}
                className="sidebar-icon shrink-0"
                style={{ color: 'var(--ml-accent)' }}
              />
              {!collapsed && <span className="sidebar-text">Motor IA / ML</span>}
            </NavLink>
          )}
        </div>

        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Sistema</div>}

          <NavLink to="/modules" className={navClass} onClick={handleLinkClick}>
            <IconApps size={17} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Módulos</span>}
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/users" className={navClass} onClick={handleLinkClick}>
              <IconUserPlus size={17} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Usuarios y Roles</span>}
            </NavLink>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className={navClass} onClick={handleLinkClick}>
          <IconUser size={17} className="sidebar-icon shrink-0" />
          {!collapsed && <span className="sidebar-text">Mi Perfil</span>}
        </NavLink>

        <ThemeToggle collapsed={collapsed} />

        <button
          onClick={logout}
          className="sidebar-item w-full text-left"
          style={{ color: 'var(--status-danger-text)' }}
          aria-label="Cerrar sesión"
        >
          <IconLogout size={17} className="sidebar-icon shrink-0" />
          {!collapsed && <span className="sidebar-text">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
