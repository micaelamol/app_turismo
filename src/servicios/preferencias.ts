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
    return normalizarPreferencias({ ...PREFERENCIAS_INICIALES, ...JSON.parse(guardadas) });
  } catch {
    return PREFERENCIAS_INICIALES;
  }
}

/**
 * La app tiene un solo diseño, claro. Si una cuenta vieja quedó con `oscuro`,
 * la pasamos a `sistema` para no guardar un valor que la app no puede mostrar.
 */
export function normalizarPreferencias(preferencias: Preferencias): Preferencias {
  return preferencias.tema === 'oscuro'
    ? { ...preferencias, tema: 'sistema' }
    : preferencias;
}

export async function guardarPreferenciasLocales(
  preferencias: Preferencias,
  usuarioId = 'local'
): Promise<void> {
  await Storage.setItem(claveDe(usuarioId), JSON.stringify(preferencias));
  avisarCambioDePreferencias(preferencias, usuarioId);
}

/**
 * La pantalla de preferencias y el aviso de proximidad están separados.
 * Con esto, al guardar el interruptor el aviso se entera en el momento
 * (sin tener que cerrar y abrir la app).
 */
type OyentePreferencias = (preferencias: Preferencias, usuarioId: string) => void;
const oyentesDePreferencias = new Set<OyentePreferencias>();

export function alGuardarPreferencias(oyente: OyentePreferencias): () => void {
  oyentesDePreferencias.add(oyente);
  return () => {
    oyentesDePreferencias.delete(oyente);
  };
}

function avisarCambioDePreferencias(preferencias: Preferencias, usuarioId: string): void {
  oyentesDePreferencias.forEach((oyente) => {
    try {
      oyente(preferencias, usuarioId);
    } catch (error) {
      console.warn('No se pudo avisar el cambio de preferencias', error);
    }
  });
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

/**
 * Las pantallas están pensadas en claro, así que el teléfono queda en claro
 * aunque la persona use modo noche. Si no, la barra de estado y los diálogos
 * se ponen oscuros sobre pantallas blancas y no se leen.
 */
export function aplicarTema(_tema: Preferencias['tema']): void {
  try {
    Appearance.setColorScheme('light');
  } catch {
    // En versiones viejas de React Native esto no existe: no pasa nada.
  }
}
