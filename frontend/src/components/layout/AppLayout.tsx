import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, children }) => {
  return (
    <ProtectedRoute>
      <div className="app-layout" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
          <Header title={title} />
          <main className="content-area" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
