import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { obtenerCategorias } from '../servicios/categories';
import { cargarCatalogo, refrescarCatalogo } from '../servicios/catalogo';
import { obtenerEventos } from '../servicios/events';
import { agregarFavorito, obtenerFavoritos, quitarFavorito } from '../servicios/favoritos';
import {
  obtenerVisitasDeLaCuenta,
  sincronizarVisitasPendientes,
} from '../servicios/visitas';
import {
  actualizarVisita,
  eliminarVisitaDeDb,
  eliminarVisitasDeIds,
  eliminarVisitasDeLugar,
  guardarSnapshotVisita,
  guardarVisita,
  guardarVisitaDelServidor,
  inicializarVisitasDb,
  listarVisitas,
  migrarVisitasLegado,
  adoptarVisitasLocales,
} from '../servicios/visitasDb';
import {
  Category,
  CityEvent,
  Coordinates,
  Lugar,
  OrigenVisita,
  Place,
  Review,
  Visita,
} from '../tipos';
import { distanciaMetros } from '../utils/geo';

// Centro de Colón, Entre Ríos
const COLON_LAT = -32.2241;
const COLON_LNG = -58.1411;

// Clave propia (con prefijo distinto) para no chocar con la persistencia general.
// Cada cuenta tiene su propia copia; 'local' es lo hecho sin sesión.
const CLAVE_FAVORITOS = '@colon:favoritos_v1';

function claveFavoritos(usuarioId: string): string {
  return `${CLAVE_FAVORITOS}:${usuarioId}`;
}

export type PermisoUbicacion = 'desconocido' | 'concedido' | 'denegado';

export interface OpcionesVisita {
  origen?: OrigenVisita;
  fotoUri?: string | null;
  nota?: string | null;
}

export interface LugarCercano {
  lugar: Place;
  distancia: number;
}

interface PlacesContextType {
  places: Place[];
  categories: Category[];
  events: CityEvent[];
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favorites: string[];
  toggleFavorite: (placeId: string) => void;
  isFavorite: (placeId: string) => boolean;
  visitedPlaces: string[];
  toggleVisited: (placeId: string) => boolean;
  visitPhotos: Record<string, string>;
  saveVisitPhoto: (placeId: string, uri: string) => Promise<void>;
  userRatings: Record<string, number>;
  ratePlace: (placeId: string, rating: number) => void;
  reviews: Review[];
  addReview: (
    placeId: string,
    userName: string,
    userAvatar: string | undefined,
    rating: number,
    comment: string,
    photo?: string
  ) => void;
  getReviewsByPlaceId: (placeId: string) => Review[];
  eventReminders: string[];
  toggleEventReminder: (eventId: string) => boolean;
  userLocation: Coordinates;
  setUserLocation: (coords: Coordinates) => void;
  filteredPlaces: Place[];
  getPlaceById: (id: string) => Place | undefined;
  getEventById: (id: string) => CityEvent | undefined;
  getPlaceByQR: (qrCode: string) => Place | undefined;
  cargando: boolean;
  error: string | null;

  // PRD §4: el recorrido son visitas reales (origen, fecha, foto, nota, sincronizada)
  visitas: Visita[];
  registrarVisita: (lugarId: string, opciones?: OpcionesVisita) => Promise<Visita>;
  actualizarNotaVisita: (visitaId: string, nota: string) => Promise<void>;
  eliminarVisita: (visitaId: string) => Promise<void>;
  recargarVisitas: () => Promise<void>;
  /** Visitas de lugares que ya no están publicados (catálogo viejo o dado de baja). */
  visitasHuerfanas: Visita[];
  limpiarVisitasHuerfanas: () => Promise<void>;

  // PRD §2 y §4: ubicación real del teléfono y "lo que tenés cerca"
  ubicacionActual: Coordinates | null;
  permisoUbicacion: PermisoUbicacion;
  actualizandoUbicacion: boolean;
  actualizarUbicacion: () => Promise<Coordinates | null>;
  lugaresCercanos: LugarCercano[];

  // PRD §7: catálogo completo guardado en el teléfono
  catalogoOffline: boolean;
  catalogoActualizadoEn: string | null;
  actualizarCatalogo: () => Promise<void>;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rawPlaces, setRawPlaces] = useState<Lugar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]);

  const { user } = useAuth();
  const usuarioId = user?.id ?? 'local';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [eventReminders, setEventReminders] = useState<string[]>([]);

  // PRD §4: el recorrido son visitas reales, no una lista de IDs sueltos.
  const [visitas, setVisitas] = useState<Visita[]>([]);

  // PRD §2/§4: ubicación real del teléfono.
  const [ubicacionActual, setUbicacionActual] = useState<Coordinates | null>(null);
  const [permisoUbicacion, setPermisoUbicacion] = useState<PermisoUbicacion>('desconocido');
  const [actualizandoUbicacion, setActualizandoUbicacion] = useState<boolean>(false);

  // PRD §7: catálogo completo disponible sin conexión.
  const [catalogoOffline, setCatalogoOffline] = useState<boolean>(false);
  const [catalogoActualizadoEn, setCatalogoActualizadoEn] = useState<string | null>(null);

  // Consumir la capa de servicios asíncrona pasando un objeto vacío inicial
  useEffect(() => {
    let montado = true;
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);

        // Primero el catálogo: si no hay red, `cargarCatalogo` devuelve la
        // copia guardada en SQLite (PRD §7).
        const catalogo = await cargarCatalogo();
        if (!montado) return;

        setRawPlaces(catalogo.datos);
        setCatalogoOffline(catalogo.origen === 'cache');
        setCatalogoActualizadoEn(catalogo.actualizadoEn);

        const [resCategorias, resEventos] = await Promise.allSettled([
          obtenerCategorias(),
          obtenerEventos(),
        ]);
        if (!montado) return;

        if (resCategorias.status === 'fulfilled') {
          setCategories(resCategorias.value.datos);
        } else {
          console.warn('No se pudieron cargar las categorías', resCategorias.reason);
        }

        if (resEventos.status === 'fulfilled') {
          setEvents(resEventos.value.datos);
        } else {
          console.warn('No se pudieron cargar los eventos', resEventos.reason);
        }

        // Aviso de red (PRD §7): catálogo local o eventos sin actualizar.
        if (catalogo.origen === 'cache' || resEventos.status === 'rejected') {
          setError('Sin conexión: estás viendo los datos guardados en el teléfono.');
        }
      } catch (err: any) {
        if (montado) {
          setError(err?.message || 'Error al conectar con el servicio');
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    cargarDatos();
    return () => {
      montado = false;
    };
  }, []);

  /**
   * Sube la cola de visitas en segundo plano. Si subió alguna, relee la lista
   * para que la pantalla muestre el estado real.
   */
  const empujarVisitas = (id: string): void => {
    if (!id || id === 'local') return;

    sincronizarVisitasPendientes(id)
      .then(async (subidas) => {
        if (subidas > 0) setVisitas(await listarVisitas(id));
      })
      .catch((e) => console.warn('No se pudo subir la cola de visitas', e));
  };

  // PRD §4/§7: cargar la cola local de visitas del usuario actual.
  const recargarVisitas = async (): Promise<void> => {
    try {
      await inicializarVisitasDb();
      await migrarVisitasLegado(usuarioId);

      // Lo que se hizo sin cuenta pasa a la cuenta que acaba de entrar.
      if (usuarioId !== 'local') {
        await adoptarVisitasLocales(usuarioId);
      }

      const lista = await listarVisitas(usuarioId);
      setVisitas(lista);

      // Lo que quedó sin subir (sin señal o de cuando era invitado) se manda ahora.
      empujarVisitas(usuarioId);
    } catch (e) {
      console.warn('Error al leer las visitas guardadas', e);
    }
  };

  useEffect(() => {
    setVisitas([]);
    recargarVisitas();
    // Cada cuenta ve su propio recorrido; al cerrar sesión vuelve a 'local'.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  // Favoritos guardados en el teléfono, separados por cuenta (PRD §3 y §5).
  // Al entrar, lo marcado como invitado y lo que ya tenía la cuenta en el
  // servidor se suman a la copia local.
  useEffect(() => {
    let vivo = true;
    setFavorites([]);

    const leerLista = (valor: string | null): string[] => {
      if (!valor) return [];
      try {
        const lista = JSON.parse(valor);
        return Array.isArray(lista) ? lista.filter((id) => typeof id === 'string') : [];
      } catch {
        return [];
      }
    };

    (async () => {
      const clave = claveFavoritos(usuarioId);
      let unidos: string[] = [];

      try {
        unidos = leerLista(await AsyncStorage.getItem(clave));

        // Copia vieja, cuando todos los favoritos compartían una sola clave.
        const legado = await AsyncStorage.getItem(CLAVE_FAVORITOS);
        if (legado) {
          unidos = Array.from(new Set([...unidos, ...leerLista(legado)]));
          await AsyncStorage.removeItem(CLAVE_FAVORITOS);
        }
      } catch (e) {
        console.warn('No se pudieron leer los favoritos guardados', e);
      }

      if (usuarioId !== 'local') {
        try {
          const invitado = leerLista(await AsyncStorage.getItem(claveFavoritos('local')));
          if (invitado.length > 0) {
            unidos = Array.from(new Set([...unidos, ...invitado]));
            await AsyncStorage.removeItem(claveFavoritos('local'));
          }
        } catch (e) {
          console.warn('No se pudieron pasar los favoritos de invitado', e);
        }

        let delServidor: string[] | null = null;
        try {
          delServidor = await obtenerFavoritos();
          unidos = Array.from(new Set([...unidos, ...delServidor]));
        } catch (e) {
          console.warn('No se pudieron bajar los favoritos de la cuenta', e);
        }

        // Lo marcado como invitado (o lo que quedó solo en este teléfono) viaja
        // a la cuenta: si no, se pierde al cambiar de teléfono (PRD §5).
        if (delServidor) {
          const faltan = unidos.filter((id) => !delServidor!.includes(id));
          await Promise.allSettled(faltan.map((id) => agregarFavorito(id)));
        }
      }

      if (!vivo) return;

      setFavorites(unidos);
      AsyncStorage.setItem(clave, JSON.stringify(unidos)).catch((e) =>
        console.warn('No se pudieron guardar los favoritos', e)
      );
    })();

    return () => {
      vivo = false;
    };
  }, [usuarioId]);

  // PRD §4: las visitas de la cuenta también viven en el servidor. Al entrar se
  // bajan y se copian a recorrido_offline.db, así el recorrido arranca con datos
  // aunque después se corte la señal.
  useEffect(() => {
    if (!user) return;
    let vivo = true;

    (async () => {
      try {
        const delServidor = await obtenerVisitasDeLaCuenta();
        if (!vivo) return;

        const lugares = new Map(rawPlaces.map((p) => [p.id, p]));
        for (const visita of delServidor) {
          await guardarVisitaDelServidor(visita);
          const lugar = lugares.get(visita.lugarId);
          if (lugar) {
            await guardarSnapshotVisita(
              visita.id,
              lugar.nombre || lugar.title || '',
              lugar.imageUrl || lugar.imagenes?.[0] || null
            );
          }
        }

        if (vivo) await recargarVisitas();
      } catch (e) {
        console.warn('No se pudieron bajar las visitas de la cuenta', e);
      }
    })();

    return () => {
      vivo = false;
    };
    // El catálogo ya está cargado cuando el usuario inicia sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // PRD §7: cuando vuelve la señal, se sube lo que quedó en la cola.
  useEffect(() => {
    if (usuarioId === 'local') return;

    const suscripcion = Network.addNetworkStateListener((estado) => {
      if (estado.isConnected) empujarVisitas(usuarioId);
    });

    return () => suscripcion.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  // Visitas más recientes primero. `visitedPlaces` y `visitPhotos` se derivan
  // de acá para que las pantallas viejas sigan funcionando igual.
  const visitasOrdenadas = [...visitas].sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
  );

  const visitedPlaces: string[] = [];
  const visitPhotos: Record<string, string> = {};
  for (const visita of visitasOrdenadas) {
    if (!visitedPlaces.includes(visita.lugarId)) visitedPlaces.push(visita.lugarId);
    if (visita.fotoUri && !visitPhotos[visita.lugarId]) {
      visitPhotos[visita.lugarId] = visita.fotoUri;
    }
  }

  /**
   * Registra una visita del PRD: origen (qr/gps/manual), foto, nota y
   * sincronizada: false. Se guarda primero en el teléfono (PRD §7).
   */
  const registrarVisita = async (
    lugarId: string,
    opciones: OpcionesVisita = {}
  ): Promise<Visita> => {
    let fotoUri = opciones.fotoUri ?? null;

    // La foto de la cámara vive en caché: la copiamos a un lugar permanente.
    if (
      fotoUri &&
      FileSystem.documentDirectory &&
      !fotoUri.startsWith(FileSystem.documentDirectory)
    ) {
      try {
        const destino = `${FileSystem.documentDirectory}visita-${lugarId}-${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: fotoUri, to: destino });
        fotoUri = destino;
      } catch (e) {
        console.warn('No se pudo guardar la foto de la visita', e);
      }
    }

    const lugar = rawPlaces.find((p) => p.id === lugarId);

    const visita: Visita = {
      id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      usuarioId,
      lugarId,
      fechaHora: new Date().toISOString(),
      origen: opciones.origen ?? 'manual',
      fotoUri,
      nota: opciones.nota?.trim() ? opciones.nota.trim() : null,
      sincronizada: false,
      // Copia del lugar: el recorrido no pierde el nombre si el lugar
      // se da de baja o si la app se abre sin conexión (PRD §7).
      lugarNombre: lugar?.nombre ?? null,
      lugarImagen: lugar?.imagenes?.[0] ?? null,
    };

    setVisitas((prev) => [visita, ...prev]);

    try {
      await guardarVisita(visita);
    } catch (e) {
      console.warn('No se pudo guardar la visita en SQLite', e);
    }

    // Con sesión se sube sola; si no hay señal queda en la cola.
    empujarVisitas(usuarioId);

    return visita;
  };

  const actualizarNotaVisita = async (visitaId: string, nota: string): Promise<void> => {
    const limpia = nota.trim() ? nota.trim() : null;
    // Queda pendiente hasta que la API confirme el cambio.
    setVisitas((prev) =>
      prev.map((v) => (v.id === visitaId ? { ...v, nota: limpia, sincronizada: false } : v))
    );
    try {
      await actualizarVisita(visitaId, { nota: limpia, sincronizada: false });
      empujarVisitas(usuarioId);
    } catch (e) {
      console.warn('No se pudo actualizar la nota de la visita', e);
    }
  };

  const eliminarVisita = async (visitaId: string): Promise<void> => {
    setVisitas((prev) => prev.filter((v) => v.id !== visitaId));
    try {
      await eliminarVisitaDeDb(visitaId);
    } catch (e) {
      console.warn('No se pudo borrar la visita', e);
    }
  };

  /**
   * Completa la copia de nombre/portada de las visitas viejas que se guardaron
   * antes de que existiera ese snapshot. Solo toca visitas cuyo lugar sigue
   * estando en el catálogo.
   */
  useEffect(() => {
    if (rawPlaces.length === 0 || visitas.length === 0) return;

    const pendientes = visitas.filter(
      (v) => !v.lugarNombre && rawPlaces.some((p) => p.id === v.lugarId)
    );
    if (pendientes.length === 0) return;

    (async () => {
      for (const visita of pendientes) {
        const lugar = rawPlaces.find((p) => p.id === visita.lugarId);
        if (!lugar) continue;
        const imagen = lugar.imagenes?.[0] ?? null;
        try {
          await guardarSnapshotVisita(visita.id, lugar.nombre, imagen);
          setVisitas((prev) =>
            prev.map((v) =>
              v.id === visita.id ? { ...v, lugarNombre: lugar.nombre, lugarImagen: imagen } : v
            )
          );
        } catch (e) {
          console.warn('No se pudo completar la copia del lugar en la visita', e);
        }
      }
    })();
  }, [rawPlaces, visitas]);

  /** Visitas que apuntan a un lugar que ya no está en el catálogo y sin copia. */
  const visitasHuerfanas = visitas.filter(
    (v) =>
      rawPlaces.length > 0 &&
      !rawPlaces.some((p) => p.id === v.lugarId) &&
      !v.lugarNombre
  );

  const limpiarVisitasHuerfanas = async (): Promise<void> => {
    // Sin catálogo cargado no podemos distinguir "huérfana" de "sin conexión".
    if (rawPlaces.length === 0 || visitasHuerfanas.length === 0) return;

    const ids = visitasHuerfanas.map((v) => v.id);
    setVisitas((prev) => prev.filter((v) => !ids.includes(v.id)));
    try {
      await eliminarVisitasDeIds(ids);
    } catch (e) {
      console.warn('No se pudieron borrar las visitas huérfanas', e);
    }
  };

  const toggleVisited = (placeId: string): boolean => {
    const yaVisitado = visitas.some((v) => v.lugarId === placeId);

    if (yaVisitado) {
      setVisitas((prev) => prev.filter((v) => v.lugarId !== placeId));
      eliminarVisitasDeLugar(placeId, usuarioId).catch((e) =>
        console.warn('No se pudieron borrar las visitas del lugar', e)
      );
      return false;
    }

    registrarVisita(placeId, { origen: 'manual' }).catch((e) =>
      console.warn('No se pudo registrar la visita', e)
    );
    return true;
  };

  const saveVisitPhoto = async (placeId: string, uri: string) => {
    try {
      const destino = `${FileSystem.documentDirectory}visita-${placeId}-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: destino });

      const visita = visitasOrdenadas.find((v) => v.lugarId === placeId);
      if (visita) {
        setVisitas((prev) =>
          prev.map((v) =>
            v.id === visita.id ? { ...v, fotoUri: destino, sincronizada: false } : v
          )
        );
        await actualizarVisita(visita.id, { fotoUri: destino, sincronizada: false });
        empujarVisitas(usuarioId);
      } else {
        await registrarVisita(placeId, { origen: 'manual', fotoUri: destino });
      }
    } catch (e) {
      console.warn('Error al guardar la foto de la visita', e);
    }
  };

  const [userLocation, setUserLocation] = useState<Coordinates>({
    latitud: COLON_LAT,
    longitud: COLON_LNG,
    latitude: COLON_LAT,
    longitude: COLON_LNG,
  });

  // Si el usuario ya dio permiso antes, aprovechamos la última posición
  // conocida sin volver a preguntar (el mapa tiene que andar sin permiso).
  useEffect(() => {
    let montado = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        if (montado) setPermisoUbicacion('concedido');

        const ultima = await Location.getLastKnownPositionAsync();
        if (!ultima || !montado) return;

        const coords: Coordinates = {
          latitud: ultima.coords.latitude,
          longitud: ultima.coords.longitude,
          latitude: ultima.coords.latitude,
          longitude: ultima.coords.longitude,
        };
        setUbicacionActual(coords);
        setUserLocation(coords);
      } catch (e) {
        console.warn('No se pudo leer la última ubicación conocida', e);
      }
    })();
    return () => {
      montado = false;
    };
  }, []);

  /** Pide permiso y devuelve la posición real del teléfono (PRD §2 y §4). */
  const actualizarUbicacion = async (): Promise<Coordinates | null> => {
    setActualizandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermisoUbicacion('denegado');
        return null;
      }
      setPermisoUbicacion('concedido');

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinates = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
      };
      setUbicacionActual(coords);
      setUserLocation(coords);
      return coords;
    } catch (e) {
      console.warn('No se pudo obtener la ubicación actual', e);
      return null;
    } finally {
      setActualizandoUbicacion(false);
    }
  };

  /** Vuelve a bajar el catálogo completo y lo guarda para uso offline. */
  const actualizarCatalogo = async (): Promise<void> => {
    try {
      const catalogo = await refrescarCatalogo();
      setRawPlaces(catalogo.datos);
      setCatalogoOffline(catalogo.origen === 'cache');
      setCatalogoActualizadoEn(catalogo.actualizadoEn);
      if (catalogo.origen === 'red') setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el catálogo');
    }
  };

  const [reviews, setReviews] = useState<Review[]>([]);

  // Mapeo de Lugar[] de la API a Place[] de las pantallas.
  const places: Place[] = rawPlaces.map((p) => {
    const placeReviews = reviews.filter((r) => r.placeId === p.id);
    const userRating = userRatings[p.id];

    let calcRating = p.rating ?? 0;
    let calcRatingCount = p.ratingCount ?? 0;

    if (placeReviews.length > 0) {
      const avg = placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
      calcRating = Math.round(avg * 10) / 10;
      calcRatingCount = placeReviews.length;
    } else if (userRating !== undefined) {
      calcRating = userRating;
      calcRatingCount = 1;
    }

    const lat = p.coordenadas?.latitud ?? p.coordenadas?.latitude ?? COLON_LAT;
    const lng = p.coordenadas?.longitud ?? p.coordenadas?.longitude ?? COLON_LNG;

    return {
      ...p,
      title: p.nombre || p.title || '',
      category: p.categoriaId || p.category || '',
      address: p.direccion || p.address || '',
      description: p.descripcion || p.description || '',
      // ARREGLO CRÍTICO: Extrae de forma segura el string del array de imágenes
      imageUrl: p.imageUrl || (p.imagenes && p.imagenes[0]) || 'https://placeholder.com',
      rating: calcRating,
      ratingCount: calcRatingCount,
      userRating,
      coordinates: {
        latitud: lat,
        longitud: lng,
        latitude: lat,
        longitude: lng,
      },
    };
  });

  // PRD §2: "una lista de lo que tenés cerca ordenada por distancia".
  const lugaresCercanos: LugarCercano[] = ubicacionActual
    ? places
        .map((lugar) => ({
          lugar,
          distancia: distanciaMetros(ubicacionActual, lugar.coordinates),
        }))
        .sort((a, b) => a.distancia - b.distancia)
    : [];

  const addReview = (
    placeId: string,
    userName: string,
    userAvatar: string | undefined,
    rating: number,
    comment: string,
    photo?: string
  ) => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      placeId,
      userName,
      userAvatar,
      rating,
      date: 'Reciente',
      comment,
      photos: photo ? [photo] : [],
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const getReviewsByPlaceId = (placeId: string): Review[] => {
    return reviews.filter((r) => r.placeId === placeId);
  };

  const toggleFavorite = (placeId: string) => {
    const yaEstaba = favorites.includes(placeId);
    const siguiente = yaEstaba
      ? favorites.filter((id) => id !== placeId)
      : [...favorites, placeId];

    setFavorites(siguiente);

    // Los favoritos tienen que sobrevivir a cerrar la app (PRD §3), pero cada
    // cuenta (y el invitado) guarda los suyos.
    AsyncStorage.setItem(claveFavoritos(usuarioId), JSON.stringify(siguiente)).catch((e) =>
      console.warn('No se pudieron guardar los favoritos', e)
    );

    // Con sesión, el servidor también se entera (PRD §5).
    if (user) {
      const pedido = yaEstaba ? quitarFavorito(placeId) : agregarFavorito(placeId);
      pedido.catch((e) => console.warn('No se pudo sincronizar el favorito', e));
    }
  };

  const isFavorite = (placeId: string): boolean => {
    return favorites.includes(placeId);
  };

  const toggleEventReminder = (eventId: string): boolean => {
    const exists = eventReminders.includes(eventId);
    setEventReminders((prev) =>
      exists ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
    return !exists;
  };

  const ratePlace = (placeId: string, rating: number) => {
    setUserRatings((prev) => ({ ...prev, [placeId]: rating }));
  };

  const getPlaceById = (id: string): Place | undefined => {
    return places.find((p) => p.id === id);
  };

  const getEventById = (id: string): CityEvent | undefined => {
    return events.find((e) => e.id === id);
  };

  const getPlaceByQR = (qrCode: string): Place | undefined => {
    return places.find((p) => p.qrCodeId === qrCode || (p as any).codigoQr === qrCode);
  };

  // Motor de filtrado reactivo tolerante e inteligente
  const filteredPlaces = places.filter((place) => {
    const textoNormalizado = searchQuery.toLowerCase().trim();
    
    // Si hay texto en la barra de búsqueda, priorizamos la palabra e ignoramos temporalmente las píldoras de arriba
    const matchesCategory =
      textoNormalizado !== '' || 
      selectedCategory === 'all' || 
      place.category === selectedCategory;

    const matchesSearch =
      textoNormalizado === '' ||
      (place.title && place.title.toLowerCase().includes(textoNormalizado)) ||
      (place.nombre && place.nombre.toLowerCase().includes(textoNormalizado)) ||
      (place.description && place.description.toLowerCase().includes(textoNormalizado)) ||
      (place.descripcion && place.descripcion.toLowerCase().includes(textoNormalizado));

    return matchesCategory && matchesSearch;
  });

  return (
    <PlacesContext.Provider
      value={{
        places,
        categories,
        events,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        favorites,
        toggleFavorite,
        isFavorite,
        visitedPlaces,
        toggleVisited,
        visitPhotos,
        saveVisitPhoto,
        userRatings,
        ratePlace,
        reviews,
        addReview,
        getReviewsByPlaceId,
        eventReminders,
        toggleEventReminder,
        userLocation,
        setUserLocation,
        filteredPlaces,
        getPlaceById,
        getEventById,
        getPlaceByQR,
        cargando,
        error,
        visitas,
        registrarVisita,
        actualizarNotaVisita,
        eliminarVisita,
        recargarVisitas,
        visitasHuerfanas,
        limpiarVisitasHuerfanas,
        ubicacionActual,
        permisoUbicacion,
        actualizandoUbicacion,
        actualizarUbicacion,
        lugaresCercanos,
        catalogoOffline,
        catalogoActualizadoEn,
        actualizarCatalogo,
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};

export const usePlaces = (): PlacesContextType => {
  const context = useContext(PlacesContext);
  if (!context) {
    throw new Error('usePlaces debe usarse dentro de un PlacesProvider');
  }
  return context;
};