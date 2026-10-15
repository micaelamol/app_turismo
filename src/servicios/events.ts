// src/servicios/events.ts
import { MOCK_EVENTOS } from '../mocks/events';
import { Evento, RespuestaApiExito } from '../tipos';


const simularDelay = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function obtenerEventos(): Promise<RespuestaApiExito<Evento[]>> {
  await simularDelay();
  return {
    datos: MOCK_EVENTOS,
    meta: {
      total: MOCK_EVENTOS.length,
      pagina: 1,
      porPagina: 20,
    },
  };
}
