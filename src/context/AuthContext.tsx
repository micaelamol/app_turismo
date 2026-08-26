import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  register: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Inicializar sesión por defecto o restaurar
    const initSession = async () => {
      try {
        // En una app completa se usaría AsyncStorage aquí
        // Iniciamos con una sesión de ejemplo amigable
        setUser({
          id: 'u-1',
          name: 'Turista Explorador',
          email: 'turista@miciudad.com',
          role: 'turista',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        });
      } catch (e) {
        console.error('Error restaurando sesión:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, role: UserRole = 'turista') => {
    setIsLoading(true);
    // Simular inicio de sesión
    setTimeout(() => {
      setUser({
        id: 'u-1',
        name: role === 'turista' ? 'Turista Explorador' : 'Vecino Local',
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
      setIsLoading(false);
    }, 500);
  };

  const register = async (name: string, email: string, role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      });
      setIsLoading(false);
    }, 500);
  };

  const logout = async () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
