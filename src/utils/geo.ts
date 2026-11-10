// src/utils/geo.ts
// Cálculos de distancia y rumbo para el bloque "Recorrido por cercanía" (PRD §2 y §4).
// No dependen de ningún contexto ni de la API.

import { Coordinates } from '../tipos';

const RADIO_TIERRA_METROS = 6371000;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

function latitud(coords: Coordinates): number {
  return coords.latitud ?? coords.latitude ?? 0;
}

function longitud(coords: Coordinates): number {
  return coords.longitud ?? coords.longitude ?? 0;
}

/**
 * Distancia en metros entre dos coordenadas (fórmula de Haversine).
 * PRD §2: "Una lista de lo que tenés cerca ordenada por distancia."
 */
export function distanciaMetros(desde: Coordinates, hasta: Coordinates): number {
  const lat1 = aRadianes(latitud(desde));
  const lat2 = aRadianes(latitud(hasta));
  const deltaLat = aRadianes(latitud(hasta) - latitud(desde));
  const deltaLng = aRadianes(longitud(hasta) - longitud(desde));

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "85 m", "1,2 km", "14 km". Pensado para mostrar debajo del nombre del lugar. */
export function formatearDistancia(metros: number): string {
  if (!Number.isFinite(metros) || metros < 0) return '';
  if (metros < 1000) return `${Math.round(metros)} m`;
  if (metros < 10000) return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(metros / 1000)} km`;
}

/**
 * Rumbo en grados desde el norte (0 = norte, 90 = este) para ir de `desde` a `hasta`.
 * PRD §2: "que una flecha indique para qué lado queda".
 */
export function rumboHacia(desde: Coordinates, hasta: Coordinates): number {
  const lat1 = aRadianes(latitud(desde));
  const lat2 = aRadianes(latitud(hasta));
  const deltaLng = aRadianes(longitud(hasta) - longitud(desde));

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

/** Lleva un ángulo a [-180, 180) para rotar la flecha respecto del rumbo del teléfono. */
export function normalizarAngulo(grados: number): number {
  return ((grados % 360) + 540) % 360 - 180;
}

const PUNTOS_CARDINALES = [
  'norte',
  'noreste',
  'este',
  'sudeste',
  'sur',
  'sudoeste',
  'oeste',
  'noroeste',
];

export function puntoCardinal(grados: number): string {
  const indice = Math.round(((grados % 360) + 360) % 360 / 45) % 8;
  return PUNTOS_CARDINALES[indice];
}
