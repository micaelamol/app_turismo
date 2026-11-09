import {
  Lugar,
  RespuestaApi,
  RespuestaApiError,
  RespuestaApiExito,
} from '../tipos';

export interface FiltrosLugares {
  categoriaId?: string;
  busqueda?: string;
}

/**
 * Obtiene el listado de lugares desde la API de PostgreSQL con filtros
 */
export async function obtenerLugares(
  filtros?: FiltrosLugares
): Promise<RespuestaApiExito<Lugar[]>> {
  const params = new URLSearchParams();
  
  // Forzamos un límite alto por página para asegurar traer tus 27 registros reales sin cortes
  params.append('porPagina', '50');
  
  if (filtros?.categoriaId && filtros.categoriaId !== 'all') {
    params.append('categoriaId', filtros.categoriaId);
  }
  
  // CORRECCIÓN: El backend espera 'q' para realizar la consulta sobre la base de datos
  if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
    params.append('q', filtros.busqueda.trim());
  }

  const url = `${process.env.EXPO_PUBLIC_API_URL}/lugares?${params.toString()}`;
  const respuesta = await fetch(url);
  
  if (!respuesta.ok) {
    throw new Error('Error al obtener los lugares del servidor');
  }

  return await respuesta.json();
}

/**
 * Obtiene un lugar por su identificador único directamente de la base de datos
 */
export async function obtenerLugarPorId(
  id: string
): Promise<RespuestaApi<Lugar>> {
  const respuesta = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/lugares/${id}`);
  
  if (!respuesta.ok) {
    const error: RespuestaApiError = {
      error: {
        codigo: 'LUGAR_NO_ENCONTRADO',
        mensaje: `No se pudo encontrar el lugar con id "${id}" en el servidor.`,
      },
    };
    return error;
  }

  return await respuesta.json();
}

/**
 * Busca un lugar a partir del código QR escaneado del cartel utilizando la API
 */
export async function obtenerLugarPorQr(
  codigoQr: string
): Promise<RespuestaApi<Lugar>> {
  const respuesta = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/lugares/qr/${encodeURIComponent(codigoQr)}`);
  
  if (!respuesta.ok) {
    const error: RespuestaApiError = {
      error: {
        codigo: 'QR_NO_RECONOCIDO',
        mensaje: 'El código QR escaneado no corresponde a ningún lugar registrado.',
      },
    };
    return error;
  }

  return await respuesta.json();
}
