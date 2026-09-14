import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();
  
  // Extract initials for the avatar
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.full_name || 'Usuario'}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Administrador' : 'Visualizador'}</span>
          </div>
          <div className="avatar" title={user?.full_name || user?.email}>
            {getInitials(user?.full_name || user?.email || 'U')}
          </div>
        </div>
      </div>
    </header>
  );
};
