import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Linking,
    Platform,
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
  const { filteredPlaces, selectedCategory, setSelectedCategory, categories } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(filteredPlaces[0] || null);

  useEffect(() => {
    if (filteredPlaces.length > 0 && (!selectedPlace || !filteredPlaces.find((p) => p.id === selectedPlace.id))) {
      setSelectedPlace(filteredPlaces[0]);
    }
  }, [filteredPlaces]);

  const handleOpenGoogleMaps = (place: Place) => {
    const { latitude, longitude } = place.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo mapa:', err);
    });
  };

  // Generación del código HTML para el mapa interactivo real con Leaflet & OpenStreetMap
  const generateMapHtml = () => {
    const defaultLat = selectedPlace ? selectedPlace.coordinates.latitude : -31.5373;
    const defaultLng = selectedPlace ? selectedPlace.coordinates.longitude : -68.5252;
    const zoom = selectedPlace && selectedPlace.category === 'naturaleza' && Math.abs(selectedPlace.coordinates.latitude - (-31.5373)) > 0.5 ? 9 : 12;

    const markersJs = filteredPlaces
      .map((p) => {
        const isSel = selectedPlace?.id === p.id;
        const color = isSel ? '#4F46E5' : '#EF4444';
        const titleSafe = p.title.replace(/'/g, "\\'");
        const addrSafe = p.address.replace(/'/g, "\\'");
        return `
          (function() {
            var icon = L.divIcon({
              className: 'custom-pin',
              html: '<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">📍</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            });
            var m = L.marker([${p.coordinates.latitude}, ${p.coordinates.longitude}], { icon: icon }).addTo(map);
            m.bindPopup('<b>${titleSafe}</b><br/><span style="color:#666;font-size:12px;">${addrSafe}</span>');
            m.on('click', function() {
              window.parent.postMessage({ type: 'SELECT_PLACE', placeId: '${p.id}' }, '*');
            });
            ${isSel ? 'm.openPopup();' : ''}
          })();
        `;
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #E0E7FF;
          }
          .custom-pin {
            cursor: pointer;
            transition: transform 0.2s;
          }
          .custom-pin:hover {
            transform: scale(1.15);
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            font-family: system-ui, -apple-system, sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true }).setView([${defaultLat}, ${defaultLng}], ${zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap San Juan'
          }).addTo(map);

          ${markersJs}
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header flotante con categorías */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Mapa de San Juan</Text>
            <Text style={styles.subtitle}>20 atractivos geolocalizados con coordenadas GPS reales</Text>
          </View>
        </View>

        {/* Filtro de Categorías */}
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

      {/* Contenedor del Mapa Real */}
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          <iframe
            title="San Juan Real Map"
            srcDoc={generateMapHtml()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        ) : (
          <View style={styles.nativeFallback}>
            <Text style={styles.nativeFallbackText}>Cargando mapa interactivo...</Text>
          </View>
        )}

        {/* Selector Rápido de Lugares en la parte superior del mapa */}
        <View style={styles.quickSelectBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {filteredPlaces.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.quickChip, isSelected && styles.quickChipActive]}
                  onPress={() => setSelectedPlace(place)}
                >
                  <Text style={[styles.quickChipText, isSelected && styles.quickChipTextActive]}>
                    {place.title.split(' ')[0]} {place.title.split(' ')[1] || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Tarjeta Flotante Inferior con el lugar seleccionado */}
      {selectedPlace && (
        <View style={styles.bottomCardContainer}>
          <View style={styles.card}>
            <Image source={{ uri: selectedPlace.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <View style={styles.cardBadgeRow}>
                <Text style={styles.cardCategory}>{selectedPlace.category.toUpperCase()}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {selectedPlace.ratingCount > 0 ? selectedPlace.rating.toFixed(1) : 'Nuevo'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>
                {selectedPlace.title}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {selectedPlace.address}
              </Text>

              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  style={styles.btnDetail}
                  onPress={() => navigation.navigate('PlaceDetail', { placeId: selectedPlace.id })}
                >
                  <Text style={styles.btnDetailText}>Ver Ficha</Text>
                  <Ionicons name="arrow-forward" size={13} color="#4F46E5" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnNavigate}
                  onPress={() => handleOpenGoogleMaps(selectedPlace)}
                >
                  <Ionicons name="navigate" size={13} color="#fff" />
                  <Text style={styles.btnNavigateText}>Cómo Llegar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    marginTop: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E0E7FF',
  },
  nativeFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeFallbackText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  quickSelectBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  quickChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  quickChipTextActive: {
    color: '#fff',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  btnDetailText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  btnNavigate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  btnNavigateText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});
