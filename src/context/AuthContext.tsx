import React, { createContext, useContext, useEffect, useState } from "react";
import { RespuestaIngreso, User, UserRole } from "../types";
import { httpClient } from "../servicios/client";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Inicializar sesión por defecto o restaurar
    const initSession = async () => {
      try {
        // En una app completa se usaría AsyncStorage aquí
        // Iniciamos con una sesión de ejemplo amigable

        const token = await SecureStore.getItemAsync("user_token");
        if (!token) {
          setUser(null);
          setIsLoading(false);

          return;
        }

        /* setUser({
          id: "u-1",
          name: "Turista Explorador",
          email: "turista@miciudad.com",
          role: "turista",
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        }); */
      } catch (e) {
        console.error("Error restaurando sesión:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, contrasena: string) => {
    setIsLoading(true);
    try {
      const res = await httpClient.post<RespuestaIngreso>("/auth/ingreso", {
        email,
        contrasena,
      });
      console.log("log: ", res.data);
      const { token, usuario } = res.data.datos;
      setUser(usuario);
      await SecureStore.setItemAsync("user_token", token);

      /* setUser({
        id: "u-1",
        nombre: "prueba",
        email,
        avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      }); */
    } catch (e: any) {
      console.log(e);
      if (e.response) {
        // Acá NestJS te dice exactamente qué campo no pasó la validación:
        console.log(
          "Detalle del 400:",
          JSON.stringify(e.response.data, null, 2),
        );
      }
    } finally {
      setIsLoading(false);
    }

    /* // Simular inicio de sesión
    setTimeout(() => {
      setUser({
        id: 'u-1',
        name: role === 'turista' ? 'Turista Explorador' : 'Vecino Local',
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
      setIsLoading(false);
    }, 500); */
  };

  const register = async (name: string, email: string, role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      });
      setIsLoading(false);
    }, 500);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("user_token");
    setUser(null);
    router.push("/(auth)/login");
  };

  useEffect(() => {
    // 1. Axios lo activa de inmediato para TODAS las peticiones y devuelve su ID
    const interceptorId = httpClient.interceptors.response.use(
      (respuesta) => respuesta,
      async (error) => {
        if (error.response?.status === 401) await logout();
        return Promise.reject(error);
      },
    );

    // 2. Función de limpieza (cleanup): solo se ejecuta si AuthProvider se desmonta
    return () => {
      httpClient.interceptors.response.eject(interceptorId);
    };
  }, []);

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
