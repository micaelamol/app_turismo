import * as SQLite from 'expo-sqlite';
import { Categoria } from '../tipos';

// Base nueva para Colón (el archivo viejo de San Juan queda abandonado)
const db = SQLite.openDatabaseSync('mi_ciudad_colon.db');

export function inicializarBaseDeDatos() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      icono TEXT NOT NULL,
      color TEXT NOT NULL,
      orden INTEGER NOT NULL
    );
  `);
}

/**
 * Reemplaza TODAS las categorías locales por las que devolvió el servidor.
 */
export async function guardarCategoriasEnSQLite(categorias: Categoria[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM categorias;');
    for (const cat of categorias) {
      await db.runAsync(
        `INSERT INTO categorias (id, nombre, icono, color, orden) VALUES (?, ?, ?, ?, ?);`,
        [cat.id, cat.nombre, cat.icono, cat.color, cat.orden]
      );
    }
  });
}

export async function obtenerCategoriasDeSQLite(): Promise<Categoria[]> {
  return await db.getAllAsync<Categoria>('SELECT * FROM categorias ORDER BY orden ASC;');
}