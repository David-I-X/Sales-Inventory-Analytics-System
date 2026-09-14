import React, { useEffect, useState } from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed = false }) => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="sidebar-item w-full text-left" 
      aria-label="Alternar Modo Oscuro/Claro"
      title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
    >
      {theme === 'light' ? (
        <IconMoon size={18} className="sidebar-icon shrink-0 text-slate-500" />
      ) : (
        <IconSun size={18} className="sidebar-icon shrink-0 text-amber-400" />
      )}
      {!collapsed && (
        <span className="sidebar-text">
          {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
        </span>
      )}
    </button>
  );
};
