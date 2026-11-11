// src/servicios/favoritos.ts
// Favoritos de la cuenta. La API los guarda por usuario (PRD §5) y la app los
// espeja en el teléfono para que sigan estando sin señal.
import { RespuestaApiExito } from '../tipos';
import { httpClient } from './client';

interface FavoritoApi {
  id: string;
  usuarioId: string;
  lugarId: string;
  creadoEn: string;
}

/** IDs de los lugares que la cuenta tiene como favoritos en el servidor. */
export async function obtenerFavoritos(): Promise<string[]> {
  const res = await httpClient.get<RespuestaApiExito<FavoritoApi[]>>('/yo/favoritos');
  return (res.data.datos ?? []).map((f) => f.lugarId);
}

/** PUT /yo/favoritos/:lugarId (es idempotente). */
export async function agregarFavorito(lugarId: string): Promise<void> {
  await httpClient.put(`/yo/favoritos/${lugarId}`);
}

/** DELETE /yo/favoritos/:lugarId. Si ya no estaba, la API responde 404 y da igual. */
export async function quitarFavorito(lugarId: string): Promise<void> {
  await httpClient.delete(`/yo/favoritos/${lugarId}`);
}
