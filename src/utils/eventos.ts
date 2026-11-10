// src/utils/eventos.ts
// Helpers de presentación para eventos. No dependen de ningún contexto.

import { CityEvent, EstadoEvento } from '../tipos';

export function tituloEvento(evento: CityEvent): string {
  return evento.titulo || evento.title || 'Evento sin título';
}

export function descripcionEvento(evento: CityEvent): string {
  return evento.descripcion || evento.description || '';
}

export function direccionEvento(evento: CityEvent): string {
  return evento.direccionLibre || evento.location || 'Colón, Entre Ríos';
}

export function imagenEvento(evento: CityEvent): string | null {
  return evento.imagenUrl || evento.imageUrl || null;
}

/** Devuelve null cuando el evento no informa precio. 0 significa "Gratis". */
export function textoPrecioEvento(evento: CityEvent): string | null {
  if (evento.precio === 0) return 'Gratis';
  if (typeof evento.precio === 'number') return `$${evento.precio}`;
  if (typeof evento.price === 'string' && evento.price.trim()) return evento.price;
  if (typeof evento.price === 'number') return evento.price === 0 ? 'Gratis' : `$${evento.price}`;
  return null;
}

export function formatearFechaEvento(inicio: string): string {
  const fecha = new Date(inicio);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatearHoraEvento(iso: string | null): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * "5 h", "1 h 30 min", "45 min". Devuelve null si falta el fin o no se puede calcular.
 * PRD §3: el detalle del evento dice "cuánto dura".
 */
export function duracionEvento(inicio: string, fin: string | null): string | null {
  if (!fin) return null;

  const desde = new Date(inicio).getTime();
  const hasta = new Date(fin).getTime();
  if (Number.isNaN(desde) || Number.isNaN(hasta) || hasta <= desde) return null;

  const minutosTotales = Math.round((hasta - desde) / 60000);
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} h`;
  return `${horas} h ${minutos} min`;
}

export function etiquetaEstadoEvento(estado: EstadoEvento): string {
  switch (estado) {
    case 'suspendido':
      return 'Suspendido';
    case 'cancelado':
      return 'Cancelado';
    case 'finalizado':
      return 'Finalizado';
    default:
      return 'Programado';
  }
}

/** Clave local de un día: "2026-11-14". Sirve para agrupar eventos por día. */
const SIN_FECHA = 'sin-fecha';

function claveDeFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function claveDiaEvento(iso: string | null | undefined): string {
  if (!iso) return SIN_FECHA;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? SIN_FECHA : claveDeFecha(fecha);
}

/**
 * "Hoy", "Mañana" o "Sábado 14 de noviembre".
 * PRD §3: "Ver los eventos por día, empezando por hoy."
 */
export function tituloDiaEvento(clave: string, ahora: Date = new Date()): string {
  if (clave === SIN_FECHA) return 'Sin fecha confirmada';
  if (clave === claveDeFecha(ahora)) return 'Hoy';

  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  if (clave === claveDeFecha(manana)) return 'Mañana';

  const fecha = new Date(`${clave}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha confirmada';

  const texto = fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Ordena por inicio; los eventos sin fecha van al final. */
export function ordenarEventosPorInicio(eventos: CityEvent[]): CityEvent[] {
  return [...eventos].sort((a, b) => {
    const primero = a.inicio ? new Date(a.inicio).getTime() : Number.POSITIVE_INFINITY;
    const segundo = b.inicio ? new Date(b.inicio).getTime() : Number.POSITIVE_INFINITY;
    return primero - segundo;
  });
}

/**
 * ¿El evento ya terminó?
 * PRD §3: la agenda marca los eventos vencidos y no permite programarles un
 * recordatorio, pero no se ocultan ni se cambian sus fechas.
 * - Si el backend lo marcó "finalizado", ya pasó.
 * - Si tiene hora de fin, se compara contra el fin.
 * - Si no tiene fin, se toma el final del día en que empieza.
 */
export function eventoYaPaso(evento: CityEvent, ahora: Date = new Date()): boolean {
  if (evento.estado === 'finalizado') return true;

  const inicio = evento.inicio ? new Date(evento.inicio) : null;
  if (!inicio || Number.isNaN(inicio.getTime())) return false;

  const fin = evento.fin ? new Date(evento.fin) : null;
  if (fin && !Number.isNaN(fin.getTime())) {
    return fin.getTime() <= ahora.getTime();
  }

  const finDelDia = new Date(inicio);
  finDelDia.setHours(23, 59, 59, 999);
  return finDelDia.getTime() <= ahora.getTime();
}

export function colorEstadoEvento(estado: EstadoEvento): string {
  switch (estado) {
    case 'suspendido':
      return '#F59E0B';
    case 'cancelado':
      return '#DC2626';
    case 'finalizado':
      return '#6B7280';
    default:
      return '#10B981';
  }
}
