// app/(tabs)/mapa.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/types';

export default function MapScreen() {
  const router = useRouter();
  const { filteredPlaces, selectedCategory, setSelectedCategory, categories } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(filteredPlaces[0] || null);

  useEffect(() => {
    if (
      filteredPlaces.length > 0 &&
      (!selectedPlace || !filteredPlaces.find((p: Place) => p.id === selectedPlace.id))
    ) {
      setSelectedPlace(filteredPlaces[0]);
    }
  }, [filteredPlaces]);

  // Escucha los clics en los pines del mapa (versión web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (event: any) => {
      const data = event?.data;
      if (data && data.type === 'SELECT_PLACE') {
        const found = filteredPlaces.find((p: Place) => p.id === data.placeId);
        if (found) setSelectedPlace(found);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [filteredPlaces]);

  const handleOpenGoogleMaps = (place: Place) => {
    const { latitude, longitude } = place.coordinates;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo mapa:', err);
    });
  };

  const generateMapHtml = () => {
    const defaultLat = selectedPlace ? selectedPlace.coordinates.latitude : -31.5373;
    const defaultLng = selectedPlace ? selectedPlace.coordinates.longitude : -68.5252;
    const zoom =
      selectedPlace &&
      selectedPlace.category === 'naturaleza' &&
      Math.abs(selectedPlace.coordinates.latitude - -31.5373) > 0.5
        ? 9
        : 12;

    const markersJs = filteredPlaces
      .map((p: Place) => {
        const isSel = selectedPlace?.id === p.id;
        const color = isSel ? '#4F46E5' : '#EF4444';
        const titleSafe = p.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const addrSafe = p.address.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
              var msg = { type: 'SELECT_PLACE', placeId: '${p.id}' };
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(msg));
              } else {
                window.parent.postMessage(msg, '*');
              }
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
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #E0E7FF; }
          .custom-pin { cursor: pointer; transition: transform 0.2s; }
          .custom-pin:hover { transform: scale(1.15); }
          .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.2); font-family: system-ui, -apple-system, sans-serif; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true }).setView([${defaultLat}, ${defaultLng}], ${zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
          ${markersJs}
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_PLACE') {
        const found = filteredPlaces.find((p: Place) => p.id === data.placeId);
        if (found) setSelectedPlace(found);
      }
    } catch (e) {
      console.warn('Mensaje inválido desde el mapa', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Mapa de San Juan</Text>
            <Text style={styles.subtitle}>
              {filteredPlaces.length} atractivos geolocalizados con coordenadas GPS reales
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map((cat: any) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
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

      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            title: 'San Juan Real Map',
            srcDoc: generateMapHtml(),
            style: { width: '100%', height: '100%', border: 'none' },
          })
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: generateMapHtml() }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        )}

        <View style={styles.quickSelectBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          >
            {filteredPlaces.map((place: Place) => {
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
                  onPress={() =>
                    router.push({
                      pathname: '/PlaceDetail',
                      params: { placeId: selectedPlace.id },
                    } as any)
                  }
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
  webview: { flex: 1, backgroundColor: '#E0E7FF' },
  quickSelectBar: { position: 'absolute', top: 12, left: 0, right: 0, zIndex: 10 },
  quickChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickChipActive: { backgroundColor: '#4F46E5' },
  quickChipText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  quickChipTextActive: { color: '#fff' },
  bottomCardContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 },
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
  cardImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#E5E7EB' },
  cardInfo: { flex: 1, paddingLeft: 12, justifyContent: 'space-between' },
  cardBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  cardAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },
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
