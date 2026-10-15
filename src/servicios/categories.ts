// src/servicios/categories.ts
import { MOCK_CATEGORIAS } from '../mocks/categories';
import { Categoria, RespuestaApiExito } from '../tipos';

const simularDelay = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function obtenerCategorias(): Promise<RespuestaApiExito<Categoria[]>> {
  await simularDelay();
  return {
    datos: MOCK_CATEGORIAS,
    meta: {
      total: MOCK_CATEGORIAS.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}
