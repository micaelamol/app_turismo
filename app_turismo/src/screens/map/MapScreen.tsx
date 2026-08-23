import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePlaces } from '../../context/PlacesContext';
import { Place } from '../../types';

interface Props {
  navigation: any;
}

export const MapScreen: React.FC<Props> = ({ navigation }) => {
  const { places, userLocation, categories, selectedCategory, setSelectedCategory } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(places[0]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header flotante */}
      <View style={styles.header}>
        <Text style={styles.title}>Mapa de la Ciudad</Text>
        <Text style={styles.subtitle}>Explora monumentos y lugares cerca de tu ubicación</Text>

        {/* Filtro rápido horizontal */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Visualizador de Mapa / Radar */}
      <View style={styles.mapCanvas}>
        <View style={styles.radarBackground}>
          <View style={[styles.radarCircle, { width: 320, height: 320, borderRadius: 160 }]} />
          <View style={[styles.radarCircle, { width: 220, height: 220, borderRadius: 110 }]} />
          <View style={[styles.radarCircle, { width: 120, height: 120, borderRadius: 60 }]} />

          {/* Posición del Usuario (Punto Azul con pulso) */}
          <View style={styles.userLocationMarker}>
            <View style={styles.userPulse} />
            <View style={styles.userDot} />
          </View>

          {/* Marcadores de Lugares en el radar / mapa */}
          {places.map((place, index) => {
            const isSelected = selectedPlace?.id === place.id;
            // Posicionamiento distribuido para visualización interactiva
            const offsets = [
              { top: 50, left: 70 },
              { top: 90, right: 60 },
              { bottom: 90, left: 60 },
              { bottom: 60, right: 80 },
              { top: 180, left: 40 },
              { top: 200, right: 50 },
            ];
            const pos = offsets[index % offsets.length];

            return (
              <TouchableOpacity
                key={place.id}
                style={[
                  styles.placePin,
                  pos as any,
                  isSelected && styles.placePinSelected,
                ]}
                onPress={() => setSelectedPlace(place)}
              >
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={isSelected ? 26 : 20}
                  color={isSelected ? '#4F46E5' : '#EF4444'}
                />
                <View style={[styles.pinLabel, isSelected && styles.pinLabelSelected]}>
                  <Text style={[styles.pinLabelText, isSelected && styles.pinLabelTextSelected]} numberOfLines={1}>
                    {place.title.split(' ')[0]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botón de re-centrar GPS */}
        <TouchableOpacity style={styles.gpsButton}>
          <Ionicons name="locate" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Tarjeta Flotante Inferior con el lugar seleccionado */}
      {selectedPlace && (
        <View style={styles.bottomCardContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PlaceDetail', { placeId: selectedPlace.id })}
          >
            <Image source={{ uri: selectedPlace.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <View style={styles.cardBadgeRow}>
                <Text style={styles.cardCategory}>{selectedPlace.category.toUpperCase()}</Text>
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate-outline" size={12} color="#4F46E5" />
                  <Text style={styles.distanceText}>a 350 m</Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedPlace.title}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {selectedPlace.address}
              </Text>

              <View style={styles.cardActionRow}>
                <View style={styles.btnDetail}>
                  <Text style={styles.btnDetailText}>Ver Guía y Detalles</Text>
                  <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userLocationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4F46E5',
    opacity: 0.5,
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#fff',
  },
  placePin: {
    position: 'absolute',
    alignItems: 'center',
  },
  placePinSelected: {
    transform: [{ scale: 1.2 }],
    zIndex: 20,
  },
  pinLabel: {
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pinLabelSelected: {
    backgroundColor: '#4F46E5',
  },
  pinLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  pinLabelTextSelected: {
    color: '#fff',
  },
  gpsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  cardImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  distanceText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnDetailText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
});
