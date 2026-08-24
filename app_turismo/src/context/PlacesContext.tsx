import React, { createContext, useContext, useState } from 'react';
import { CATEGORIES, EVENTS, PLACES } from '../data/mockData';
import { Category, CityEvent, Coordinates, Place } from '../types';

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

  // Ubicación inicial por defecto: Centro de San Juan, Argentina (Plaza 25 de Mayo)
  const [userLocation, setUserLocation] = useState<Coordinates>({
    latitude: -31.5373,
    longitude: -68.5252,
  });

  // Los lugares inician en 0 para reflejar que la app es nueva y se calculan según las opiniones
  const places: Place[] = PLACES.map((p) => {
    const userRating = userRatings[p.id];
    if (userRating !== undefined) {
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

