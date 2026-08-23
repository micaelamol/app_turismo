export type UserRole = 'turista' | 'habitante';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  title: string;
  category: string;
  description: string;
  history: string;
  address: string;
  coordinates: Coordinates;
  rating: number;
  imageUrl: string;
  images?: string[]; // Carrusel de fotos múltiples
  audioGuideTitle?: string;
  audioDuration?: string;
  qrCodeId: string;
  visitCount: number;
  isFeatured?: boolean;
  schedule?: string;
  entryFee?: string;
}

export interface CityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl: string;
  category: string;
  price: string;
}

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  PlaceDetail: { placeId: string };
  EventDetail: { eventId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  ScannerTab: undefined;
  EventsTab: undefined;
  FavoritesTab: undefined;
};
