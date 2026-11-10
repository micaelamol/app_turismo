// src/hooks/useAgendaEventos.ts
// Estado y acciones de "Mi agenda": eventos guardados en agenda_offline.db
// y recordatorio local programado con expo-notifications.

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  EventoGuardado,
  eliminarEventoDeDb,
  guardarEventoEnDb,
  inicializarAgendaDb,
  listarEventosGuardados,
} from '../servicios/agendaDb';
import { cancelarRecordatorio, programarRecordatorioEvento } from '../servicios/notificaciones';
import { CityEvent } from '../tipos';
import { eventoYaPaso } from '../utils/eventos';

export interface ResultadoAccionAgenda {
  guardado: boolean;
  mensaje: string;
  recordatorioProgramado?: boolean;
}

export function useAgendaEventos() {
  const [eventosGuardados, setEventosGuardados] = useState<EventoGuardado[]>([]);
  const [cargandoAgenda, setCargandoAgenda] = useState<boolean>(true);
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setErrorAgenda(null);
      await inicializarAgendaDb();
      const lista = await listarEventosGuardados();
      setEventosGuardados(lista);
    } catch (error) {
      console.warn('No se pudo leer la agenda local', error);
      setErrorAgenda('No pudimos abrir tu agenda guardada.');
    } finally {
      setCargandoAgenda(false);
    }
  }, []);

  // Al volver a la pantalla (por ejemplo, después de guardar en el detalle)
  // se relee la base para reflejar el estado real.
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  const estaGuardado = useCallback(
    (eventoId: string) => eventosGuardados.some((evento) => evento.id === eventoId),
    [eventosGuardados]
  );

  const tieneRecordatorio = useCallback(
    (eventoId: string) =>
      Boolean(eventosGuardados.find((evento) => evento.id === eventoId)?.notificacionId),
    [eventosGuardados]
  );

  const guardarEvento = useCallback(
    async (evento: CityEvent): Promise<ResultadoAccionAgenda> => {
      if (eventosGuardados.some((guardado) => guardado.id === evento.id)) {
        return { guardado: true, mensaje: 'Este evento ya está en tu agenda.' };
      }

      // Los eventos vencidos se ven en la agenda, pero no se pueden recordar.
      if (eventoYaPaso(evento)) {
        return {
          guardado: false,
          mensaje: 'Este evento ya pasó, así que no se puede agregar a tu agenda.',
        };
      }

      try {
        const recordatorio = await programarRecordatorioEvento(evento);
        await guardarEventoEnDb(evento, recordatorio.notificacionId ?? null);
        await recargar();

        return {
          guardado: true,
          mensaje: `Guardamos el evento. ${recordatorio.mensaje}`,
          recordatorioProgramado: recordatorio.programado,
        };
      } catch (error) {
        console.warn('No se pudo guardar el evento', error);
        return {
          guardado: false,
          mensaje: 'No pudimos guardar el evento en tu agenda. Intentá de nuevo.',
        };
      }
    },
    [eventosGuardados, recargar]
  );

  const quitarEvento = useCallback(
    async (eventoId: string): Promise<ResultadoAccionAgenda> => {
      const guardado = eventosGuardados.find((evento) => evento.id === eventoId);

      try {
        await cancelarRecordatorio(guardado?.notificacionId ?? null);
        await eliminarEventoDeDb(eventoId);
        await recargar();
        return { guardado: false, mensaje: 'Quitamos el evento de tu agenda.' };
      } catch (error) {
        console.warn('No se pudo quitar el evento', error);
        return {
          guardado: true,
          mensaje: 'No pudimos quitar el evento. Intentá de nuevo.',
        };
      }
    },
    [eventosGuardados, recargar]
  );

  return {
    eventosGuardados,
    cargandoAgenda,
    errorAgenda,
    estaGuardado,
    tieneRecordatorio,
    guardarEvento,
    quitarEvento,
    recargar,
  };
}
