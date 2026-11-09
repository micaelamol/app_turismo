// src/servicios/events.ts
import { Evento, RespuestaApi, RespuestaApiExito } from '../tipos';


/**
 * Obtiene el listado de eventos desde la API de PostgreSQL
 */
export async function obtenerEventos(): Promise<RespuestaApiExito<Evento[]>> {
  const respuesta = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/eventos`);
  
  if (!respuesta.ok) {
    throw new Error('Error al obtener los eventos del servidor');
  }

  return await respuesta.json();
}

/**
 * Obtiene un evento específico por su ID único
 */
export async function obtenerEventoPorId(id: string): Promise<RespuestaApi<Evento>> {
  const respuesta = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/eventos/${id}`);
  
  if (!respuesta.ok) {
    throw new Error(`Error al obtener el evento con id "${id}"`);
  }

  return await respuesta.json();
}


