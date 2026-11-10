// src/servicios/descargasDb.ts
// Base SQLite propia para los lugares descargados (modo offline).
// Archivo distinto (descargas_offline.db) para no chocar con las bases de otros.

import * as SQLite from 'expo-sqlite';
import { Lugar } from '../tipos';

export type NivelDescarga = 'liviano' | 'completo';

export interface DescargaLugar {
  id: string;
  datos: Lugar;
  nivel: NivelDescarga;
  pesoBytes: number;
  portadaLocal: string | null;
  galeriaLocal: string[];
  descargadoEn: string;
  actualizadoEn: string | null;
}

interface DescargaRow {
  id: string;
  datos_json: string;
  portada_local: string | null;
  galeria_local: string;
  nivel: string;
  peso_bytes: number;
  descargado_en: string;
  actualizado_en: string | null;
}

const NOMBRE_BASE = 'descargas_offline.db';

let apertura: Promise<SQLite.SQLiteDatabase> | null = null;
let inicializacion: Promise<void> | null = null;

function abrirBase(): Promise<SQLite.SQLiteDatabase> {
  if (!apertura) {
    apertura = SQLite.openDatabaseAsync(NOMBRE_BASE);
  }
  return apertura;
}

export function inicializarDescargasDb(): Promise<void> {
  if (!inicializacion) {
    inicializacion = (async () => {
      const db = await abrirBase();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS descargas_lugares (
          id TEXT PRIMARY KEY NOT NULL,
          datos_json TEXT NOT NULL,
          portada_local TEXT,
          galeria_local TEXT NOT NULL DEFAULT '[]',
          nivel TEXT NOT NULL DEFAULT 'liviano',
          peso_bytes INTEGER NOT NULL DEFAULT 0,
          descargado_en TEXT NOT NULL,
          actualizado_en TEXT
        );
      `);
    })().catch((error) => {
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
}

function filaADescarga(fila: DescargaRow): DescargaLugar {
  const datos = JSON.parse(fila.datos_json) as Lugar;
  const galeria = JSON.parse(fila.galeria_local || '[]') as string[];
  if (galeria.length > 0) {
    datos.imagenes = galeria;
  }
  if (fila.portada_local) {
    datos.imageUrl = fila.portada_local;
  }
  return {
    id: fila.id,
    datos,
    nivel: (fila.nivel as NivelDescarga) ?? 'liviano',
    pesoBytes: fila.peso_bytes ?? 0,
    portadaLocal: fila.portada_local,
    galeriaLocal: galeria,
    descargadoEn: fila.descargado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function listarDescargas(): Promise<DescargaLugar[]> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  const filas = await db.getAllAsync<DescargaRow>(
    'SELECT * FROM descargas_lugares ORDER BY descargado_en DESC;'
  );
  return filas.map(filaADescarga);
}

export async function obtenerDescarga(id: string): Promise<DescargaLugar | null> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<DescargaRow>(
    'SELECT * FROM descargas_lugares WHERE id = ?;',
    [id]
  );
  return fila ? filaADescarga(fila) : null;
}

export async function guardarDescarga(descarga: DescargaLugar): Promise<void> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  await db.runAsync(
    `INSERT OR REPLACE INTO descargas_lugares
       (id, datos_json, portada_local, galeria_local, nivel, peso_bytes, descargado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      descarga.id,
      JSON.stringify(descarga.datos),
      descarga.portadaLocal,
      JSON.stringify(descarga.galeriaLocal),
      descarga.nivel,
      descarga.pesoBytes,
      descarga.descargadoEn,
      descarga.actualizadoEn,
    ]
  );
}

export async function eliminarDescargaDeDb(id: string): Promise<void> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  await db.runAsync('DELETE FROM descargas_lugares WHERE id = ?;', [id]);
}

export async function eliminarTodasLasDescargasDeDb(): Promise<void> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  await db.runAsync('DELETE FROM descargas_lugares;');
}

export async function pesoTotalDescargas(): Promise<number> {
  await inicializarDescargasDb();
  const db = await abrirBase();
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(peso_bytes), 0) AS total FROM descargas_lugares;'
  );
  return fila?.total ?? 0;
}
