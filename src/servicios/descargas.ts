// src/servicios/descargas.ts
// Descarga real de lugares con la API NUEVA de expo-file-system (File, Directory, Paths).
// Cumple el requisito 4: expo-file-system con File/Directory/Paths.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Directory, File, Paths } from 'expo-file-system';
import { Lugar } from '../tipos';
import { ARCHIVO_AUDIO } from './audioguias';
import {
  DescargaLugar,
  NivelDescarga,
  eliminarDescargaDeDb,
  eliminarTodasLasDescargasDeDb,
  guardarDescarga,
  pesoTotalDescargas,
} from './descargasDb';

const SOLO_WIFI_KEY = '@descargas:soloWifi';
const DIRECTORIO_BASE = 'colon_descargas';

export type { NivelDescarga, DescargaLugar };

/** Preferencia "solo con Wi-Fi" (por defecto activada). */
export async function obtenerPreferenciaSoloWifi(): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(SOLO_WIFI_KEY);
    if (valor === null) return true;
    return valor === 'true';
  } catch {
    return true;
  }
}

export async function guardarPreferenciaSoloWifi(valor: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOLO_WIFI_KEY, String(valor));
  } catch {
    // Ignoramos: la preferencia es secundaria.
  }
}

/** Directorio base donde se guardan todas las descargas. */
export function obtenerDirectorioBase(): Directory {
  const dir = new Directory(Paths.document, DIRECTORIO_BASE);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/**
 * Ruta local de la audioguía de un lugar, si ya se descargó.
 * PRD §6: la audioguía tiene que poder escucharse sin conexión.
 */
export function obtenerAudioguiaLocal(lugarId: string): string | null {
  const archivo = new File(Paths.document, DIRECTORIO_BASE, lugarId, ARCHIVO_AUDIO);
  return archivo.exists ? archivo.uri : null;
}

/** Verifica si se puede descargar según la preferencia de Wi-Fi. */
export async function verificarWifiParaDescarga(): Promise<{ ok: boolean; mensaje?: string }> {
  const soloWifi = await obtenerPreferenciaSoloWifi();
  if (!soloWifi) return { ok: true };

  try {
    const estado = await Network.getNetworkStateAsync();
    if (estado.type === Network.NetworkStateType.WIFI) {
      return { ok: true };
    }
    return {
      ok: false,
      mensaje:
        'Estás sin Wi-Fi. Conectate a una red Wi-Fi o desactivá "Solo con Wi-Fi" en Mis descargas.',
    };
  } catch {
    // Si no podemos leer el estado de red, dejamos pasar.
    return { ok: true };
  }
}

/** Estimación de peso según el nivel y la cantidad de imágenes. */
export function estimarPesoBytes(lugar: Lugar, nivel: NivelDescarga): number {
  const imagenes = lugar.imagenes?.length ?? 0;
  const porImagen = 2048; // ~2 KB por imagen (medido en la API del profe)
  const datos = 1024; // ~1 KB de datos JSON
  const audio = lugar.audioguia ? 260_000 : 0; // audioguías de 3 a 5 minutos
  if (nivel === 'liviano') {
    return datos + porImagen + audio; // portada
  }
  return datos + imagenes * porImagen + audio;
}

/** Formatea bytes a texto legible. */
export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Descarga un lugar al dispositivo.
 * - liviano: datos + portada + audioguía (si tiene)
 * - completo: datos + galería completa + audioguía (si tiene)
 */
export async function descargarLugar(
  lugar: Lugar,
  nivel: NivelDescarga
): Promise<DescargaLugar> {
  const check = await verificarWifiParaDescarga();
  if (!check.ok) {
    throw new Error(check.mensaje);
  }

  const imagenes =
    lugar.imagenes && lugar.imagenes.length > 0
      ? lugar.imagenes
      : lugar.imageUrl
      ? [lugar.imageUrl]
      : [];

  const cantidad = nivel === 'completo' ? imagenes.length : Math.min(1, imagenes.length);

  const base = obtenerDirectorioBase();
  const subdir = new Directory(base, lugar.id);
  // Si ya existía, la borramos para no mezclar archivos viejos.
  if (subdir.exists) {
    subdir.delete();
  }
  subdir.create();

  const galeriaLocal: string[] = [];
  let portadaLocal: string | null = null;
  let pesoBytes = 0;

  for (let i = 0; i < cantidad; i++) {
    const url = imagenes[i];
    if (!url) continue;

    const nombre = i === 0 ? 'portada.jpg' : `galeria_${i}.jpg`;
    const destino = new File(subdir, nombre);

    try {
      const descargado = await File.downloadFileAsync(url, destino);
      const uri = descargado.uri;
      if (i === 0) portadaLocal = uri;
      galeriaLocal.push(uri);
      pesoBytes += descargado.size ?? 0;
    } catch (error) {
      // Si una imagen falla, seguimos con las demás.
      console.warn(`No se pudo descargar la imagen ${url}`, error);
    }
  }

  const lugarActualizado: Lugar = {
    ...lugar,
    imagenes: galeriaLocal.length > 0 ? galeriaLocal : lugar.imagenes,
    imageUrl: portadaLocal ?? lugar.imageUrl,
  };

  // PRD §6: la audioguía también se baja, para poder escucharla sin conexión.
  if (lugar.audioguia?.url) {
    try {
      const destino = new File(subdir, ARCHIVO_AUDIO);
      const descargado = await File.downloadFileAsync(lugar.audioguia.url, destino);
      lugarActualizado.audioguia = { ...lugar.audioguia, url: descargado.uri };
      pesoBytes += descargado.size ?? 0;
    } catch (error) {
      // Sin audioguía local, la ficha igual sirve offline (y el audio queda para streaming).
      console.warn(`No se pudo descargar la audioguía de ${lugar.id}`, error);
    }
  }

  const descarga: DescargaLugar = {
    id: lugar.id,
    datos: lugarActualizado,
    nivel,
    pesoBytes: pesoBytes > 0 ? pesoBytes : estimarPesoBytes(lugar, nivel),
    portadaLocal,
    galeriaLocal,
    descargadoEn: new Date().toISOString(),
    actualizadoEn: lugar.actualizadoEn ?? null,
  };

  await guardarDescarga(descarga);
  return descarga;
}

/** Borra un lugar descargado (archivos + base). */
export async function eliminarDescarga(id: string): Promise<void> {
  const base = obtenerDirectorioBase();
  const subdir = new Directory(base, id);
  if (subdir.exists) {
    subdir.delete();
  }
  await eliminarDescargaDeDb(id);
}

/** Borra todas las descargas. */
export async function eliminarTodasLasDescargas(): Promise<void> {
  const base = obtenerDirectorioBase();
  if (base.exists) {
    const items = base.list();
    for (const item of items) {
      if (item instanceof Directory) {
        item.delete();
      } else if (item instanceof File) {
        item.delete();
      }
    }
  }
  await eliminarTodasLasDescargasDeDb();
}

/** Peso total ocupado por las descargas. */
export async function pesoTotalDescargasBytes(): Promise<number> {
  return pesoTotalDescargas();
}
