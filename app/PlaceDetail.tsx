// app/PlaceDetail.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { usePlaces } from '../src/context/PlacesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const placeId = params.placeId as string;

  const { user } = useAuth();
  const {
    getPlaceById,
    isFavorite,
    toggleFavorite,
    visitedPlaces,
    markAsVisited,
    ratePlace,
    getReviewsByPlaceId,
    addReview,
  } = usePlaces() as any;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justRated, setJustRated] = useState<number | null>(null);

  // Formulario de experiencias y fotos
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');
  const [modalPhoto, setModalPhoto] = useState('');

  const place = getPlaceById(placeId);
  const placeReviews: any[] = getReviewsByPlaceId ? getReviewsByPlaceId(placeId) : [];

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Lugar no encontrado</Text>
          <TouchableOpacity style={styles.btnVolver} onPress={() => router.back()}>
            <Text style={styles.btnVolverText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isVisited = visitedPlaces.includes(place.id);
  const galleryImages: string[] =
    place.images && place.images.length > 0 ? place.images : [place.imageUrl];

  const handleMarkVisited = () => {
    markAsVisited(place.id);
    Alert.alert(
      '¡Visita Registrada! 🎉',
      `Has guardado tu visita a "${place.title}".\n\nPodés ver todo tu historial de visitas en la pestaña Perfil > Bitácora de Visitas.`
    );
  };

  const handleRate = (stars: number) => {
    ratePlace(place.id, stars);
    setJustRated(stars);
    Alert.alert(
      '¡Gracias por calificar!',
      `Le diste ${stars} estrella${stars > 1 ? 's' : ''} a ${place.title}.`
    );
  };

  const handlePublishReview = () => {
    if (!modalComment.trim()) {
      Alert.alert(
        'Escribe un comentario',
        'Por favor comparte qué tal fue tu experiencia o un consejo para otros viajeros.'
      );
      return;
    }

    if (addReview) {
      addReview(
        place.id,
        user?.name || 'Turista Explorador',
        user?.avatar,
        modalRating,
        modalComment.trim(),
        modalPhoto.trim() || undefined
      );
    }

    setIsReviewModalVisible(false);
    setModalComment('');
    setModalPhoto('');
    setModalRating(5);
    Alert.alert('¡Experiencia Publicada! 📸', 'Tu reseña y foto ya son visibles para toda la comunidad.');
  };

  const handleOpenGoogleMaps = () => {
    const { latitude, longitude } = place.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo mapa:', err);
    });
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(slide);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CARRUSEL DE IMÁGENES HERO */}
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

          {/* Botones flotantes superiores */}
          <View style={[styles.topActions, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.actionCircle} onPress={() => router.back()}>
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

          {/* Indicador de fotos */}
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
                <View key={i} style={[styles.dot, activeImageIndex === i && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{place.category.toUpperCase()}</Text>
            </View>
            <View style={styles.ratingBadge}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    place.rating >= star
                      ? 'star'
                      : place.rating >= star - 0.5
                      ? 'star-half'
                      : 'star-outline'
                  }
                  size={14}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.ratingBadgeText}>
                {place.ratingCount > 0
                  ? `${place.rating.toFixed(1)} (${place.ratingCount})`
                  : 'Sin puntaje aún'}
              </Text>
            </View>
            <View style={styles.visitBadge}>
              <Ionicons name="eye-outline" size={14} color="#6B7280" />
              <Text style={styles.visitBadgeText}>{place.visitCount ?? 0} visitas</Text>
            </View>
          </View>

          <Text style={styles.title}>{place.title}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color="#4F46E5" />
            <Text style={styles.addressText}>{place.address}</Text>
          </View>

          {/* CALIFICACIÓN INTERACTIVA */}
          <View style={styles.rateCard}>
            <View style={styles.rateCardHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.rateCardTitle}>
                {place.userRating
                  ? 'Tu calificación para este lugar:'
                  : '¿Visitaste este atractivo? Calificalo:'}
              </Text>
            </View>
            <View style={styles.starTouchRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const currentRating = place.userRating || justRated || 0;
                const isSelected = star <= currentRating;
                return (
                  <TouchableOpacity
                    key={star}
                    style={styles.starButton}
                    onPress={() => handleRate(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'star' : 'star-outline'}
                      size={32}
                      color={isSelected ? '#F59E0B' : '#D1D5DB'}
                    />
                    <Text style={[styles.starNumber, isSelected && styles.starNumberActive]}>
                      {star}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.rateCardSub}>
              {place.userRating
                ? `Puntaje guardado: ${place.userRating} de 5 estrellas. ¡Tocá para cambiarlo!`
                : 'Tocá las estrellas para dejar tu voto'}
            </Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.btnAccion, isVisited && styles.btnAccionActive]}
              onPress={handleMarkVisited}
            >
              <Ionicons
                name={isVisited ? 'checkmark-circle' : 'footsteps-outline'}
                size={20}
                color={isVisited ? '#fff' : '#4F46E5'}
              />
              <Text style={[styles.btnAccionText, isVisited && styles.btnAccionTextActive]}>
                {isVisited ? 'Lugar Visitado' : 'Marcar Visitado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAccionPrimary} onPress={handleOpenGoogleMaps}>
              <Ionicons name="navigate-outline" size={20} color="#fff" />
              <Text style={styles.btnAccionTextPrimary}>Cómo Llegar</Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <Text style={styles.sectionTitle}>Acerca de este lugar</Text>
          <Text style={styles.description}>{place.description}</Text>

          {/* Experiencias de la comunidad */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Experiencias ({placeReviews.length})</Text>
            <TouchableOpacity
              style={styles.btnWriteReview}
              onPress={() => setIsReviewModalVisible(true)}
            >
              <Ionicons name="camera-outline" size={16} color="#4F46E5" />
              <Text style={styles.btnWriteReviewText}>Compartir</Text>
            </TouchableOpacity>
          </View>

          {placeReviews.length === 0 ? (
            <Text style={styles.noReviewsText}>
              Todavía no hay experiencias. ¡Sé el primero en compartir la tuya!
            </Text>
          ) : (
            placeReviews.map((review: any, index: number) => (
              <View key={review.id ?? index} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Image
                    source={{
                      uri:
                        review.userAvatar ||
                        review.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                    }}
                    style={styles.reviewAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUser}>
                      {review.userName || review.user || 'Viajero'}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={(review.rating || 0) >= s ? 'star' : 'star-outline'}
                          size={12}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                {(review.photoUrl || review.photo) && (
                  <Image
                    source={{ uri: review.photoUrl || review.photo }}
                    style={styles.reviewPhoto}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL: publicar experiencia */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compartí tu experiencia</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Tu puntaje</Text>
            <View style={styles.modalStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setModalRating(s)}>
                  <Ionicons
                    name={s <= modalRating ? 'star' : 'star-outline'}
                    size={30}
                    color={s <= modalRating ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Comentario</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="¿Qué tal fue? Dejá un consejo para otros viajeros"
              placeholderTextColor="#9CA3AF"
              value={modalComment}
              onChangeText={setModalComment}
              multiline
            />

            <Text style={styles.modalLabel}>URL de una foto (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://..."
              placeholderTextColor="#9CA3AF"
              value={modalPhoto}
              onChangeText={setModalPhoto}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TouchableOpacity style={styles.btnPublish} onPress={handlePublishReview}>
              <Text style={styles.btnPublishText}>Publicar experiencia</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
  btnVolver: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnVolverText: { color: '#fff', fontWeight: 'bold' },

  // Carrusel
  carouselContainer: { width: SCREEN_WIDTH, height: 300, backgroundColor: '#E5E7EB' },
  heroImage: { width: SCREEN_WIDTH, height: 300 },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationBadge: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paginationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  dotsContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },

  // Contenido
  content: {
    marginTop: -24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingBadgeText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  visitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visitBadgeText: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  addressText: { fontSize: 14, color: '#4B5563', flex: 1 },

  // Calificación
  rateCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rateCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rateCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E', flex: 1 },
  starTouchRow: { flexDirection: 'row', justifyContent: 'space-between' },
  starButton: { alignItems: 'center', flex: 1 },
  starNumber: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  starNumberActive: { color: '#B45309', fontWeight: 'bold' },
  rateCardSub: { fontSize: 12, color: '#92400E', textAlign: 'center', marginTop: 10 },

  // Botones
  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  btnAccionActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  btnAccionText: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5' },
  btnAccionTextActive: { color: '#fff' },
  btnAccionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
  },
  btnAccionTextPrimary: { fontSize: 13, fontWeight: 'bold', color: '#fff' },

  // Descripción y reseñas
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 24, marginBottom: 8 },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnWriteReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
  },
  btnWriteReviewText: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  noReviewsText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB' },
  reviewUser: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  reviewComment: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  reviewPhoto: { width: '100%', height: 160, borderRadius: 12, marginTop: 10, backgroundColor: '#E5E7EB' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  modalStars: { flexDirection: 'row', gap: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalTextArea: { minHeight: 90, textAlignVertical: 'top' },
  btnPublish: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnPublishText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
