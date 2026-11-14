// src/componentes/FotoLugar.tsx
// Foto de un lugar con reemplazo cuando no hay imagen o la que viene no carga.
// El PRD pide que los casos feos no rompan el diseño: en vez de dejar un
// hueco en blanco, mostramos un bloque con el ícono y el color de la categoría.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { usePlaces } from '../context/PlacesContext';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

function resolverUri(uri?: string | null): string | null {
  if (!uri || !uri.trim()) return null;
  const limpia = uri.trim().replace(/\\/g, '/');

  // Si es un archivo local del teléfono (modo offline), no se toca.
  if (/^(file:\/\/|content:\/\/|data:)/i.test(limpia)) {
    return limpia;
  }

  // Si viene con una IP local vieja o localhost (ej. http://192.168.0...),
  // la actualiza automáticamente a la IP actual configurada en EXPO_PUBLIC_API_URL.
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost)(:\d+)?\//i.test(limpia)) {
    if (!API_URL) return limpia;
    return limpia.replace(/^https?:\/\/[^/]+/i, API_URL);
  }

  // Si ya es una URL externa (https://...), se devuelve intacta.
  if (/^https?:\/\//i.test(limpia)) {
    return limpia;
  }

  // Si viene como ruta relativa ("imagenes/2026/11/molino1.jpg"),
  // le agrega la URL de la API y el prefijo /archivos/ si no lo tiene.
  const sinBarraInicial = limpia.replace(/^\/+/, '');
  const rutaConPrefijo = sinBarraInicial.startsWith('archivos/')
    ? sinBarraInicial
    : `archivos/${sinBarraInicial}`;

  return API_URL ? `${API_URL}/${rutaConPrefijo}` : `/${rutaConPrefijo}`;
}

interface Props {
  /** URL o ruta local de la foto. Vacía o nula muestra el reemplazo. */
  uri?: string | null;
  /** Categoría del lugar, para tomar el ícono y el color. */
  categoriaId?: string | null;
  /** Tamaño del bloque: ancho, alto y bordes. */
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  /** En bloques grandes conviene aclarar que no hay foto. */
  mostrarEtiqueta?: boolean;
}

export default function FotoLugar({
  uri,
  categoriaId,
  style,
  iconSize = 28,
  mostrarEtiqueta = false,
}: Props) {
  const { categories } = usePlaces();
  const [fallo, setFallo] = useState(false);

  const uriResuelta = resolverUri(uri);

  // Si cambia la foto (por ejemplo, al terminar una descarga) se reintenta.
  useEffect(() => {
    setFallo(false);
  }, [uriResuelta]);

  const categoria = categories.find((c) => c.id === categoriaId);
  const icono = (categoria?.icono ?? categoria?.icon ?? 'image-outline') as any;
  const color = categoria?.color ?? '#6B7280';
  const tieneFoto = Boolean(uriResuelta);

  if (tieneFoto && !fallo) {
    return (
      <View style={[styles.contenedor, style]}>
        <Image
          source={{ uri: uriResuelta as string }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFallo(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.reemplazo, style]}
      accessibilityRole="image"
      accessibilityLabel={
        categoria?.nombre ? `Sin foto de ${categoria.nombre}` : 'Sin foto'
      }
    >
      <Ionicons name={icono} size={iconSize} color={color} />
      {mostrarEtiqueta && <Text style={[styles.etiqueta, { color }]}>Sin foto</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  reemplazo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  etiqueta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
