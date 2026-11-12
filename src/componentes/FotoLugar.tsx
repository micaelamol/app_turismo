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

  // Si cambia la foto (por ejemplo, al terminar una descarga) se reintenta.
  useEffect(() => {
    setFallo(false);
  }, [uri]);

  const categoria = categories.find((c) => c.id === categoriaId);
  const icono = (categoria?.icono ?? categoria?.icon ?? 'image-outline') as any;
  const color = categoria?.color ?? '#6B7280';
  const tieneFoto = Boolean(uri && uri.trim());

  if (tieneFoto && !fallo) {
    return (
      <View style={[styles.contenedor, style]}>
        <Image
          source={{ uri: uri as string }}
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
