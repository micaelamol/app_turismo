// src/servicios/catalogoDb.ts
// Caché SQLite del catálogo completo de lugares (PRD §7: "catálogo cacheado").
// Archivo propio (catalogo_offline.db) para no chocar con las bases de otros bloques.

import * as SQLite from 'expo-sqlite';
import { Lugar } from '../tipos';

interface CatalogoRow {
  id: string;
  datos_json: string;
  actualizado_en: string;
}

interface MetaRow {
  clave: string;
  valor: string;
}

const NOMBRE_BASE = 'catalogo_offline.db';
const CLAVE_ACTUALIZADO = 'catalogo_actualizado_en';

let apertura: Promise<SQLite.SQLiteDatabase> | null = null;
let inicializacion: Promise<void> | null = null;

function abrirBase(): Promise<SQLite.SQLiteDatabase> {
  if (!apertura) {
    apertura = SQLite.openDatabaseAsync(NOMBRE_BASE);
  }
  return apertura;
}

export function inicializarCatalogoDb(): Promise<void> {
  if (!inicializacion) {
    inicializacion = (async () => {
      const db = await abrirBase();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS catalogo_lugares (
          id TEXT PRIMARY KEY NOT NULL,
          datos_json TEXT NOT NULL,
          actualizado_en TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS catalogo_meta (
          clave TEXT PRIMARY KEY NOT NULL,
          valor TEXT NOT NULL
        );
      `);
    })().catch((error) => {
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
}

/**
 * Reemplaza el catálogo guardado por el que acaba de llegar de la API.
 * Se guardan los 26 lugares completos (con horarios, audioguía y coordenadas)
 * para que la app siga funcionando sin conexión.
 */
export async function guardarCatalogo(lugares: Lugar[]): Promise<void> {
  if (lugares.length === 0) return;

  await inicializarCatalogoDb();
  const db = await abrirBase();
  const ahora = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM catalogo_lugares;');
    for (const lugar of lugares) {
      await db.runAsync(
        'INSERT OR REPLACE INTO catalogo_lugares (id, datos_json, actualizado_en) VALUES (?, ?, ?);',
        [lugar.id, JSON.stringify(lugar), ahora]
      );
    }
    await db.runAsync(
      'INSERT OR REPLACE INTO catalogo_meta (clave, valor) VALUES (?, ?);',
      [CLAVE_ACTUALIZADO, ahora]
    );
  });
}

export async function leerCatalogo(): Promise<Lugar[]> {
  await inicializarCatalogoDb();
  const db = await abrirBase();
  const filas = await db.getAllAsync<CatalogoRow>(
    'SELECT * FROM catalogo_lugares ORDER BY id ASC;'
  );

  const lugares: Lugar[] = [];
  for (const fila of filas) {
    try {
      lugares.push(JSON.parse(fila.datos_json) as Lugar);
    } catch {
      // Una fila corrupta no debe romper todo el catálogo offline.
    }
  }
  return lugares;
}

export async function contarCatalogo(): Promise<number> {
  await inicializarCatalogoDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM catalogo_lugares;'
  );
  return fila?.total ?? 0;
}

export async function fechaActualizacionCatalogo(): Promise<string | null> {
  await inicializarCatalogoDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<MetaRow>(
    'SELECT * FROM catalogo_meta WHERE clave = ?;',
    [CLAVE_ACTUALIZADO]
  );
  return fila?.valor ?? null;
}
