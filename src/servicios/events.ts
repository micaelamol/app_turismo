// src/servicios/events.ts
import { Evento, RespuestaApi, RespuestaApiExito } from '../tipos';


/**
 * La API pagina los eventos: 20 por defecto y hasta 100 por página.
 * Pedimos el máximo y, si hay más, seguimos con las páginas que falten
 * leyendo `meta.total`, igual que con los lugares.
 */
const POR_PAGINA_EVENTOS = 100;

/**
 * Obtiene el listado completo de eventos desde la API de PostgreSQL
 */
export async function obtenerEventos(): Promise<RespuestaApiExito<Evento[]>> {
  const todos: Evento[] = [];
  let pagina = 1;
  let total = 0;

  for (;;) {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/eventos?pagina=${pagina}&porPagina=${POR_PAGINA_EVENTOS}`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error('Error al obtener los eventos del servidor');
    }

    const cuerpo = (await respuesta.json()) as RespuestaApiExito<Evento[]>;
    const datos = Array.isArray(cuerpo.datos) ? cuerpo.datos : [];
    todos.push(...datos);
    total = cuerpo.meta?.total ?? todos.length;

    // Sin datos, o ya tenemos todo el listado: no hay más páginas.
    if (datos.length === 0 || todos.length >= total) break;
    pagina += 1;
  }

  return { datos: todos, meta: { total, pagina: 1, porPagina: todos.length } };
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


