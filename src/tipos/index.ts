// src/tipos/index.ts
// Tipos oficiales definidos en el PRD de la cátedra con soporte completo de compatibilidad

export interface Coordenadas {
  latitud: number;
  longitud: number;
  latitude?: number;
  longitude?: number;
}

export type Coordinates = Coordenadas;

export interface Horario {
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo, 1 = lunes, etc.
  abre: string;                    // ej: "09:00"
  cierra: string;                  // ej: "19:00"
}

export interface Audioguia {
  url: string;
  duracionSegundos: number;
  idioma: "es" | "en" | "pt";
}

export interface Lugar {
  id: string;
  nombre: string;
  categoriaId: string;
  descripcionCorta: string;
  descripcion: string;
  coordenadas: Coordenadas;
  direccion: string;
  imagenes: string[];
  horarios: Horario[];
  telefono: string | null;
  sitioWeb: string | null;
  precioEntrada: number | null; // 0 para gratis, null cuando no aplica
  audioguia: Audioguia | null;
  codigoQr: string | null;
  accesible: boolean;
  activo: boolean;
  actualizadoEn: string; // ISO 8601

  // Campos de compatibilidad (opcionales en el mock)
  title?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  address?: string;
  coordinates?: Coordenadas & { latitude: number; longitude: number };
  description?: string;
  history?: string;
  rating?: number;
  ratingCount?: number;
  userRating?: number;
  audioGuideTitle?: string;
  audioDuration?: string;
  qrCodeId?: string;
  visitCount?: number;
  isFeatured?: boolean;
  schedule?: string;
  entryFee?: string;
}

// Place usado en componentes UI existentes garantizando propiedades
export interface Place extends Lugar {
  title: string;
  category: string;
  address: string;
  description: string;
  coordinates: Coordenadas & { latitude: number; longitude: number };
  imageUrl: string;
  rating: number;
  ratingCount: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string; // nombre del ícono de Ionicons
  color: string; // hexadecimal
  orden: number;
  name?: string;
  icon?: string;
}

export type EstadoEvento = "programado" | "suspendido" | "cancelado" | "finalizado";

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  lugarId: string | null;
  direccionLibre: string | null;
  coordenadas: Coordenadas | null;
  inicio: string; // ISO 8601
  fin: string | null;
  imagenUrl: string | null;
  precio: number | null; // 0 para gratis
  estado: EstadoEvento;

  // Campos de compatibilidad
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  priceDisplay?: string;
  price?: any;
  description?: string;
  imageUrl?: string;
}

export interface Preferencias {
  categoriasFavoritas: string[];
  avisarProximidad: boolean;
  radioAvisoMetros: number; // 100, 250 o 500
  tema: "claro" | "oscuro" | "sistema";
}

export interface Usuario {
  id: string;
  nombre?: string;
  name?: string;
  email: string;
  avatarUrl?: string | null;
  avatar?: string;
  creadoEn?: string; // ISO 8601
  preferencias?: Preferencias;
  role?: 'turista' | 'habitante';
}

export interface Favorito {
  id: string;
  usuarioId: string;
  lugarId: string;
  creadoEn: string; // ISO 8601
}

export type OrigenVisita = "qr" | "gps" | "manual";

export interface Visita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string; // ISO 8601
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: boolean;
}

export interface Review {
  id: string;
  placeId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
}

// Estructura oficial de respuestas de la API definida en el PRD
export interface MetaRespuesta {
  total: number;
  pagina: number;
  porPagina: number;
}

export interface RespuestaApiExito<T> {
  datos: T;
  meta?: MetaRespuesta;
}

export interface ErrorApi {
  codigo: string;
  mensaje: string;
}

export interface RespuestaApiError {
  error: ErrorApi;
}

export type RespuestaApi<T> = RespuestaApiExito<T> | RespuestaApiError;

// -------------------------------------------------------------------------
// Alias de compatibilidad
// -------------------------------------------------------------------------
export type UserRole = 'turista' | 'habitante';
export type User = Usuario;
export type Category = Categoria;
export type CityEvent = Evento;
