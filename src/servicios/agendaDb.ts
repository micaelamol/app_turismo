// src/servicios/agendaDb.ts
// Base SQLite propia del bloque "Agenda offline".
// Se abre en un archivo distinto (agenda_offline.db) para no chocar con
// mi_ciudad_colon.db, que administra otro compañero desde database.ts.

import * as SQLite from 'expo-sqlite';
import { EstadoEvento, Evento } from '../tipos';

export interface EventoGuardado {
  id: string;
  usuarioId: string;
  titulo: string;
  descripcion: string;
  lugarId: string | null;
  direccionLibre: string | null;
  inicio: string;
  fin: string | null;
  imagenUrl: string | null;
  precio: number | null;
  estado: EstadoEvento;
  notificacionId: string | null;
  guardadoEn: string;
}

interface EventoGuardadoRow {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string;
  lugar_id: string | null;
  direccion_libre: string | null;
  inicio: string;
  fin: string | null;
  imagen_url: string | null;
  precio: number | null;
  estado: string;
  notificacion_id: string | null;
  guardado_en: string;
}

const NOMBRE_BASE = 'agenda_offline.db';

let apertura: Promise<SQLite.SQLiteDatabase> | null = null;
let inicializacion: Promise<void> | null = null;

function abrirBase(): Promise<SQLite.SQLiteDatabase> {
  if (!apertura) {
    apertura = SQLite.openDatabaseAsync(NOMBRE_BASE);
  }
  return apertura;
}

/**
 * Crea la tabla de eventos guardados una sola vez por proceso.
 * Es idempotente: se puede llamar en cada pantalla sin costo.
 */
export function inicializarAgendaDb(): Promise<void> {
  if (!inicializacion) {
    inicializacion = (async () => {
      const db = await abrirBase();

      // Cada fila pertenece a una cuenta. Sin sesión, `usuario_id` es 'local'.
      // La clave primaria es compuesta para que dos cuentas puedan guardar el
      // mismo evento sin pisarse.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS eventos_guardados (
          usuario_id TEXT NOT NULL DEFAULT 'local',
          id TEXT NOT NULL,
          titulo TEXT NOT NULL,
          descripcion TEXT NOT NULL DEFAULT '',
          lugar_id TEXT,
          direccion_libre TEXT,
          inicio TEXT NOT NULL,
          fin TEXT,
          imagen_url TEXT,
          precio REAL,
          estado TEXT NOT NULL DEFAULT 'programado',
          notificacion_id TEXT,
          guardado_en TEXT NOT NULL,
          PRIMARY KEY (usuario_id, id)
        );
      `);

      // Agenda creada antes de separar por cuenta: se migra sin perder nada.
      const columnas = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(eventos_guardados);'
      );
      const nombres = new Set(columnas.map((columna) => columna.name));

      if (!nombres.has('usuario_id')) {
        await db.execAsync(`
          ALTER TABLE eventos_guardados RENAME TO eventos_guardados_viejo;
          CREATE TABLE eventos_guardados (
            usuario_id TEXT NOT NULL DEFAULT 'local',
            id TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL DEFAULT '',
            lugar_id TEXT,
            direccion_libre TEXT,
            inicio TEXT NOT NULL,
            fin TEXT,
            imagen_url TEXT,
            precio REAL,
            estado TEXT NOT NULL DEFAULT 'programado',
            notificacion_id TEXT,
            guardado_en TEXT NOT NULL,
            PRIMARY KEY (usuario_id, id)
          );
          INSERT INTO eventos_guardados
            (usuario_id, id, titulo, descripcion, lugar_id, direccion_libre, inicio,
             fin, imagen_url, precio, estado, notificacion_id, guardado_en)
          SELECT 'local', id, titulo, descripcion, lugar_id, direccion_libre, inicio,
             fin, imagen_url, precio, estado, notificacion_id, guardado_en
          FROM eventos_guardados_viejo;
          DROP TABLE eventos_guardados_viejo;
        `);
      }

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_eventos_guardados_inicio
          ON eventos_guardados (inicio);
        CREATE INDEX IF NOT EXISTS idx_eventos_guardados_usuario
          ON eventos_guardados (usuario_id);
      `);
    })().catch((error) => {
      // Si falla, permitimos reintentar en la próxima llamada.
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
}

function filaAEvento(fila: EventoGuardadoRow): EventoGuardado {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    titulo: fila.titulo,
    descripcion: fila.descripcion ?? '',
    lugarId: fila.lugar_id,
    direccionLibre: fila.direccion_libre,
    inicio: fila.inicio,
    fin: fila.fin,
    imagenUrl: fila.imagen_url,
    precio: fila.precio,
    estado: (fila.estado as EstadoEvento) ?? 'programado',
    notificacionId: fila.notificacion_id,
    guardadoEn: fila.guardado_en,
  };
}

export async function listarEventosGuardados(usuarioId: string): Promise<EventoGuardado[]> {
  await inicializarAgendaDb();
  const db = await abrirBase();
  const filas = await db.getAllAsync<EventoGuardadoRow>(
    'SELECT * FROM eventos_guardados WHERE usuario_id = ? ORDER BY inicio ASC;',
    [usuarioId]
  );
  return filas.map(filaAEvento);
}

export async function obtenerEventoGuardado(
  id: string,
  usuarioId: string
): Promise<EventoGuardado | null> {
  await inicializarAgendaDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<EventoGuardadoRow>(
    'SELECT * FROM eventos_guardados WHERE id = ? AND usuario_id = ?;',
    [id, usuarioId]
  );
  return fila ? filaAEvento(fila) : null;
}

export async function guardarEventoEnDb(
  evento: Evento,
  notificacionId: string | null,
  usuarioId: string
): Promise<void> {
  await inicializarAgendaDb();
  const db = await abrirBase();

  const titulo = evento.titulo || evento.title || 'Evento sin título';
  const descripcion = evento.descripcion || evento.description || '';
  const direccion = evento.direccionLibre || evento.location || null;
  const imagen = evento.imagenUrl || evento.imageUrl || null;
  const precio = typeof evento.precio === 'number' ? evento.precio : null;

  await db.runAsync(
    `INSERT OR REPLACE INTO eventos_guardados
       (usuario_id, id, titulo, descripcion, lugar_id, direccion_libre, inicio, fin,
        imagen_url, precio, estado, notificacion_id, guardado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      usuarioId,
      evento.id,
      titulo,
      descripcion,
      evento.lugarId ?? null,
      direccion,
      evento.inicio,
      evento.fin ?? null,
      imagen,
      precio,
      evento.estado ?? 'programado',
      notificacionId,
      new Date().toISOString(),
    ]
  );
}

export async function actualizarNotificacionEvento(
  id: string,
  notificacionId: string | null,
  usuarioId: string
): Promise<void> {
  await inicializarAgendaDb();
  const db = await abrirBase();
  await db.runAsync(
    'UPDATE eventos_guardados SET notificacion_id = ? WHERE id = ? AND usuario_id = ?;',
    [notificacionId, id, usuarioId]
  );
}

export async function eliminarEventoDeDb(id: string, usuarioId: string): Promise<void> {
  await inicializarAgendaDb();
  const db = await abrirBase();
  await db.runAsync('DELETE FROM eventos_guardados WHERE id = ? AND usuario_id = ?;', [
    id,
    usuarioId,
  ]);
}

/**
 * Al iniciar sesión, los eventos guardados sin cuenta pasan a ser de esa cuenta.
 * Si la cuenta ya tenía el mismo evento, se descarta la copia de invitado.
 */
export async function adoptarEventosLocales(usuarioId: string): Promise<void> {
  await inicializarAgendaDb();
  const db = await abrirBase();
  await db.runAsync(
    "UPDATE OR IGNORE eventos_guardados SET usuario_id = ? WHERE usuario_id = 'local';",
    [usuarioId]
  );
  await db.runAsync("DELETE FROM eventos_guardados WHERE usuario_id = 'local';");
}

/** Convierte la copia local a la forma que espera la pantalla de detalle. */
export function eventoGuardadoAEvento(guardado: EventoGuardado): Evento {
  return {
    id: guardado.id,
    titulo: guardado.titulo,
    descripcion: guardado.descripcion,
    lugarId: guardado.lugarId,
    direccionLibre: guardado.direccionLibre,
    coordenadas: null,
    inicio: guardado.inicio,
    fin: guardado.fin,
    imagenUrl: guardado.imagenUrl,
    precio: guardado.precio,
    estado: guardado.estado,
  };
}
