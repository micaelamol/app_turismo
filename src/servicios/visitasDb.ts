// src/servicios/visitasDb.ts
// Base SQLite propia del bloque "Mi recorrido" (PRD §4 y §7).
// Archivo propio (recorrido_offline.db) para no chocar con las bases de otros bloques.
//
// El PRD pide que la visita se guarde primero en el teléfono con sincronizada: false
// y se suba cuando vuelva la conexión. Esa cola local vive acá.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { OrigenVisita, Visita } from '../tipos';

interface VisitaRow {
  id: string;
  usuario_id: string;
  lugar_id: string;
  fecha_hora: string;
  origen: string;
  foto_uri: string | null;
  nota: string | null;
  sincronizada: number;
  lugar_nombre: string | null;
  lugar_imagen: string | null;
}

const NOMBRE_BASE = 'recorrido_offline.db';
const CLAVE_MIGRACION = 'migracion_historial_legado_v1';

const CLAVES_LEGADO = {
  visitados: '@visitedPlaces',
  fotos: '@visitPhotos',
} as const;

let apertura: Promise<SQLite.SQLiteDatabase> | null = null;
let inicializacion: Promise<void> | null = null;

function abrirBase(): Promise<SQLite.SQLiteDatabase> {
  if (!apertura) {
    apertura = SQLite.openDatabaseAsync(NOMBRE_BASE);
  }
  return apertura;
}

export function inicializarVisitasDb(): Promise<void> {
  if (!inicializacion) {
    inicializacion = (async () => {
      const db = await abrirBase();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS visitas (
          id TEXT PRIMARY KEY NOT NULL,
          usuario_id TEXT NOT NULL,
          lugar_id TEXT NOT NULL,
          fecha_hora TEXT NOT NULL,
          origen TEXT NOT NULL DEFAULT 'manual',
          foto_uri TEXT,
          nota TEXT,
          sincronizada INTEGER NOT NULL DEFAULT 0,
          lugar_nombre TEXT,
          lugar_imagen TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas (fecha_hora DESC);
        CREATE INDEX IF NOT EXISTS idx_visitas_lugar ON visitas (lugar_id);
        CREATE TABLE IF NOT EXISTS recorrido_meta (
          clave TEXT PRIMARY KEY NOT NULL,
          valor TEXT NOT NULL
        );
      `);

      // Bases creadas antes de la copia del lugar: agregamos las columnas.
      const columnas = await db.getAllAsync<{ name: string }>('PRAGMA table_info(visitas);');
      const nombres = new Set(columnas.map((c) => c.name));
      if (!nombres.has('lugar_nombre')) {
        await db.execAsync('ALTER TABLE visitas ADD COLUMN lugar_nombre TEXT;');
      }
      if (!nombres.has('lugar_imagen')) {
        await db.execAsync('ALTER TABLE visitas ADD COLUMN lugar_imagen TEXT;');
      }
    })().catch((error) => {
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
}

function filaAVisita(fila: VisitaRow): Visita {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    lugarId: fila.lugar_id,
    fechaHora: fila.fecha_hora,
    origen: (fila.origen as OrigenVisita) ?? 'manual',
    fotoUri: fila.foto_uri,
    nota: fila.nota,
    sincronizada: fila.sincronizada === 1,
    lugarNombre: fila.lugar_nombre,
    lugarImagen: fila.lugar_imagen,
  };
}

/** Visitas más recientes primero. */
export async function listarVisitas(): Promise<Visita[]> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  const filas = await db.getAllAsync<VisitaRow>(
    'SELECT * FROM visitas ORDER BY fecha_hora DESC, id DESC;'
  );
  return filas.map(filaAVisita);
}

export async function listarVisitasDeLugar(lugarId: string): Promise<Visita[]> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  const filas = await db.getAllAsync<VisitaRow>(
    'SELECT * FROM visitas WHERE lugar_id = ? ORDER BY fecha_hora DESC, id DESC;',
    [lugarId]
  );
  return filas.map(filaAVisita);
}

export async function guardarVisita(visita: Visita): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  await db.runAsync(
    `INSERT OR REPLACE INTO visitas
       (id, usuario_id, lugar_id, fecha_hora, origen, foto_uri, nota, sincronizada,
        lugar_nombre, lugar_imagen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      visita.id,
      visita.usuarioId,
      visita.lugarId,
      visita.fechaHora,
      visita.origen,
      visita.fotoUri,
      visita.nota,
      visita.sincronizada ? 1 : 0,
      visita.lugarNombre ?? null,
      visita.lugarImagen ?? null,
    ]
  );
}

export interface CambiosVisita {
  fotoUri?: string | null;
  nota?: string | null;
  sincronizada?: boolean;
}

export async function actualizarVisita(
  id: string,
  cambios: CambiosVisita
): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();

  const asignaciones: string[] = [];
  const valores: (string | number | null)[] = [];

  if (cambios.fotoUri !== undefined) {
    asignaciones.push('foto_uri = ?');
    valores.push(cambios.fotoUri);
  }
  if (cambios.nota !== undefined) {
    asignaciones.push('nota = ?');
    valores.push(cambios.nota);
  }
  if (cambios.sincronizada !== undefined) {
    asignaciones.push('sincronizada = ?');
    valores.push(cambios.sincronizada ? 1 : 0);
  }

  if (asignaciones.length === 0) return;

  valores.push(id);
  await db.runAsync(
    `UPDATE visitas SET ${asignaciones.join(', ')} WHERE id = ?;`,
    valores
  );
}

export async function eliminarVisitaDeDb(id: string): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  await db.runAsync('DELETE FROM visitas WHERE id = ?;', [id]);
}

/** "Quitar de visitados" en la ficha del lugar borra todas sus visitas. */
export async function eliminarVisitasDeLugar(lugarId: string): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  await db.runAsync('DELETE FROM visitas WHERE lugar_id = ?;', [lugarId]);
}

/** Borra varias visitas de una vez (limpieza de huérfanas). */
export async function eliminarVisitasDeIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await inicializarVisitasDb();
  const db = await abrirBase();
  const marcadores = ids.map(() => '?').join(', ');
  await db.runAsync(`DELETE FROM visitas WHERE id IN (${marcadores});`, ids);
}

/**
 * Completa la copia de nombre/portada de visitas guardadas antes de existir
 * esas columnas (o hechas sin conexión). No toca el lugarId ni la fecha.
 */
export async function guardarSnapshotVisita(
  id: string,
  nombre: string,
  imagen: string | null
): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  await db.runAsync(
    'UPDATE visitas SET lugar_nombre = ?, lugar_imagen = ? WHERE id = ?;',
    [nombre, imagen, id]
  );
}

export async function contarVisitas(): Promise<number> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM visitas;'
  );
  return fila?.total ?? 0;
}

export async function contarVisitasSinSincronizar(): Promise<number> {
  await inicializarVisitasDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM visitas WHERE sincronizada = 0;'
  );
  return fila?.total ?? 0;
}

/**
 * Pasa el historial viejo (IDs sueltos en AsyncStorage) a la tabla `visitas`
 * del PRD, para no perder lo que el usuario ya había marcado.
 * Corre una sola vez: la marca queda en recorrido_meta.
 */
export async function migrarVisitasLegado(usuarioId = 'local'): Promise<void> {
  await inicializarVisitasDb();
  const db = await abrirBase();

  const marca = await db.getFirstAsync<{ clave: string }>(
    'SELECT clave FROM recorrido_meta WHERE clave = ?;',
    [CLAVE_MIGRACION]
  );
  if (marca) return;

  try {
    const [guardadoVisitados, guardadoFotos] = await Promise.all([
      AsyncStorage.getItem(CLAVES_LEGADO.visitados),
      AsyncStorage.getItem(CLAVES_LEGADO.fotos),
    ]);

    const visitados: string[] = guardadoVisitados ? JSON.parse(guardadoVisitados) : [];
    const fotos: Record<string, string> = guardadoFotos ? JSON.parse(guardadoFotos) : {};

    if (Array.isArray(visitados) && visitados.length > 0) {
      const base = Date.now();
      // El primero de la lista vieja se considera el más antiguo.
      for (let i = visitados.length - 1; i >= 0; i -= 1) {
        const lugarId = visitados[i];
        if (typeof lugarId !== 'string' || !lugarId) continue;
        const fecha = new Date(base - i * 60_000).toISOString();
        await db.runAsync(
          `INSERT OR IGNORE INTO visitas
             (id, usuario_id, lugar_id, fecha_hora, origen, foto_uri, nota, sincronizada)
           VALUES (?, ?, ?, ?, 'manual', ?, NULL, 0);`,
          [
            `vis-legado-${lugarId}`,
            usuarioId,
            lugarId,
            fecha,
            fotos?.[lugarId] ?? null,
          ]
        );
      }
    }
  } catch (error) {
    console.warn('No se pudo migrar el historial anterior de visitas', error);
  } finally {
    await db.runAsync(
      'INSERT OR REPLACE INTO recorrido_meta (clave, valor) VALUES (?, ?);',
      [CLAVE_MIGRACION, new Date().toISOString()]
    );
  }
}
