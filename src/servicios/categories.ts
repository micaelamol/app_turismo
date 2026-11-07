// src/servicios/categories.ts
import { Categoria, RespuestaApiExito } from '../tipos';

const BASE_URL = 'http://192.168.0.102:3000';

/**
 * Obtiene el listado de categorías desde la API de PostgreSQL
 */
export async function obtenerCategorias(): Promise<RespuestaApiExito<Categoria[]>> {
  const respuesta = await fetch(`${BASE_URL}/categorias`);
  
  if (!respuesta.ok) {
    throw new Error('Error al obtener las categorías del servidor');
  }

  return await respuesta.json();
}


// import { MOCK_CATEGORIAS } from '../mocks/categories';
// import { Categoria, RespuestaApiExito } from '../tipos';

// const simularDelay = (ms: number = 100) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// export async function obtenerCategorias(): Promise<RespuestaApiExito<Categoria[]>> {
//   await simularDelay();
//   return {
//     datos: MOCK_CATEGORIAS,
//     meta: {
//       total: MOCK_CATEGORIAS.length,
//       pagina: 1,
//       porPagina: 20,
//     },
//   };
// }

