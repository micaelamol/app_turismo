// src/mocks/categorias.ts
import { Categoria } from '../tipos';

export const MOCK_CATEGORIAS: Categoria[] = [
  { id: 'all', nombre: 'Todos', name: 'Todos', icono: 'apps-outline', icon: 'apps-outline', color: '#4F46E5', orden: 0 },
  { id: 'monumentos', nombre: 'Historia & Santuarios', name: 'Historia & Santuarios', icono: 'business-outline', icon: 'business-outline', color: '#6366F1', orden: 1 },
  { id: 'naturaleza', nombre: 'Diques & Paisajes', name: 'Diques & Paisajes', icono: 'trail-sign-outline', icon: 'trail-sign-outline', color: '#06B6D4', orden: 2 },
  { id: 'museos', nombre: 'Museos & Arte', name: 'Museos & Arte', icono: 'library-outline', icon: 'library-outline', color: '#EC4899', orden: 3 },
  { id: 'parques', nombre: 'Parques & Plazas', name: 'Parques & Plazas', icono: 'leaf-outline', icon: 'leaf-outline', color: '#10B981', orden: 4 },
  { id: 'cultura', nombre: 'Teatros & Auditorios', name: 'Teatros & Auditorios', icono: 'musical-notes-outline', icon: 'musical-notes-outline', color: '#8B5CF6', orden: 5 },
  { id: 'gastronomia', nombre: 'Ruta del Vino & Sabores', name: 'Ruta del Vino & Sabores', icono: 'wine-outline', icon: 'wine-outline', color: '#F59E0B', orden: 6 },
];
