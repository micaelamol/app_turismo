import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePlaces } from '../../context/PlacesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  route: any;
  navigation: any;
}

export const PlaceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { placeId } = route.params;
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
  } = usePlaces();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justRated, setJustRated] = useState<number | null>(null);

  // Estados del Formulario de Experiencias y Fotos
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');
  const [modalPhoto, setModalPhoto] = useState('');

  const place = getPlaceById(placeId);
  const placeReviews = getReviewsByPlaceId(placeId);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Lugar no encontrado</Text>
      </SafeAreaView>
    );
  }

  const isVisited = visitedPlaces.includes(place.id);
  const galleryImages = place.images && place.images.length > 0 ? place.images : [place.imageUrl];

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
    Alert.alert('¡Gracias por calificar!', `Le diste ${stars} estrella${stars > 1 ? 's' : ''} a ${place.title}.`);
  };

  const handlePublishReview = () => {
    if (!modalComment.trim()) {
      Alert.alert('Escribe un comentario', 'Por favor comparte qué tal fue tu experiencia o un consejo para otros viajeros.');
      return;
    }

    addReview(
      place.id,
      user?.name || 'Turista Explorador',
      user?.avatar,
      modalRating,
      modalComment.trim(),
      modalPhoto.trim() || undefined
    );

    setIsReviewModalVisible(false);
    setModalComment('');
    setModalPhoto('');
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
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={place.rating >= star ? 'star' : place.rating >= star - 0.5 ? 'star-half' : 'star-outline'}
                  size={14}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.ratingBadgeText}>
                {place.ratingCount > 0 ? `${place.rating.toFixed(1)} (${place.ratingCount})` : 'Sin puntaje aún'}
              </Text>
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

          {/* ⭐ SECCIÓN INTERACTIVA DE CALIFICACIÓN */}
          <View style={styles.rateCard}>
            <View style={styles.rateCardHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.rateCardTitle}>
                {place.userRating ? 'Tu calificación para este lugar:' : '¿Visitaste este atractivo? Calificalo:'}
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
                    <Text style={[styles.starNumber, isSelected && styles.starNumberActive]}>{star}</Text>
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

          {/* 📸 SECCIÓN: EXPERIENCIAS & FOTOS DE TURISTAS */}
          <View style={styles.section}>
            <View style={styles.experiencesHeader}>
              <View>
                <Text style={styles.sectionHeading}>Experiencias & Fotos</Text>
                <Text style={styles.experiencesSub}>
                  {placeReviews.length > 0
                    ? `${placeReviews.length} opiniones de viajeros`
                    : 'Sé el primero en compartir tu experiencia'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.btnAddReview}
                onPress={() => setIsReviewModalVisible(true)}
              >
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.btnAddReviewText}>Dejar Reseña / Foto</Text>
              </TouchableOpacity>
            </View>

            {/* Listado de Experiencias de Turistas */}
            {placeReviews.length === 0 ? (
              <View style={styles.emptyReviewsCard}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyReviewsTitle}>Aún no hay opiniones con fotos</Text>
                <Text style={styles.emptyReviewsText}>
                  ¿Visitaste este lugar? ¡Comparte tu foto y consejo para otros turistas!
                </Text>
              </View>
            ) : (
              placeReviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <Image
                      source={{ uri: rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewUserInfo}>
                      <Text style={styles.reviewUserName}>{rev.userName}</Text>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={rev.rating >= s ? 'star' : 'star-outline'}
                          size={12}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>

                  <Text style={styles.reviewComment}>{rev.comment}</Text>

                  {/* Fotos subidas por el usuario */}
                  {rev.photos && rev.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotosRow}>
                      {rev.photos.map((photoUri, pIdx) => (
                        <Image key={pIdx} source={{ uri: photoUri }} style={styles.reviewPhotoItem} />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))
            )}
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
              style={styles.btnMaps}
              onPress={handleOpenGoogleMaps}
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.btnMapsText}>Cómo Llegar (Ruta GPS)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('MainTabs', { screen: 'ScannerTab' })}
            >
              <Ionicons name="qr-code" size={18} color="#4F46E5" />
              <Text style={styles.btnSecondaryText}>Escanear Tótem QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 📸 MODAL: PUBLICAR EXPERIENCIA Y FOTO */}
      <Modal
        visible={isReviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={styles.reviewModalContent}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>Compartir mi Experiencia</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>1. ¿Cómo calificarías este lugar?</Text>
              <View style={styles.modalStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setModalRating(s)}>
                    <Ionicons
                      name={s <= modalRating ? 'star' : 'star-outline'}
                      size={32}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>2. Tu Comentario / Consejo para otros turistas:</Text>
              <TextInput
                style={styles.formTextInput}
                placeholder="Cuenta tu experiencia: ¿Qué tal el lugar? ¿Recomiendas algún horario o qué llevar?..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={modalComment}
                onChangeText={setModalComment}
              />

              <Text style={styles.formLabel}>3. Adjuntar Foto de tu visita (Opcional):</Text>
              <View style={styles.photoPresetsRow}>
                <TouchableOpacity
                  style={[styles.photoPresetBtn, modalPhoto === 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' && styles.photoPresetBtnActive]}
                  onPress={() => setModalPhoto('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')}
                >
                  <Ionicons name="camera-outline" size={16} color="#4F46E5" />
                  <Text style={styles.photoPresetText}>Foto de Paisaje</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoPresetBtn, modalPhoto === 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' && styles.photoPresetBtnActive]}
                  onPress={() => setModalPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80')}
                >
                  <Ionicons name="person-outline" size={16} color="#4F46E5" />
                  <Text style={styles.photoPresetText}>Selfie / Recuerdo</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.photoUrlInput}
                placeholder="O pega el enlace de tu foto..."
                placeholderTextColor="#9CA3AF"
                value={modalPhoto}
                onChangeText={setModalPhoto}
              />

              {modalPhoto ? (
                <View style={styles.photoPreviewBox}>
                  <Image source={{ uri: modalPhoto }} style={styles.photoPreviewImg} />
                  <TouchableOpacity style={styles.btnRemovePhoto} onPress={() => setModalPhoto('')}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>Quitar Foto</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity style={styles.btnSubmitReview} onPress={handlePublishReview}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.btnSubmitReviewText}>Publicar Experiencia</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  rateCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  rateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rateCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400E',
  },
  starTouchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  starButton: {
    alignItems: 'center',
    padding: 4,
  },
  starNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  starNumberActive: {
    color: '#D97706',
    fontWeight: 'bold',
  },
  rateCardSub: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },
  btnMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#059669',
  },
  btnMapsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
