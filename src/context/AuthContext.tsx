import React, { createContext, useContext, useEffect, useState } from "react";
import { RespuestaIngreso, User } from "../types";
import { httpClient } from "../servicios/client";
import { pedirBiometria, ResultadoBiometria } from "../servicios/biometria";
import {
  aplicarTema,
  guardarPreferenciasLocales,
  PREFERENCIAS_INICIALES,
} from "../servicios/preferencias";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, contrasena: string) => Promise<void>;
  entrarConBiometria: () => Promise<ResultadoBiometria>;
  actualizarUsuario: (usuario: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Restaurar la sesión: el token y el usuario quedan guardados en SecureStore.
    const initSession = async () => {
      try {
        const [token, usuarioGuardado] = await Promise.all([
          SecureStore.getItemAsync("user_token"),
          SecureStore.getItemAsync("user_data"),
        ]);

        if (!token || !usuarioGuardado) {
          setUser(null);
          return;
        }

        // Si el teléfono tiene huella o rostro configurado, la sesión se abre
        // con eso. Si el usuario cancela, no lo dejamos adentro: vuelve al
        // login, donde puede reintentar o escribir la contraseña.
        const resultado = await pedirBiometria("Entrá a Colón Turismo");
        if (resultado === "cancelada" || resultado === "fallida") {
          setUser(null);
          return;
        }

        const usuario = JSON.parse(usuarioGuardado) as User;
        const preferencias = usuario.preferencias ?? PREFERENCIAS_INICIALES;

        aplicarTema(preferencias.tema);
        guardarPreferenciasLocales(preferencias, usuario.id).catch(() => {});
        setUser(usuario);
      } catch (e) {
        console.error("Error restaurando sesión:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // Guarda la sesión en SecureStore y deja las preferencias en el teléfono.
  const guardarSesion = async (token: string, usuario: User) => {
    const preferencias = usuario.preferencias ?? PREFERENCIAS_INICIALES;

    await Promise.all([
      SecureStore.setItemAsync("user_token", token),
      SecureStore.setItemAsync("user_data", JSON.stringify(usuario)),
      guardarPreferenciasLocales(preferencias, usuario.id),
    ]);

    aplicarTema(preferencias.tema);
    setUser(usuario);
  };

  const login = async (email: string, contrasena: string) => {
    setIsLoading(true);
    try {
      const res = await httpClient.post<RespuestaIngreso>("/auth/ingreso", {
        email,
        contrasena,
      });
      await guardarSesion(res.data.datos.token, res.data.datos.usuario);
    } finally {
      setIsLoading(false);
    }
  };

  // El registro público siempre crea una cuenta con el rol común ("turista").
  // El back devuelve la sesión armada, igual que el ingreso.
  const register = async (nombre: string, email: string, contrasena: string) => {
    setIsLoading(true);
    try {
      const res = await httpClient.post<RespuestaIngreso>("/auth/registro", {
        nombre,
        email,
        contrasena,
      });
      await guardarSesion(res.data.datos.token, res.data.datos.usuario);
    } finally {
      setIsLoading(false);
    }
  };

  // Reingreso con huella o rostro sobre la sesión que ya está guardada.
  const entrarConBiometria = async (): Promise<ResultadoBiometria> => {
    const [token, usuarioGuardado] = await Promise.all([
      SecureStore.getItemAsync("user_token"),
      SecureStore.getItemAsync("user_data"),
    ]);

    if (!token || !usuarioGuardado) return "sin-sesion";

    const resultado = await pedirBiometria("Entrá a Colón Turismo");
    if (resultado === "ok") {
      const usuario = JSON.parse(usuarioGuardado) as User;
      aplicarTema((usuario.preferencias ?? PREFERENCIAS_INICIALES).tema);
      setUser(usuario);
    }
    return resultado;
  };

  // Lo usan las pantallas que cambian datos de la cuenta (por ejemplo, preferencias).
  const actualizarUsuario = async (usuario: User) => {
    await SecureStore.setItemAsync("user_data", JSON.stringify(usuario));
    setUser(usuario);
  };

  const logout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("user_token"),
      SecureStore.deleteItemAsync("user_data"),
    ]);
    setUser(null);
    router.push("/(auth)/login");
  };

  useEffect(() => {
    // Un 401 en una ruta con sesión cierra la sesión. En /auth no: ahí el 401
    // significa "contraseña incorrecta" y lo maneja la pantalla de login.
    const interceptorId = httpClient.interceptors.response.use(
      (respuesta) => respuesta,
      async (error) => {
        const url = String(error.config?.url ?? "");
        if (error.response?.status === 401 && !url.includes("/auth/")) {
          await logout();
        }
        return Promise.reject(error);
      },
    );

    // 2. Función de limpieza (cleanup): solo se ejecuta si AuthProvider se desmonta
    return () => {
      httpClient.interceptors.response.eject(interceptorId);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, entrarConBiometria, actualizarUsuario, logout }}
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
