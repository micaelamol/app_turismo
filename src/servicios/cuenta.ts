// src/servicios/cuenta.ts
// Datos de la cuenta que se pueden cambiar (PRD, tabla Usuario: nombre y
// avatarUrl). El back los recibe juntos en PATCH /yo (R18: mezcla campo a campo).
import { RespuestaApiExito, Usuario } from '../tipos';
import { httpClient } from './client';

export interface CambiosCuenta {
  nombre?: string;
  avatarUrl?: string | null;
}

/** Manda solo lo que cambió y devuelve el usuario como quedó en el servidor. */
export async function actualizarCuenta(cambios: CambiosCuenta): Promise<Usuario> {
  const res = await httpClient.patch<RespuestaApiExito<Usuario>>('/yo', cambios);
  return res.data.datos;
}
