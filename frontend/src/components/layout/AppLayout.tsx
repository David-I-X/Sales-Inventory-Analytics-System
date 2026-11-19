import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProtectedRoute } from './ProtectedRoute';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div
        className="app-layout flex h-screen w-screen overflow-hidden"
        style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
      >
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="main-content flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <Header
            title={title}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="content-area flex-1 overflow-y-auto p-4 md:p-7">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
