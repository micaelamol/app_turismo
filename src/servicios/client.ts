import axios from "axios";
import * as SecureStore from "expo-secure-store";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * No cerrar la sesión si esta llamada responde 401: lo maneja quien la hace.
     * Se usa al validar la sesión guardada, cuando todavía no hay pantalla.
     */
    sinCerrarSesion?: boolean;
  }
}

export const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// La sesión viaja solo cuando está desbloqueada. Si el teléfono pide huella y
// la persona cancela, la app sigue como invitada y no manda el token guardado.
let sesionActiva = false;

export function activarSesion(activa: boolean): void {
  sesionActiva = activa;
}

// Antes de cada petición: adjuntar el token.
httpClient.interceptors.request.use(async (config) => {
  if (!sesionActiva) return config;
  const token = await SecureStore.getItemAsync("user_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
