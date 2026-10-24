import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { obtenerCategorias } from '../servicios/categories';
import { obtenerEventos } from '../servicios/events';
import { obtenerLugares } from '../servicios/places';
import { Category, CityEvent, Coordinates, Lugar, Place, Review } from '../tipos';
import * as FileSystem from 'expo-file-system/legacy';

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
  const [favorites, setFavorites] = useState<string[]>(['p0', 'p1', 'p2']);
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>(['p0']);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [eventReminders, setEventReminders] = useState<string[]>([]);

  // Consumir la capa de servicios asíncrona (Requisito obligatorio del PRD)
  useEffect(() => {
    let montado = true;
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        const [resLugares, resCategorias, resEventos] = await Promise.all([
          obtenerLugares(),
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
      } catch (e) {
        console.warn('Error loading visited places', e);
      }
    })();
  }, []);

  // Helper para persistir visitados
  const persistVisited = async (list: string[]) => {
    try {
      await AsyncStorage.setItem('@visitedPlaces', JSON.stringify(list));
    } catch (e) {
      console.warn('Error persisting visited places', e);
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
    const [visitPhotos, setVisitPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@visitPhotos');
        if (stored) setVisitPhotos(JSON.parse(stored));
      } catch (e) {
        console.warn('Error loading visit photos', e);
      }
    })();
  }, []);

  const saveVisitPhoto = async (placeId: string, uri: string) => {
    try {
      // La foto de la cámara queda en caché y puede borrarse: la copio a un lugar permanente
      const dest = `${FileSystem.documentDirectory}visita-${placeId}-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      const next = { ...visitPhotos, [placeId]: dest };
      setVisitPhotos(next);
      await AsyncStorage.setItem('@visitPhotos', JSON.stringify(next));
    } catch (e) {
      console.warn('Error saving visit photo', e);
    }
  };

  const [userLocation, setUserLocation] = useState<Coordinates>({
    latitud: -31.5373,
    longitud: -68.5252,
    latitude: -31.5373,
    longitude: -68.5252,
  });

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      placeId: 'p0',
      userName: 'Camila Rodriguez',
      userAvatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: 'Hace 2 días',
      comment:
        '¡Una experiencia de otro planeta! Imperdible hacer el circuito guiado con luna llena en Ischigualasto. Llevar abundante agua y calzado deportivo.',
      photos: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'rev-2',
      placeId: 'p19',
      userName: 'Mariano Gomez',
      userAvatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: 'Ayer',
      comment:
        'La degustación de Syrah y la visita a la cava de barricas fue excelente. Nos atendieron con una calidez sanjuanina única.',
      photos: [
        'https://tse1.mm.bing.net/th/id/OIP.ykWY8ptD_NMMhGWFYUIlTAHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',
      ],
    },
  ]);

  // Los lugares se calculan según valoraciones y opiniones y se mapean para compatibilidad
  const places: Place[] = rawPlaces.map((p) => {
    const placeReviews = reviews.filter((r) => r.placeId === p.id);
    const userRating = userRatings[p.id];

    let calcRating = p.rating ?? 0;
    let calcRatingCount = p.ratingCount ?? 0;

    if (placeReviews.length > 0) {
      const avg =
        placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
      calcRating = Math.round(avg * 10) / 10;
      calcRatingCount = placeReviews.length;
    } else if (userRating !== undefined) {
      calcRating = userRating;
      calcRatingCount = 1;
    }

    const lat = p.coordenadas.latitud ?? p.coordenadas.latitude ?? -31.5373;
    const lng = p.coordenadas.longitud ?? p.coordenadas.longitude ?? -68.5252;

    return {
      ...p,
      title: p.title || p.nombre || '',
      category: p.category || p.categoriaId || '',
      address: p.address || p.direccion || '',
      description: p.description || p.descripcion || '',
      imageUrl: p.imageUrl || (p.imagenes && p.imagenes[0]) || '',
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
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      placeId,
      userName: userName || 'Turista Explorador',
      userAvatar:
        userAvatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating,
      date: 'Recién publicado',
      comment,
      photos: photo ? [photo] : undefined,
    };

    setReviews((prev) => [newRev, ...prev]);
    ratePlace(placeId, rating);
  };

  const getReviewsByPlaceId = (placeId: string) => {
    return reviews.filter((r) => r.placeId === placeId);
  };

  const toggleFavorite = (placeId: string) => {
    setFavorites((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const isFavorite = (placeId: string) => favorites.includes(placeId);

  const ratePlace = (placeId: string, rating: number) => {
    setUserRatings((prev) => ({
      ...prev,
      [placeId]: rating,
    }));
  };

  const toggleEventReminder = (eventId: string): boolean => {
    const isAlreadyReminded = eventReminders.includes(eventId);
    if (isAlreadyReminded) {
      setEventReminders((prev) => prev.filter((id) => id !== eventId));
      return false;
    } else {
      setEventReminders((prev) => [...prev, eventId]);
      return true;
    }
  };

  const getPlaceById = (id: string) => places.find((p) => p.id === id);

  const getEventById = (id: string) => events.find((e) => e.id === id);

  const getPlaceByQR = (qrCode: string) =>
    places.find((p) => p.qrCodeId === qrCode || p.codigoQr === qrCode || p.id === qrCode);

  // Filtrado reactivo por categoría y texto de búsqueda
  const filteredPlaces = places.filter((place) => {
    const categoryKey = place.categoriaId || place.category;
    const matchesCategory =
      selectedCategory === 'all' ||
      categoryKey === selectedCategory ||
      (selectedCategory === 'parques' && categoryKey === 'naturaleza');

    const searchLower = searchQuery.toLowerCase();
    const titleVal = place.nombre || place.title || '';
    const descVal = place.descripcion || place.description || '';
    const addrVal = place.direccion || place.address || '';

    const matchesSearch =
      titleVal.toLowerCase().includes(searchLower) ||
      descVal.toLowerCase().includes(searchLower) ||
      addrVal.toLowerCase().includes(searchLower);

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
