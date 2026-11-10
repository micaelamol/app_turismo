// src/utils/lugares.ts
// Textos de la ficha de un lugar: horarios, precio y si está abierto ahora.
// PRD §1: "Entrar al detalle de un lugar y ver fotos, la descripción, el horario,
// el teléfono y cuánto sale entrar."

import { Horario } from '../tipos';

const NOMBRES_DIA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/** "$1.500", "Gratis" o "Consultar" (el PRD usa 0 para gratis y null cuando no aplica). */
export function precioLegible(precio: number | null | undefined): string {
  if (precio === null || precio === undefined) return 'Consultar';
  if (precio === 0) return 'Gratis';
  return `$${precio.toLocaleString('es-AR')}`;
}

function minutosDe(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return (horas ?? 0) * 60 + (minutos ?? 0);
}

function nombreDeDias(dias: number[]): string {
  if (dias.length === 7) return 'Todos los días';
  if (dias.length === 1) return NOMBRES_DIA[dias[0]];
  return `${NOMBRES_DIA[dias[0]]} a ${NOMBRES_DIA[dias[dias.length - 1]]}`;
}

/**
 * Agrupa los días que abren con el mismo horario.
 * Ejemplo: [{1..5, 09:00-19:00}, {6, 10:00-20:00}] → ["Lunes a viernes · 09:00 a 19:00", "Sábado · 10:00 a 20:00"]
 */
export function formatearHorarios(horarios: Horario[] | null | undefined): string[] {
  if (!horarios || horarios.length === 0) return [];

  const ordenados = [...horarios].sort((a, b) => a.dia - b.dia);
  const grupos: { dias: number[]; abre: string; cierra: string }[] = [];

  for (const horario of ordenados) {
    const ultimo = grupos[grupos.length - 1];
    const esContiguo =
      ultimo !== undefined &&
      ultimo.abre === horario.abre &&
      ultimo.cierra === horario.cierra &&
      horario.dia === ultimo.dias[ultimo.dias.length - 1] + 1;

    if (esContiguo) {
      ultimo.dias.push(horario.dia);
    } else {
      grupos.push({ dias: [horario.dia], abre: horario.abre, cierra: horario.cierra });
    }
  }

  return grupos.map(
    (grupo) => `${nombreDeDias(grupo.dias)} · ${grupo.abre} a ${grupo.cierra}`
  );
}

export interface EstadoApertura {
  abierto: boolean;
  texto: string;
}

/**
 * "Abierto ahora · cierra 19:00" / "Cerrado ahora · abre hoy 09:00" / "Cerrado ahora".
 * Devuelve null cuando el lugar no tiene horarios cargados.
 */
export function estadoApertura(
  horarios: Horario[] | null | undefined,
  ahora: Date = new Date()
): EstadoApertura | null {
  if (!horarios || horarios.length === 0) return null;

  const dia = ahora.getDay();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const deHoy = horarios.filter((horario) => horario.dia === dia);

  const abierto = deHoy.find(
    (horario) =>
      minutos >= minutosDe(horario.abre) && minutos < minutosDe(horario.cierra)
  );
  if (abierto) {
    return { abierto: true, texto: `Abierto ahora · cierra ${abierto.cierra}` };
  }

  const masTarde = deHoy
    .filter((horario) => minutosDe(horario.abre) > minutos)
    .sort((a, b) => minutosDe(a.abre) - minutosDe(b.abre))[0];
  if (masTarde) {
    return { abierto: false, texto: `Cerrado ahora · abre hoy ${masTarde.abre}` };
  }

  return { abierto: false, texto: 'Cerrado ahora' };
}
