import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  IconHome, 
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
  IconBuildingStore
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <aside 
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
      onMouseEnter={() => collapsed && setCollapsed(false)}
      onMouseLeave={() => localStorage.getItem('sidebar_collapsed') === 'true' && setCollapsed(true)}
    >
      <div className="sidebar-header">
        {!collapsed ? (
          <div className="sidebar-brand">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-600 text-white shrink-0 shadow-xs">
                <IconBuildingStore size={18} />
              </div>
              <span className="sidebar-logo-text">SaaS Vertical</span>
            </div>
            {user?.tenant_id && (
              <span className="sidebar-tenant-name mt-1">Empresa #{user.tenant_id}</span>
            )}
          </div>
        ) : (
          <div className="p-1 rounded-md bg-indigo-600 text-white mx-auto shadow-xs">
            <IconBuildingStore size={18} />
          </div>
        )}
        <button 
          className="btn-ghost p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-muted hover:text-primary transition-colors" 
          onClick={toggleSidebar}
          aria-label="Alternar barra lateral"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            {!collapsed && <span>Principal</span>}
          </div>
          <NavLink to="/" className={navClass} end>
            <IconHome size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Dashboard</span>}
          </NavLink>
          <NavLink to="/contacts" className={navClass}>
            <IconUsers size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Contactos</span>}
          </NavLink>
          <NavLink to="/invoices" className={navClass}>
            <IconFileInvoice size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Facturas DIAN</span>}
          </NavLink>
          <NavLink to="/inventory" className={navClass}>
            <IconPackages size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Inventario</span>}
          </NavLink>
          <NavLink to="/purchases" className={navClass}>
            <IconShoppingCart size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Compras</span>}
          </NavLink>
          <NavLink to="/accounting" className={navClass}>
            <IconReceipt2 size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Contabilidad</span>}
          </NavLink>
          <NavLink to="/ml" className={navClass}>
            <IconBrain size={18} className="sidebar-icon shrink-0" />
            {!collapsed && <span className="sidebar-text">Motor IA / ML</span>}
          </NavLink>
        </div>

        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              {!collapsed && <span>Administración</span>}
            </div>
            <NavLink to="/users" className={navClass}>
              <IconUserPlus size={18} className="sidebar-icon shrink-0" />
              {!collapsed && <span className="sidebar-text">Usuarios</span>}
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className={navClass}>
          <IconUser size={18} className="sidebar-icon shrink-0" />
          {!collapsed && <span className="sidebar-text">Mi Perfil</span>}
        </NavLink>
        
        <ThemeToggle collapsed={collapsed} />

        <button className="sidebar-item w-full text-left text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={logout}>
          <IconLogout size={18} className="sidebar-icon shrink-0" />
          {!collapsed && <span className="sidebar-text">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
