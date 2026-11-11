// src/servicios/archivos.ts
// Subida de fotos a POST /archivos (con sesión, multipart). La API devuelve la
// URL que después viaja en la visita. AGENTS §8: primero el archivo, después el
// recurso; por eso la cola sube la foto recién cuando hay señal.
import { RespuestaApiExito } from '../tipos';
import { httpClient } from './client';

interface ArchivoSubido {
  url: string;
  tipo: 'imagen' | 'audio' | 'video';
  bytes: number;
}

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
};

/** Una foto guardada en el teléfono, todavía sin subir. */
export function esArchivoLocal(uri: string | null | undefined): boolean {
  return Boolean(uri && !/^https?:\/\//i.test(uri));
}

function nombreYTipo(uri: string): { nombre: string; tipo: string } {
  const nombre = uri.split(/[\\/]/).pop() || `archivo-${Date.now()}.jpg`;
  const extension = nombre.split('.').pop()?.toLowerCase() ?? 'jpg';
  return { nombre, tipo: MIME_POR_EXTENSION[extension] ?? 'image/jpeg' };
}

/** Sube un archivo del teléfono y devuelve la URL que entiende la API. */
export async function subirArchivo(uri: string): Promise<string> {
  const { nombre, tipo } = nombreYTipo(uri);

  const formulario = new FormData();
  formulario.append('archivo', { uri, name: nombre, type: tipo } as any);

  const res = await httpClient.post<RespuestaApiExito<ArchivoSubido>>(
    '/archivos',
    formulario,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Una foto puede tardar más que una consulta normal.
      timeout: 60000,
    }
  );

  return res.data.datos.url;
}
