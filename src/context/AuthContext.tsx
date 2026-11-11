import React, { createContext, useContext, useEffect, useState } from "react";
import { RespuestaApiExito, RespuestaIngreso, User, Usuario } from "../types";
import { activarSesion, httpClient } from "../servicios/client";
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
  /** true mientras se restaura la sesión guardada al abrir la app. */
  isLoading: boolean;
  /** Hay token guardado: se puede ofrecer el reingreso con huella o rostro. */
  haySesionGuardada: boolean;
  /** El usuario eligió "Explorar como Invitado": puede ver las pestañas sin cuenta. */
  modoInvitado: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, contrasena: string) => Promise<void>;
  entrarComoInvitado: () => void;
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
  const [haySesionGuardada, setHaySesionGuardada] = useState<boolean>(false);
  const [modoInvitado, setModoInvitado] = useState<boolean>(false);

  // Deja al usuario en memoria, en SecureStore y aplica sus preferencias.
  const aplicarUsuario = async (usuario: Usuario) => {
    const preferencias = usuario.preferencias ?? PREFERENCIAS_INICIALES;

    await Promise.all([
      SecureStore.setItemAsync("user_data", JSON.stringify(usuario)),
      guardarPreferenciasLocales(preferencias, usuario.id),
    ]);

    aplicarTema(preferencias.tema);
    activarSesion(true);
    setHaySesionGuardada(true);
    setModoInvitado(false);
    setUser(usuario);
  };

  const guardarSesion = async (token: string, usuario: Usuario) => {
    await SecureStore.setItemAsync("user_token", token);
    await aplicarUsuario(usuario);
  };

  // Cierra la sesión en el teléfono. No toca los datos guardados de la cuenta:
  // favoritos, visitas y agenda quedan separados por usuarioId y vuelven al
  // entrar de nuevo.
  const cerrarSesionLocal = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("user_token"),
      SecureStore.deleteItemAsync("user_data"),
    ]);
    activarSesion(false);
    aplicarTema("sistema");
    setHaySesionGuardada(false);
    setModoInvitado(false);
    setUser(null);
  };

  /**
   * Pide el usuario a la API. Sirve para dos cosas: saber si el token todavía
   * vale (vence a los 30 días) y traer los cambios hechos desde otro teléfono.
   * Sin conexión seguimos con la copia guardada.
   */
  const refrescarSesion = async () => {
    try {
      const res = await httpClient.get<RespuestaApiExito<Usuario>>("/yo", {
        sinCerrarSesion: true,
      });
      await aplicarUsuario(res.data.datos);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await cerrarSesionLocal();
      }
    }
  };

  useEffect(() => {
    // Restaurar la sesión: el token y el usuario quedan guardados en SecureStore.
    // Ojo: acá NO se pide la huella. En Android, si el diálogo del sistema se
    // abre apenas arranca Expo Go, la promesa de authenticateAsync queda
    // colgada para siempre y la app se queda en la pantalla de arranque.
    // Por eso primero mostramos el login y el desbloqueo se pide desde el
    // botón de huella, con la app ya en primer plano.
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

        setHaySesionGuardada(true);
      } catch (e) {
        console.error("Error restaurando sesión:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, contrasena: string) => {
    const res = await httpClient.post<RespuestaIngreso>("/auth/ingreso", {
      email,
      contrasena,
    });
    await guardarSesion(res.data.datos.token, res.data.datos.usuario);
  };

  // El registro público siempre crea una cuenta con el rol común ("turista").
  // El back devuelve la sesión armada, igual que el ingreso.
  const register = async (nombre: string, email: string, contrasena: string) => {
    const res = await httpClient.post<RespuestaIngreso>("/auth/registro", {
      nombre,
      email,
      contrasena,
    });
    await guardarSesion(res.data.datos.token, res.data.datos.usuario);
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
      const usuario = JSON.parse(usuarioGuardado) as Usuario;
      aplicarTema((usuario.preferencias ?? PREFERENCIAS_INICIALES).tema);
      activarSesion(true);
      setModoInvitado(false);
      setUser(usuario);
      refrescarSesion();
    }
    return resultado;
  };

  // "Explorar como Invitado": las pestañas se abren sin cuenta. Es solo de esta
  // sesión de la app; al cerrarla, vuelve a pedir el login.
  const entrarComoInvitado = () => {
    setModoInvitado(true);
  };

  // Lo usan las pantallas que cambian datos de la cuenta (preferencias, perfil).
  const actualizarUsuario = async (usuario: Usuario) => {
    await aplicarUsuario(usuario);
  };

  const logout = async () => {
    await cerrarSesionLocal();
    router.replace("/(auth)/login");
  };

  useEffect(() => {
    // Un 401 en una ruta con sesión cierra la sesión. En /auth no: ahí el 401
    // significa "contraseña incorrecta" y lo maneja la pantalla de login.
    let cerrando = false;
    const interceptorId = httpClient.interceptors.response.use(
      (respuesta) => respuesta,
      async (error) => {
        const url = String(error.config?.url ?? "");
        const enAuth = url.includes("/auth/");

        if (
          error.response?.status === 401 &&
          !enAuth &&
          !error.config?.sinCerrarSesion &&
          !cerrando
        ) {
          cerrando = true;
          try {
            await cerrarSesionLocal();
            router.replace("/(auth)/login");
          } finally {
            cerrando = false;
          }
        }
        return Promise.reject(error);
      },
    );

    // Función de limpieza: solo se ejecuta si AuthProvider se desmonta.
    return () => {
      httpClient.interceptors.response.eject(interceptorId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        haySesionGuardada,
        modoInvitado,
        login,
        register,
        entrarComoInvitado,
        entrarConBiometria,
        actualizarUsuario,
        logout,
      }}
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
