// src/servicios/visitas.ts
// Visitas de la cuenta. La API las guarda por usuario (PRD §4) y la app las
// espeja en recorrido_offline.db para poder mostrarlas sin señal.
import { OrigenVisita, RespuestaApiExito, Visita } from '../tipos';
import { esArchivoLocal, subirArchivo } from './archivos';
import { httpClient } from './client';
import {
  actualizarVisita,
  listarVisitasSinSincronizar,
} from './visitasDb';

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

function mapearVisita(v: VisitaApi): Visita {
  return {
    id: v.id,
    usuarioId: v.usuarioId,
    lugarId: v.lugarId,
    fechaHora: v.fechaHora,
    origen: v.origen ?? 'manual',
    fotoUri: v.fotoUri,
    nota: v.nota,
    sincronizada: v.sincronizada ?? true,
  };
}

/** Todas las visitas de la cuenta, ya en la forma que usa la app. */
export async function obtenerVisitasDeLaCuenta(): Promise<Visita[]> {
  const res = await httpClient.get<RespuestaApiExito<VisitaApi[]>>('/yo/visitas');
  return (res.data.datos ?? []).map(mapearVisita);
}

/**
 * Sube una visita guardada en el teléfono. Primero la foto (si es un archivo
 * local), después la visita. La API es idempotente por id: si ya la tenía,
 * devuelve la existente y recién ahí mandamos la nota o la foto que falte.
 */
async function subirVisita(visita: Visita): Promise<void> {
  let fotoUri = visita.fotoUri;
  if (esArchivoLocal(fotoUri)) {
    fotoUri = await subirArchivo(fotoUri as string);
  }

  const res = await httpClient.post<RespuestaApiExito<VisitaApi>>('/yo/visitas', {
    id: visita.id,
    lugarId: visita.lugarId,
    fechaHora: visita.fechaHora,
    origen: visita.origen,
    fotoUri,
    nota: visita.nota,
  });

  const guardada = mapearVisita(res.data.datos);

  // Si la API ya la conocía, el POST no pisa la nota ni la foto: las mandamos
  // aparte solo si difieren de lo que tenemos en el teléfono.
  const cambios: { fotoUri?: string | null; nota?: string | null } = {};
  if ((visita.nota ?? null) !== (guardada.nota ?? null)) cambios.nota = visita.nota;
  if ((fotoUri ?? null) !== (guardada.fotoUri ?? null)) cambios.fotoUri = fotoUri;

  if (Object.keys(cambios).length > 0) {
    await httpClient.patch(`/yo/visitas/${visita.id}`, cambios);
  }

  // La foto se queda en el teléfono para verla sin señal; solo marcamos que ya
  // está en la cuenta.
  await actualizarVisita(visita.id, { sincronizada: true });
}

// Una sola subida a la vez: la cola se dispara desde varios lados.
let sincronizando = false;

/**
 * Sube la cola de visitas sin sincronizar de la cuenta. Devuelve cuántas subió.
 * Si una falla (sin señal, por ejemplo), queda pendiente para el próximo intento.
 */
export async function sincronizarVisitasPendientes(usuarioId: string): Promise<number> {
  if (!usuarioId || usuarioId === 'local' || sincronizando) return 0;

  sincronizando = true;
  let subidas = 0;

  try {
    const pendientes = await listarVisitasSinSincronizar(usuarioId);
    for (const visita of pendientes) {
      try {
        await subirVisita(visita);
        subidas += 1;
      } catch (error: any) {
        console.warn('No se pudo subir la visita', visita.id, error?.message ?? error);
        // Sin conexión no tiene sentido seguir con las demás.
        if (!error?.response) break;
      }
    }
  } finally {
    sincronizando = false;
  }

  return subidas;
}
