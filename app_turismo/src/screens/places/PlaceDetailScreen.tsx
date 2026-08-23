import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePlaces } from '../../context/PlacesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

export const PlaceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { placeId } = route.params;
  const { getPlaceById, isFavorite, toggleFavorite, visitedPlaces, markAsVisited } = usePlaces();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const place = getPlaceById(placeId);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Lugar no encontrado</Text>
      </SafeAreaView>
    );
  }

  const isVisited = visitedPlaces.includes(place.id);
  const galleryImages = place.images && place.images.length > 0 ? place.images : [place.imageUrl];

  const handleAudioPlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleMarkVisited = () => {
    markAsVisited(place.id);
    Alert.alert('¡Visita Registrada!', `Has guardado tu visita a ${place.title} en tu bitácora.`);
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(slide);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 📸 CARRUSEL DE IMÁGENES HERO */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={galleryImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(_, index) => `img-${index}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
            )}
          />

          {/* Botones Flotantes Superiores */}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.actionCircle} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCircle} onPress={() => toggleFavorite(place.id)}>
              <Ionicons
                name={isFavorite(place.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite(place.id) ? '#EF4444' : '#1F2937'}
              />
            </TouchableOpacity>
          </View>

          {/* Indicador de fotos (Paginación 1/6) y Puntitos */}
          {galleryImages.length > 1 && (
            <View style={styles.paginationBadge}>
              <Ionicons name="images-outline" size={12} color="#fff" />
              <Text style={styles.paginationText}>
                {activeImageIndex + 1} / {galleryImages.length}
              </Text>
            </View>
          )}

          {galleryImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, activeImageIndex === i && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{place.category.toUpperCase()}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingBadgeText}>{place.rating} / 5.0</Text>
            </View>
            <View style={styles.visitBadge}>
              <Ionicons name="eye-outline" size={14} color="#6B7280" />
              <Text style={styles.visitBadgeText}>{place.visitCount} visitas</Text>
            </View>
          </View>

          <Text style={styles.title}>{place.title}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color="#4F46E5" />
            <Text style={styles.addressText}>{place.address}</Text>
          </View>

          {/* Reproductor de Audioguía */}
          {place.audioGuideTitle && (
            <View style={styles.audioPlayerCard}>
              <View style={styles.audioIconBox}>
                <Ionicons name="headset-outline" size={24} color="#4F46E5" />
              </View>
              <View style={styles.audioTextInfo}>
                <Text style={styles.audioLabel}>AUDIOGUÍA DISPONIBLE</Text>
                <Text style={styles.audioTitle} numberOfLines={1}>
                  {place.audioGuideTitle}
                </Text>
                <Text style={styles.audioDuration}>{place.audioDuration || '3:30 min'}</Text>
              </View>
              <TouchableOpacity style={styles.playButton} onPress={handleAudioPlay}>
                <Ionicons name={isPlayingAudio ? 'pause' : 'play'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Descripción</Text>
            <Text style={styles.paragraph}>{place.description}</Text>
          </View>

          {/* Historia y Curiosidades */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Historia y Valor Patrimonial</Text>
            <Text style={styles.paragraph}>{place.history}</Text>
          </View>

          {/* Datos Prácticos */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeading}>Información para tu visita</Text>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>{place.schedule || 'Abierto todo el año'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="ticket-outline" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>{place.entryFee || 'Acceso gratuito'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="qr-code-outline" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>Código del Tótem: {place.qrCodeId}</Text>
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.btnAction, isVisited ? styles.btnVisited : styles.btnVisit]}
              onPress={handleMarkVisited}
            >
              <Ionicons
                name={isVisited ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.btnActionText}>
                {isVisited ? '¡Lugar Visitado!' : 'Marcar como Visitado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('ScannerTab')}
            >
              <Ionicons name="qr-code" size={18} color="#4F46E5" />
              <Text style={styles.btnSecondaryText}>Escanear Tótem QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  carouselContainer: {
    position: 'relative',
    height: 300,
    width: SCREEN_WIDTH,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  topActions: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  actionCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationBadge: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    marginTop: -20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitBadgeText: {
    fontSize: 11,
    color: '#6B7280',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  audioPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  audioIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioTextInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 30,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnVisit: {
    backgroundColor: '#4F46E5',
  },
  btnVisited: {
    backgroundColor: '#10B981',
  },
  btnActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  btnSecondaryText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
