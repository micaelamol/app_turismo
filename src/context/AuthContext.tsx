import React, { createContext, useContext, useEffect, useState } from "react";
import {
  RespuestaApiExito,
  RespuestaIngreso,
  RespuestaYo,
  TokenPayload,
  User,
  UserRole,
} from "../types";
import { httpClient } from "../servicios/client";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, contrasena: string) => Promise<void>;
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
        console.log("restaurando sesion: ", token);
        if (!token) {
          setUser(null);
          setIsLoading(false);

          router.replace("/(tabs)/login");
          return;
        }
        try {
          const yo = await httpClient.get<RespuestaYo>("/yo");
          const payload = jwtDecode<TokenPayload>(token);

          yo.data.datos.role = payload.rol;
          setUser(yo.data.datos);
          router.replace("/(tabs)");
        } catch (e) {
          console.error("Error restaurando sesión:", e);
        }
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
      /* console.log("log: ", res.data); */
      const { token, usuario } = res.data.datos;
      setUser(usuario);
      const payload = jwtDecode<TokenPayload>(token);
      /* console.log("pyload.rol: ", payload.rol); // "turista" o "admin" */
      /* console.log("usuario: ", usuario); */
      usuario.role = payload.rol;
      await SecureStore.setItemAsync("user_token", token);
    } catch (e: any) {
      console.log(e);
      if (e.response) {
        // detalle del rechazo en el login
        console.log(
          "Detalle del 400:",
          JSON.stringify(e.response.data, null, 2),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    nombre: string,
    email: string,
    contrasena: string,
  ) => {
    setIsLoading(true);
    try {
      const nuevoUsuario = await httpClient.post<RespuestaIngreso>("/auth/registro", {
        nombre,
        email,
        contrasena,
      });
      const { token, usuario } = nuevoUsuario.data.datos;
      await SecureStore.setItemAsync("user_token", token);
      setUser(usuario)
      router.replace("/(tabs)/index")
    } catch (e) {
      console.log(e);

    }finally{
      setIsLoading(false)
    }
    
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("user_token");
    setUser(null);
    router.replace("/(auth)/login");
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
