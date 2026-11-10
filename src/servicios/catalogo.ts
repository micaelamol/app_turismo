// src/servicios/catalogo.ts
// Estrategia "red primero, caché después" para el catálogo de lugares.
// PRD §7: "si ya abrió la app en el hotel, después pueda seguir viendo
// los lugares y su recorrido" sin conexión.

import { Lugar } from '../tipos';
import { obtenerLugares } from './places';
import {
  contarCatalogo,
  fechaActualizacionCatalogo,
  guardarCatalogo,
  leerCatalogo,
} from './catalogoDb';

export type OrigenCatalogo = 'red' | 'cache';

export interface ResultadoCatalogo {
  datos: Lugar[];
  origen: OrigenCatalogo;
  actualizadoEn: string | null;
}

async function leerCache(): Promise<ResultadoCatalogo | null> {
  try {
    const total = await contarCatalogo();
    if (total === 0) return null;

    const datos = await leerCatalogo();
    if (datos.length === 0) return null;

    return {
      datos,
      origen: 'cache',
      actualizadoEn: await fechaActualizacionCatalogo(),
    };
  } catch (error) {
    console.warn('No se pudo leer el catálogo offline', error);
    return null;
  }
}

/**
 * Devuelve el catálogo completo. Si hay red, lo baja y lo guarda en SQLite.
 * Si la red falla y hay caché, devuelve la copia local (origen: "cache").
 * Si no hay ni red ni caché, relanza el error original para que la pantalla
 * muestre su estado de error.
 */
export async function cargarCatalogo(): Promise<ResultadoCatalogo> {
  try {
    const respuesta = await obtenerLugares();
    const datos = Array.isArray(respuesta.datos) ? respuesta.datos : [];

    if (datos.length > 0) {
      const actualizadoEn = new Date().toISOString();
      try {
        await guardarCatalogo(datos);
      } catch (error) {
        // Si falla el guardado, igual mostramos los datos de la red.
        console.warn('No se pudo guardar el catálogo offline', error);
      }
      return { datos, origen: 'red', actualizadoEn };
    }

    // La API respondió sin lugares: preferimos la copia local si existe.
    return (await leerCache()) ?? { datos: [], origen: 'red', actualizadoEn: null };
  } catch (error) {
    const cache = await leerCache();
    if (cache) return cache;
    throw error;
  }
}

/** Fuerza una actualización del catálogo (botón "Actualizar" de la pantalla). */
export async function refrescarCatalogo(): Promise<ResultadoCatalogo> {
  return cargarCatalogo();
}
