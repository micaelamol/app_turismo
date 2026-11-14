// app/(tabs)/mapa.tsx
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FotoLugar from '../../src/componentes/FotoLugar';
import PlacesMap from '../../src/componentes/PlacesMap';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/tipos';
import { elegirComoLlegar } from '../../src/utils/comoLlegar';
import { distanciaMetros, formatearDistancia } from '../../src/utils/geo';

export default function MapScreen() {
  const router = useRouter();
  const {
    filteredPlaces,
    selectedCategory,
    setSelectedCategory,
    categories,
    userLocation,
    ubicacionActual,
    permisoUbicacion,
    actualizarUbicacion,
    actualizandoUbicacion,
  } = usePlaces();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(
    filteredPlaces[0] || null
  );

  // Pedir permiso de ubicación apenas se abre la pantalla del mapa (si aún no se preguntó)
  useEffect(() => {
    if (permisoUbicacion === 'desconocido') {
      actualizarUbicacion();
    }
  }, [permisoUbicacion]);

  // Usa la ubicación GPS real si el usuario dio permiso; si la negó, usa el centro de Colón
  const posicionReferencia = ubicacionActual ?? userLocation;

  // PRD, punto 2: "una lista de lo que tenés cerca ordenada por distancia".
  const cercanos = React.useMemo(
    () =>
      filteredPlaces
        .map((place: Place) => ({
          place,
          metros: distanciaMetros(posicionReferencia, place.coordinates),
        }))
        .sort((a, b) => a.metros - b.metros),
    [filteredPlaces, posicionReferencia]
  );

  const metrosDelSeleccionado = selectedPlace
    ? distanciaMetros(posicionReferencia, selectedPlace.coordinates)
    : null;

  useEffect(() => {
    if (
      filteredPlaces.length > 0 &&
      (!selectedPlace ||
        !filteredPlaces.find((p: Place) => p.id === selectedPlace.id))
    ) {
      setSelectedPlace(filteredPlaces[0]);
    }
  }, [filteredPlaces]);

  const handleOpenGoogleMaps = (place: Place) => {
    const { latitude, longitude } = place.coordinates;
    elegirComoLlegar(`${latitude},${longitude}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mapa de Colón</Text>
            <Text style={styles.subtitle}>
              {filteredPlaces.length} atractivos geolocalizados
              {permisoUbicacion === 'denegado' ? ' · Ubicación desactivada' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={() => actualizarUbicacion()}
            disabled={actualizandoUbicacion}
            accessibilityLabel="Actualizar mi ubicación"
          >
            <Ionicons
              name={permisoUbicacion === 'concedido' ? 'locate' : 'locate-outline'}
              size={20}
              color={permisoUbicacion === 'concedido' ? '#4F46E5' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'all' && {
                backgroundColor: '#111827',
                borderColor: '#111827',
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'all' && styles.filterChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {categories.map((cat: any) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  isSelected && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {cat.nombre ?? cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.mapCanvas}>
        <PlacesMap
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelect={setSelectedPlace}
        />

        <View style={styles.quickSelectBar}>
          <Text style={styles.quickSelectTitle}>Lo que tenés cerca</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          >
            {cercanos.map(({ place, metros }) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.quickChip, isSelected && styles.quickChipActive]}
                  onPress={() => setSelectedPlace(place)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      isSelected && styles.quickChipTextActive,
                    ]}
                  >
                    {place.title} · {formatearDistancia(metros)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {selectedPlace && (
        <View style={styles.bottomCardContainer}>
          <View style={styles.card}>
            <FotoLugar
              uri={selectedPlace.imageUrl}
              categoriaId={selectedPlace.category}
              style={styles.cardImage}
            />
            <View style={styles.cardInfo}>
              <View style={styles.cardBadgeRow}>
                <Text style={styles.cardCategory}>
                  {selectedPlace.category.toUpperCase()}
                </Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {(selectedPlace.ratingCount ?? 0) > 0
                      ? selectedPlace.rating.toFixed(1)
                      : 'Nuevo'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedPlace.title}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {selectedPlace.address}
              </Text>
              {metrosDelSeleccionado !== null && (
                <View style={styles.cardDistanceRow}>
                  <Ionicons name="walk-outline" size={13} color="#4F46E5" />
                  <Text style={styles.cardDistance}>
                    A {formatearDistancia(metrosDelSeleccionado)} de donde estás
                  </Text>
                </View>
              )}

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={styles.btnDetail}
                  onPress={() => router.push(`/place/${selectedPlace.id}`)}
                >
                  <Text style={styles.btnDetailText}>Ver Detalle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnMaps}
                  onPress={() => handleOpenGoogleMaps(selectedPlace)}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.btnMapsText}>Cómo llegar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  gpsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterScroll: { marginTop: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#F9FAFB',
  },
  filterChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  mapCanvas: { flex: 1, position: 'relative' },
  quickSelectBar: { position: 'absolute', top: 12, left: 0, right: 0, zIndex: 10 },
  quickSelectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    marginLeft: 14,
    marginBottom: 6,
  },
  quickChip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickChipActive: { backgroundColor: '#4F46E5' },
  quickChipText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  quickChipTextActive: { color: '#fff' },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  cardInfo: { flex: 1, paddingLeft: 12, justifyContent: 'space-between' },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: '#92400E' },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  cardAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardDistance: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  cardActionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnDetail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
  },
  btnDetailText: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  btnMaps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  btnMapsText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
});





