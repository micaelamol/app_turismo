// src/hooks/useAgendaEventos.ts
// Estado y acciones de "Mi agenda": eventos guardados en agenda_offline.db
// y recordatorio local programado con expo-notifications.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  EventoGuardado,
  adoptarEventosLocales,
  eliminarEventoDeDb,
  guardarEventoEnDb,
  inicializarAgendaDb,
  listarEventosGuardados,
} from '../servicios/agendaDb';
import {
  guardarEventoEnServidor,
  obtenerEventosGuardadosDeLaCuenta,
  quitarEventoDelServidor,
} from '../servicios/eventosGuardados';
import { cancelarRecordatorio, programarRecordatorioEvento } from '../servicios/notificaciones';
import { CityEvent } from '../tipos';
import { eventoYaPaso } from '../utils/eventos';

export interface ResultadoAccionAgenda {
  guardado: boolean;
  mensaje: string;
  recordatorioProgramado?: boolean;
}

export function useAgendaEventos() {
  const { user } = useAuth();
  const usuarioId = user?.id ?? 'local';

  const [eventosGuardados, setEventosGuardados] = useState<EventoGuardado[]>([]);
  const [cargandoAgenda, setCargandoAgenda] = useState<boolean>(true);
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try {
      setErrorAgenda(null);
      await inicializarAgendaDb();
      const lista = await listarEventosGuardados(usuarioId);
      setEventosGuardados(lista);
    } catch (error) {
      console.warn('No se pudo leer la agenda local', error);
      setErrorAgenda('No pudimos abrir tu agenda guardada.');
    } finally {
      setCargandoAgenda(false);
    }
  }, [usuarioId]);

  // Al volver a la pantalla (por ejemplo, después de guardar en el detalle)
  // se relee la base para reflejar el estado real.
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  // PRD §3: los eventos guardados de la cuenta están en el servidor. Al entrar
  // se bajan y se suman a los que ya había en el teléfono. Lo que se guardó sin
  // cuenta pasa a ser de la cuenta que acaba de entrar.
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        if (usuarioId !== 'local') {
          await adoptarEventosLocales(usuarioId);

          const delServidor = await obtenerEventosGuardadosDeLaCuenta();
          if (!vivo) return;

          const locales = await listarEventosGuardados(usuarioId);
          const yaEstaban = new Set(locales.map((evento) => evento.id));

          for (const evento of delServidor) {
            if (!yaEstaban.has(evento.id)) {
              await guardarEventoEnDb(evento, null, usuarioId);
            }
          }

          // Lo guardado sin cuenta (o sin señal) viaja a la cuenta, para que no
          // se pierda al cambiar de teléfono (PRD §5).
          const enServidor = new Set(delServidor.map((evento) => evento.id));
          for (const evento of locales) {
            if (!enServidor.has(evento.id)) {
              guardarEventoEnServidor(evento.id).catch((error) =>
                console.warn('No se pudo subir el evento guardado', error)
              );
            }
          }
        }

        if (vivo) await recargar();
      } catch (error) {
        console.warn('No se pudieron bajar los eventos guardados', error);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [usuarioId, recargar]);

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

      // R17 del back: solo se guardan eventos programados o suspendidos.
      if (evento.estado === 'cancelado') {
        return {
          guardado: false,
          mensaje: 'Este evento está cancelado, así que no se puede agregar a tu agenda.',
        };
      }

      try {
        const recordatorio = await programarRecordatorioEvento(evento);
        await guardarEventoEnDb(evento, recordatorio.notificacionId ?? null, usuarioId);

        // Con sesión, el evento también queda guardado en la cuenta.
        if (user) {
          guardarEventoEnServidor(evento.id).catch((error) =>
            console.warn('No se pudo guardar el evento en el servidor', error)
          );
        }

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
    [eventosGuardados, recargar, user, usuarioId]
  );

  const quitarEvento = useCallback(
    async (eventoId: string): Promise<ResultadoAccionAgenda> => {
      const guardado = eventosGuardados.find((evento) => evento.id === eventoId);

      try {
        await cancelarRecordatorio(guardado?.notificacionId ?? null);
        await eliminarEventoDeDb(eventoId, usuarioId);

        // Con sesión, también se quita de la cuenta.
        if (user) {
          quitarEventoDelServidor(eventoId).catch((error) =>
            console.warn('No se pudo quitar el evento del servidor', error)
          );
        }

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
    [eventosGuardados, recargar, user, usuarioId]
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
