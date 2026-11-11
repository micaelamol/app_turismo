// src/servicios/preferencias.ts
// Preferencias de la cuenta (PRD, tabla técnica: "preferencias" en expo-sqlite/kv-store).
// El servidor manda; el teléfono guarda una copia para leerlas sin señal.
import { Appearance } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { Preferencias, RespuestaApiExito, Usuario } from '../tipos';
import { httpClient } from './client';

const CLAVE = 'preferencias_v1';

/** Cada cuenta (y el invitado, con 'local') tiene su propia copia en el teléfono. */
function claveDe(usuarioId: string): string {
  return `${CLAVE}:${usuarioId}`;
}

/** Las mismas con las que arranca toda cuenta nueva en la API. */
export const PREFERENCIAS_INICIALES: Preferencias = {
  categoriasFavoritas: [],
  avisarProximidad: true,
  radioAvisoMetros: 250,
  tema: 'sistema',
};

export async function leerPreferenciasLocales(usuarioId = 'local'): Promise<Preferencias> {
  try {
    const guardadas = await Storage.getItem(claveDe(usuarioId));
    if (!guardadas) return PREFERENCIAS_INICIALES;
    return { ...PREFERENCIAS_INICIALES, ...JSON.parse(guardadas) };
  } catch {
    return PREFERENCIAS_INICIALES;
  }
}

export async function guardarPreferenciasLocales(
  preferencias: Preferencias,
  usuarioId = 'local'
): Promise<void> {
  await Storage.setItem(claveDe(usuarioId), JSON.stringify(preferencias));
}

/**
 * PATCH /yo. El back mezcla campo a campo (R18), así que se puede mandar solo
 * lo que cambió. Devuelve el usuario ya actualizado.
 */
export async function actualizarPreferencias(
  cambios: Partial<Preferencias>
): Promise<Usuario> {
  const res = await httpClient.patch<RespuestaApiExito<Usuario>>('/yo', {
    preferencias: cambios,
  });
  return res.data.datos;
}

/** El tema elegido se aplica al sistema; "sistema" vuelve a seguir al teléfono. */
export function aplicarTema(tema: Preferencias['tema']): void {
  try {
    const esquema = tema === 'oscuro' ? 'dark' : tema === 'claro' ? 'light' : null;
    Appearance.setColorScheme(esquema);
  } catch {
    // En versiones viejas de React Native esto no existe: no pasa nada.
  }
}
