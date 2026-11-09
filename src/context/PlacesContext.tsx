import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { obtenerCategorias } from '../servicios/categories';
import { obtenerEventos } from '../servicios/events';
import { obtenerLugares } from '../servicios/places';
import { Category, CityEvent, Coordinates, Lugar, Place, Review } from '../tipos';
import * as FileSystem from 'expo-file-system/legacy';

// Centro de Colón, Entre Ríos
const COLON_LAT = -32.2241;
const COLON_LNG = -58.1411;

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
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rawPlaces, setRawPlaces] = useState<Lugar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<CityEvent[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [eventReminders, setEventReminders] = useState<string[]>([]);
  const [visitPhotos, setVisitPhotos] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<Review[]>([]);

  // Consumir la capa de servicios asíncrona pasando un objeto vacío inicial
  useEffect(() => {
    let montado = true;
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        const [resLugares, resCategorias, resEventos] = await Promise.all([
          obtenerLugares({}), 
          obtenerCategorias(),
          obtenerEventos(),
        ]);
        if (montado) {
          setRawPlaces(resLugares.datos);
          setCategories(resCategorias.datos);
          setEvents(resEventos.datos);
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

  // Cargar datos persistidos al montar
  useEffect(() => {
    (async () => {
      try {
        const storedVisited = await AsyncStorage.getItem('@visitedPlaces');
        if (storedVisited) {
          setVisitedPlaces(JSON.parse(storedVisited));
        }
        const storedPhotos = await AsyncStorage.getItem('@visitPhotos');
        if (storedPhotos) {
          setVisitPhotos(JSON.parse(storedPhotos));
        }
      } catch (e) {
        console.warn('Error al cargar datos locales persistidos', e);
      }
    })();
  }, []);

  // Helper para persistir visitados
  const persistVisited = async (list: string[]) => {
    try {
      await AsyncStorage.setItem('@visitedPlaces', JSON.stringify(list));
    } catch (e) {
      console.warn('Error al guardar lugares visitados', e);
    }
  };

  const toggleVisited = (placeId: string): boolean => {
    const isAlreadyVisited = visitedPlaces.includes(placeId);
    const newList = isAlreadyVisited
      ? visitedPlaces.filter((id) => id !== placeId)
      : [...visitedPlaces, placeId];
    setVisitedPlaces(newList);
    persistVisited(newList);
    return !isAlreadyVisited;
  };

  const saveVisitPhoto = async (placeId: string, uri: string) => {
    try {
      const dest = `${FileSystem.documentDirectory}visita-${placeId}-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      const next = { ...visitPhotos, [placeId]: dest };
      setVisitPhotos(next);
      await AsyncStorage.setItem('@visitPhotos', JSON.stringify(next));
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

  // Mapeo seguro de Lugar[] de Postgres a Place[] de React Native
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
    setFavorites((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
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