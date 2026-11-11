// src/hooks/useAvisosProximidad.ts
// PRD §8: mientras la persona camina, la app mira si pasó cerca de un lugar
// y muestra un aviso. Solo uno por lugar y por día, y solo si la cuenta lo
// tiene activado en Preferencias.

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePlaces } from '../context/PlacesContext';
import { asegurarPermisoAvisos, avisarSiEstoyCerca } from '../servicios/avisosProximidad';
import {
  alGuardarPreferencias,
  leerPreferenciasLocales,
  normalizarPreferencias,
  PREFERENCIAS_INICIALES,
} from '../servicios/preferencias';
import { Coordinates, Place, Preferencias } from '../tipos';
import { distanciaMetros } from '../utils/geo';

// Cada cuánto se vuelve a mirar la posición y cuánto hay que moverse.
const INTERVALO_MS = 30_000;
const DISTANCIA_MINIMA_METROS = 50;

function aCoordenadas(coords: { latitude: number; longitude: number }): Coordinates {
  return {
    latitud: coords.latitude,
    longitud: coords.longitude,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export function useAvisosProximidad(): void {
  const router = useRouter();
  const estadoNavegacion = useRootNavigationState();
  const { user, modoInvitado } = useAuth();
  const { places, permisoUbicacion, setUserLocation } = usePlaces();
  const usuarioId = user?.id ?? 'local';

  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_INICIALES);
  const [preferenciasListas, setPreferenciasListas] = useState(false);
  const [revision, setRevision] = useState(0);

  const lugaresRef = useRef<Place[]>(places);
  lugaresRef.current = places;

  const usuarioRef = useRef(usuarioId);
  usuarioRef.current = usuarioId;

  const preferenciasRef = useRef(preferencias);
  preferenciasRef.current = preferencias;

  const ultimaPosicionRef = useRef<Coordinates | null>(null);
  const avisosEnCursoRef = useRef<Set<string>>(new Set());

  const hayAcceso = Boolean(user) || modoInvitado;

  // Preferencias de la cuenta (o del invitado, que quedan en el teléfono).
  useEffect(() => {
    let vivo = true;
    setPreferenciasListas(false);

    (async () => {
      const leidas = user?.preferencias ?? (await leerPreferenciasLocales(usuarioId));
      if (!vivo) return;
      setPreferencias(normalizarPreferencias(leidas));
      setPreferenciasListas(true);
    })();

    return () => {
      vivo = false;
    };
  }, [usuarioId, user?.preferencias]);

  // La pantalla de preferencias guarda en el teléfono: acá nos enteramos.
  useEffect(
    () =>
      alGuardarPreferencias((nuevas, id) => {
        if (id !== usuarioRef.current) return;
        setPreferencias(normalizarPreferencias(nuevas));
        setPreferenciasListas(true);
      }),
    []
  );

  // Al volver a la app se revisa de nuevo el permiso (pudo cambiar en Ajustes).
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setRevision((n) => n + 1);
    });
    return () => suscripcion.remove();
  }, []);

  // Un aviso por vez: se prueba del lugar más cercano al más lejano y se corta
  // cuando alguno se muestra. Si no, una caminata corta dispara varios juntos.
  const evaluarPosicion = useCallback(async (coords: Coordinates) => {
    const prefs = preferenciasRef.current;
    if (!prefs.avisarProximidad) return;

    const radio = prefs.radioAvisoMetros || 250;
    const lugares = lugaresRef.current;
    if (!lugares.length) return;

    const candidatos = lugares
      .filter((lugar) => lugar.activo !== false)
      .map((lugar) => ({ lugar, metros: distanciaMetros(coords, lugar.coordinates) }))
      .filter(({ metros }) => metros <= radio)
      .sort((a, b) => a.metros - b.metros);

    for (const { lugar, metros } of candidatos) {
      if (avisosEnCursoRef.current.has(lugar.id)) continue;

      avisosEnCursoRef.current.add(lugar.id);
      try {
        const resultado = await avisarSiEstoyCerca(lugar, metros, usuarioRef.current);
        if (resultado.enviado) return;
      } finally {
        avisosEnCursoRef.current.delete(lugar.id);
      }
    }
  }, []);

  // Se escucha la ubicación solo si el permiso ya está dado: la app no lo pide
  // al abrir. Si la persona lo niega, todo lo demás sigue funcionando igual.
  useEffect(() => {
    if (!hayAcceso || !preferenciasListas || !preferencias.avisarProximidad) return;
    if (permisoUbicacion === 'denegado') return;

    let vivo = true;
    let suscripcion: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' || !vivo) return;

        const puedeAvisar = await asegurarPermisoAvisos();
        if (!puedeAvisar || !vivo) return;

        const ultima = await Location.getLastKnownPositionAsync();
        if (ultima && vivo) {
          const coords = aCoordenadas(ultima.coords);
          ultimaPosicionRef.current = coords;
          setUserLocation(coords);
          evaluarPosicion(coords);
        }

        suscripcion = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: DISTANCIA_MINIMA_METROS,
            timeInterval: INTERVALO_MS,
          },
          (posicion) => {
            const coords = aCoordenadas(posicion.coords);
            ultimaPosicionRef.current = coords;
            setUserLocation(coords);
            evaluarPosicion(coords);
          }
        );
      } catch (error) {
        console.warn('No se pudo seguir la ubicación para los avisos', error);
      }
    })();

    return () => {
      vivo = false;
      suscripcion?.remove();
    };
  }, [
    hayAcceso,
    preferenciasListas,
    preferencias.avisarProximidad,
    permisoUbicacion,
    revision,
    evaluarPosicion,
    setUserLocation,
  ]);

  // Cuando termina de bajar el catálogo se revisa la última posición conocida.
  useEffect(() => {
    if (!preferenciasListas || !preferencias.avisarProximidad) return;
    if (!ultimaPosicionRef.current) return;
    evaluarPosicion(ultimaPosicionRef.current);
  }, [places, preferenciasListas, preferencias.avisarProximidad, evaluarPosicion]);

  // Tocar el aviso abre el detalle del lugar.
  useEffect(() => {
    if (!estadoNavegacion?.key) return;

    const abrirLugar = (respuesta: Notifications.NotificationResponse) => {
      const datos = respuesta.notification.request.content.data as {
        tipo?: string;
        lugarId?: string;
      };
      if (datos?.tipo === 'proximidad' && datos.lugarId) {
        router.push({ pathname: '/place/[id]', params: { id: datos.lugarId } });
      }
    };

    const suscripcion = Notifications.addNotificationResponseReceivedListener(abrirLugar);

    // Si la app estaba cerrada y se abrió desde el aviso.
    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) {
      abrirLugar(ultima);
      Notifications.clearLastNotificationResponse();
    }

    return () => suscripcion.remove();
  }, [estadoNavegacion?.key, router]);
}
