// src/servicios/audioguias.ts
// Textos de la audioguía. PRD §6: "Escuchar una audioguía mientras recorrés el lugar",
// con controles de reproducción y tiempo restante.

/** Nombre del archivo de audio dentro de la carpeta de descarga del lugar. */
export const ARCHIVO_AUDIO = 'audioguia.mp3';

/** "4:12" o "1:04:12". */
export function formatearTiempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00';

  const total = Math.floor(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;
  const dosDigitos = (n: number) => String(n).padStart(2, '0');

  if (horas > 0) return `${horas}:${dosDigitos(minutos)}:${dosDigitos(resto)}`;
  return `${minutos}:${dosDigitos(resto)}`;
}

/** "Faltan 3:12" / "Terminó". */
export function textoRestante(actual: number, total: number): string {
  const falta = Math.max(0, total - actual);
  if (falta < 1) return 'Terminó';
  return `Faltan ${formatearTiempo(falta)}`;
}

export function idiomaLegible(idioma: 'es' | 'en' | 'pt' | null | undefined): string {
  switch (idioma) {
    case 'en':
      return 'Inglés';
    case 'pt':
      return 'Portugués';
    default:
      return 'Español';
  }
}
