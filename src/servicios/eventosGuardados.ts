// src/servicios/eventosGuardados.ts
// Eventos guardados de la cuenta (PRD §3). La API solo acepta guardar eventos
// programados o suspendidos; si el evento ya terminó responde 422.
import { Evento, RespuestaApiExito } from '../tipos';
import { httpClient } from './client';

/** Eventos que la cuenta tiene guardados en el servidor, con todos sus datos. */
export async function obtenerEventosGuardadosDeLaCuenta(): Promise<Evento[]> {
  const res = await httpClient.get<RespuestaApiExito<Evento[]>>('/yo/eventos-guardados');
  return res.data.datos ?? [];
}

/** PUT /yo/eventos-guardados/:eventoId */
export async function guardarEventoEnServidor(eventoId: string): Promise<void> {
  await httpClient.put(`/yo/eventos-guardados/${eventoId}`);
}

/** DELETE /yo/eventos-guardados/:eventoId */
export async function quitarEventoDelServidor(eventoId: string): Promise<void> {
  await httpClient.delete(`/yo/eventos-guardados/${eventoId}`);
}
