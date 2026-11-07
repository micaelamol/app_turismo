// src/servicios/events.ts
import { Evento, RespuestaApi, RespuestaApiExito } from '../tipos';

const BASE_URL = 'http://192.168.0.102:3000';

/**
 * Obtiene el listado de eventos desde la API de PostgreSQL
 */
export async function obtenerEventos(): Promise<RespuestaApiExito<Evento[]>> {
  const respuesta = await fetch(`${BASE_URL}/eventos`);
  
  if (!respuesta.ok) {
    throw new Error('Error al obtener los eventos del servidor');
  }

  return await respuesta.json();
}

/**
 * Obtiene un evento específico por su ID único
 */
export async function obtenerEventoPorId(id: string): Promise<RespuestaApi<Evento>> {
  const respuesta = await fetch(`${BASE_URL}/eventos/${id}`);
  
  if (!respuesta.ok) {
    throw new Error(`Error al obtener el evento con id "${id}"`);
  }

  return await respuesta.json();
}


// import { MOCK_EVENTOS } from '../mocks/events';
// import { Evento, RespuestaApiExito } from '../tipos';

// const simularDelay = (ms: number = 100) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// export async function obtenerEventos(): Promise<RespuestaApiExito<Evento[]>> {
//   await simularDelay();
//   return {
//     datos: MOCK_EVENTOS,
//     meta: {
//       total: MOCK_EVENTOS.length,
//       pagina: 1,
//       porPagina: 20,
//     },
//   };
// }
