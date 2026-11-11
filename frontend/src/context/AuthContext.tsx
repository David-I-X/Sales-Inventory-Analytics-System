import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';
import { tokenManager } from '../services/tokenManager';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasModule: (slug: string) => boolean;
  updateEnabledModules: (modules: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        // Try refreshing tokens first on page load to obtain an access_token in memory
        await authService.refreshTokens();
        const userData = await authService.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Failed to restore session:', error);
        tokenManager.clearTokens();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    const userData = await authService.getMe();
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const hasModule = useCallback((slug: string): boolean => {
    if (!user) return false;
    // Si no está definido enabled_modules todavía (fallback seguro para retrocompatibilidad)
    if (!user.enabled_modules) return true;
    return user.enabled_modules.includes(slug);
  }, [user]);

  const updateEnabledModules = useCallback((modules: string[]) => {
    setUser(prev => prev ? { ...prev, enabled_modules: modules } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && tokenManager.isAuthenticated(),
        login,
        logout,
        hasModule,
        updateEnabledModules,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
