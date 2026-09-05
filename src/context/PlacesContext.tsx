import React, { createContext, useContext, useState, useEffect } from 'react';
import { CATEGORIES, EVENTS, PLACES } from '../data/mockData';
import { Category, CityEvent, Coordinates, Place, Review } from '../types';

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
  markAsVisited: (placeId: string) => void;
  userRatings: Record<string, number>;
  ratePlace: (placeId: string, rating: number) => void;
  reviews: Review[];
  addReview: (placeId: string, userName: string, userAvatar: string | undefined, rating: number, comment: string, photo?: string) => void;
  getReviewsByPlaceId: (placeId: string) => Review[];
  eventReminders: string[];
  toggleEventReminder: (eventId: string) => boolean;
  userLocation: Coordinates;
  setUserLocation: (coords: Coordinates) => void;
  filteredPlaces: Place[];
  getPlaceById: (id: string) => Place | undefined;
  getEventById: (id: string) => CityEvent | undefined;
  getPlaceByQR: (qrCode: string) => Place | undefined;
}

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export const PlacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const categories = CATEGORIES;
  const events = EVENTS;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(['p0', 'p1', 'p2']);
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>(['p0']);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [eventReminders, setEventReminders] = useState<string[]>([]);

import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Helper to persist visited list
  const persistVisited = async (list: string[]) => {
    try {
      await AsyncStorage.setItem('@visitedPlaces', JSON.stringify(list));
    } catch (e) {
      console.warn('Error persisting visited places', e);
    }
  };

  const markAsVisited = (placeId: string) => {
    if (!visitedPlaces.includes(placeId)) {
      const newList = [...visitedPlaces, placeId];
      setVisitedPlaces(newList);
      persistVisited(newList);
    }
  };
  const [userLocation, setUserLocation] = useState<Coordinates>({
    latitude: -31.5373,
    longitude: -68.5252,
  });

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      placeId: 'p0',
      userName: 'Camila Rodriguez',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: 'Hace 2 días',
      comment: '¡Una experiencia de otro planeta! Imperdible hacer el circuito guiado con luna llena en Ischigualasto. Llevar abundante agua y calzado deportivo.',
      photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
    },
    {
      id: 'rev-2',
      placeId: 'p19',
      userName: 'Mariano Gomez',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      date: 'Ayer',
      comment: 'La degustación de Syrah y la visita a la cava de barricas fue excelente. Nos atendieron con una calidez sanjuanina única.',
      photos: ['https://tse1.mm.bing.net/th/id/OIP.ykWY8ptD_NMMhGWFYUIlTAHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'],
    },
  ]);

  // Los lugares inician y se calculan según las opiniones y valoraciones
  const places: Place[] = PLACES.map((p) => {
    const placeReviews = reviews.filter((r) => r.placeId === p.id);
    const userRating = userRatings[p.id];
    
    if (placeReviews.length > 0) {
      const avg = placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
      return {
        ...p,
        rating: Math.round(avg * 10) / 10,
        ratingCount: placeReviews.length,
        userRating,
      };
    } else if (userRating !== undefined) {
      return {
        ...p,
        rating: userRating,
        ratingCount: 1,
        userRating,
      };
    }
    return {
      ...p,
      rating: 0,
      ratingCount: 0,
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
      userAvatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
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

  const markAsVisited = (placeId: string) => {
    if (!visitedPlaces.includes(placeId)) {
      setVisitedPlaces((prev) => [...prev, placeId]);
    }
  };

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

  const getPlaceByQR = (qrCode: string) => places.find((p) => p.qrCodeId === qrCode || p.id === qrCode);

  // Filtrado reactivo por categoría y texto de búsqueda
  const filteredPlaces = places.filter((place) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      place.category === selectedCategory ||
      (selectedCategory === 'parques' && place.category === 'naturaleza');
    const matchesSearch =
      place.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase());
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
        markAsVisited,
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

