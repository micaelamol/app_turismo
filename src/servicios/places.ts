// src/servicios/places.ts
// Async service layer for Places — required by the PRD

import { MOCK_LUGARES_LISTA } from '../mocks/places';
import {
  Lugar,
  RespuestaApi,
  RespuestaApiError,
  RespuestaApiExito,
} from '../tipos';

// Simulación de delay de red (para garantizar que las pantallas sean asíncronas desde el día 1)
const simularDelay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface FiltrosLugares {
  categoriaId?: string;
  busqueda?: string;
}

/**
 * Obtiene el listado de lugares (hoy desde el mock, mañana vía fetch a la API)
 */
export async function obtenerLugares(
  filtros?: FiltrosLugares
): Promise<RespuestaApiExito<Lugar[]>> {
  await simularDelay();

  let resultado = [...MOCK_LUGARES_LISTA];

  if (filtros?.categoriaId && filtros.categoriaId !== 'all') {
    resultado = resultado.filter(
      (l) => l.categoriaId === filtros.categoriaId
    );
  }

  if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
    const q = filtros.busqueda.toLowerCase();
    resultado = resultado.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.descripcionCorta.toLowerCase().includes(q) ||
        l.direccion.toLowerCase().includes(q)
    );
  }

  return {
    datos: resultado,
    meta: {
      total: resultado.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}

/**
 * Obtiene un lugar por su identificador único
 */
export async function obtenerLugarPorId(
  id: string
): Promise<RespuestaApi<Lugar>> {
  await simularDelay();

  const lugar = MOCK_LUGARES_LISTA.find((l) => l.id === id);

  if (!lugar) {
    const error: RespuestaApiError = {
      error: {
        codigo: 'LUGAR_NO_ENCONTRADO',
        mensaje: `No existe el lugar con id "${id}".`,
      },
    };
    return error;
  }

  return {
    datos: lugar,
  };
}

/**
 * Busca un lugar a partir del código QR escaneado del cartel
 */
export async function obtenerLugarPorQr(
  codigoQr: string
): Promise<RespuestaApi<Lugar>> {
  await simularDelay();

  const lugar = MOCK_LUGARES_LISTA.find((l) => l.codigoQr === codigoQr);

  if (!lugar) {
    const error: RespuestaApiError = {
      error: {
        codigo: 'QR_NO_RECONOCIDO',
        mensaje: 'El código QR escaneado no corresponde a ningún lugar registrado.',
      },
    };
    return error;
  }

  return {
    datos: lugar,
  };
}
