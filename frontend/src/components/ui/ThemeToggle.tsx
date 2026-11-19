import React from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="sidebar-item w-full text-left"
      aria-label="Alternar Modo Oscuro/Claro"
      title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
    >
      {theme === 'light' ? (
        <IconSun size={17} className="sidebar-icon shrink-0" />
      ) : (
        <IconMoon size={17} className="sidebar-icon shrink-0" />
      )}
      {!collapsed && (
        <span className="sidebar-text">
          {theme === 'light' ? 'Tema Claro' : 'Tema Oscuro'}
        </span>
      )}
    </button>
  );
};
