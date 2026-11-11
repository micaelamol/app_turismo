// src/servicios/visitas.ts
// Visitas de la cuenta. La API las guarda por usuario (PRD §4) y la app las
// espeja en recorrido_offline.db para poder mostrarlas sin señal.
import { OrigenVisita, RespuestaApiExito, Visita } from '../tipos';
import { httpClient } from './client';

interface VisitaApi {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: boolean;
}

/** Todas las visitas de la cuenta, ya en la forma que usa la app. */
export async function obtenerVisitasDeLaCuenta(): Promise<Visita[]> {
  const res = await httpClient.get<RespuestaApiExito<VisitaApi[]>>('/yo/visitas');
  return (res.data.datos ?? []).map((v) => ({
    id: v.id,
    usuarioId: v.usuarioId,
    lugarId: v.lugarId,
    fechaHora: v.fechaHora,
    origen: v.origen ?? 'manual',
    fotoUri: v.fotoUri,
    nota: v.nota,
    sincronizada: v.sincronizada ?? true,
  }));
}
