// src/servicios/notificaciones.ts
// Notificaciones LOCALES para la agenda. No usa push ni tokens:
// el aviso se programa a partir de la fecha real de inicio del evento.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Evento } from '../tipos';
import { eventoYaPaso } from '../utils/eventos';

const CANAL_AGENDA = 'agenda-eventos';
const MINUTOS_ANTICIPACION = 60;
const MINUTOS_ANTICIPACION_MINIMA = 15;

export type MotivoSinRecordatorio =
  | 'sin_permiso'
  | 'muy_cerca'
  | 'ya_paso'
  | 'fecha_invalida'
  | 'error';

export interface ResultadoRecordatorio {
  programado: boolean;
  notificacionId?: string;
  fechaAviso?: Date;
  motivo?: MotivoSinRecordatorio;
  mensaje: string;
}

// Handler global: hace que la notificación se muestre aunque la app esté abierta.
// Lo comparten los recordatorios de la agenda y los avisos de proximidad.
export function configurarHandlerNotificaciones(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

configurarHandlerNotificaciones();

/** Canal obligatorio en Android 8+ para que el aviso tenga importancia y sonido. */
export async function prepararCanalAgenda(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CANAL_AGENDA, {
    name: 'Recordatorios de eventos',
    description: 'Avisos de los eventos que guardaste en tu agenda',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
    sound: 'default',
  });
}

/**
 * Pide permiso de notificaciones si todavía no lo tenemos.
 * Devuelve false si el usuario lo negó o si el sistema no permite volver a preguntar.
 */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  try {
    await prepararCanalAgenda();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) return false;

    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch (error) {
    console.warn('No se pudo pedir permiso de notificaciones', error);
    return false;
  }
}

function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Programa un aviso 1 hora antes del evento (o 15 minutos antes si ya falta menos).
 * Si el evento ya empezó o empieza en menos de 15 minutos, no programa nada.
 */
export async function programarRecordatorioEvento(
  evento: Evento
): Promise<ResultadoRecordatorio> {
  const inicio = new Date(evento.inicio);

  if (Number.isNaN(inicio.getTime())) {
    return {
      programado: false,
      motivo: 'fecha_invalida',
      mensaje: 'El evento no tiene una fecha de inicio válida.',
    };
  }

  // Un evento vencido no se puede recordar.
  if (eventoYaPaso(evento)) {
    return {
      programado: false,
      motivo: 'ya_paso',
      mensaje: 'Este evento ya pasó, así que no hace falta un recordatorio.',
    };
  }

  const ahora = Date.now();
  let fechaAviso = new Date(inicio.getTime() - MINUTOS_ANTICIPACION * 60_000);

  if (fechaAviso.getTime() <= ahora) {
    fechaAviso = new Date(inicio.getTime() - MINUTOS_ANTICIPACION_MINIMA * 60_000);
  }

  if (fechaAviso.getTime() <= ahora) {
    return {
      programado: false,
      motivo: 'muy_cerca',
      mensaje: 'El evento empieza en menos de 15 minutos, así que no se programó un aviso previo.',
    };
  }

  const tienePermiso = await pedirPermisoNotificaciones();
  if (!tienePermiso) {
    return {
      programado: false,
      motivo: 'sin_permiso',
      mensaje:
        'Guardamos el evento, pero las notificaciones están desactivadas. Podés activarlas desde los ajustes del teléfono.',
    };
  }

  try {
    const titulo = evento.titulo || evento.title || 'Tu evento';
    const notificacionId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Tu evento empieza pronto',
        body: `${titulo} comienza a las ${formatearHora(inicio)} hs.`,
        data: { tipo: 'evento', eventoId: evento.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fechaAviso,
        channelId: CANAL_AGENDA,
      },
    });

    return {
      programado: true,
      notificacionId,
      fechaAviso,
      mensaje: `Te avisaremos el ${fechaAviso.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
      })} a las ${formatearHora(fechaAviso)} hs.`,
    };
  } catch (error) {
    console.warn('No se pudo programar el recordatorio', error);
    return {
      programado: false,
      motivo: 'error',
      mensaje: 'Guardamos el evento, pero no pudimos programar el aviso.',
    };
  }
}

export async function cancelarRecordatorio(notificacionId: string | null): Promise<void> {
  if (!notificacionId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificacionId);
  } catch (error) {
    console.warn('No se pudo cancelar el recordatorio', error);
  }
}
