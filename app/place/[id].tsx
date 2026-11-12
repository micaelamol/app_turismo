// app/place/[id].tsx
import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import FlechaLugar from '../../src/componentes/FlechaLugar';
import FotoLugar from '../../src/componentes/FotoLugar';
import ReproductorAudioguia from '../../src/componentes/ReproductorAudioguia';
import { useAuth } from '../../src/context/AuthContext';
import { usePlaces } from '../../src/context/PlacesContext';
import { useDescargas } from '../../src/hooks/useDescargas';
import { obtenerAudioguiaLocal, estimarPesoBytes, formatearBytes, NivelDescarga } from '../../src/servicios/descargas';
import { estadoApertura, formatearHorarios, precioLegible } from '../../src/utils/lugares';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlaceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const placeId = params.id as string;

  const { user } = useAuth();
  const {
    getPlaceById,
    isFavorite,
    toggleFavorite,
    visitedPlaces,
    toggleVisited,
    ratePlace,
    getReviewsByPlaceId,
    addReview,
    ubicacionActual,
    actualizarUbicacion,
    actualizandoUbicacion,
  } = usePlaces() as any;

  const { estaDescargado, obtenerDescarga, descargar, eliminar, descargandoId, cargando: cargandoDescargas } = useDescargas();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justRated, setJustRated] = useState<number | null>(null);

  // Formulario de experiencias y fotos
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');
  const [modalPhoto, setModalPhoto] = useState('');
  const [isDescargaModalVisible, setIsDescargaModalVisible] = useState(false);
  const [nivelDescarga, setNivelDescarga] = useState<NivelDescarga>('liviano');

  const placeFromContext = getPlaceById(placeId);
  const descargaFallback = !placeFromContext ? obtenerDescarga(placeId) : null;
  const place = (placeFromContext ?? descargaFallback?.datos) as any;
  const descargando = descargandoId === placeId;
  const placeReviews: any[] = getReviewsByPlaceId ? getReviewsByPlaceId(placeId) : [];

  if (!place) {
    if (cargandoDescargas) {
      return (
        <SafeAreaView style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.errorText}>Cargando...</Text>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Lugar no encontrado</Text>
          <TouchableOpacity style={styles.btnVolver} onPress={() => router.back()}>
            <Text style={styles.btnVolverText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isVisited = visitedPlaces.includes(place.id);

  // PRD §6: audioguía del lugar. Si ya se descargó, se reproduce el archivo local.
  const audioguia = place.audioguia ?? null;
  const audioLocal = obtenerAudioguiaLocal(place.id);
  const audioUrl: string | null = audioguia?.url ? audioLocal ?? audioguia.url : null;

  // PRD §1: el detalle muestra horario, teléfono y precio de entrada.
  const horariosTexto = formatearHorarios(place.horarios);
  const apertura = estadoApertura(place.horarios);
  const precio = precioLegible(place.precioEntrada);

  const descargaActual = obtenerDescarga(place.id);
  const imagenesLocales = descargaActual?.galeriaLocal && descargaActual.galeriaLocal.length > 0
    ? descargaActual.galeriaLocal
    : null;

  // Galería: si el lugar está descargado, usamos las imágenes locales;
  // si no, las remotas del backend.
  const galleryImages: string[] = imagenesLocales
    ? imagenesLocales
    : place.imagenes && place.imagenes.length > 0
    ? place.imagenes
    : place.images && place.images.length > 0
    ? place.images
    : [place.imageUrl];

  const handleToggleVisited = () => {
    const ahoraVisitado = toggleVisited(place.id);
    if (ahoraVisitado) {
      // PRD §8: respuesta háptica al registrar una visita.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        '¡Visita Registrada! 🎉',
        `Has guardado tu visita a "${place.title}".\n\nPodés ver tu historial en la pestaña Recorrido.`
      );
    } else {
      Alert.alert('Visita Eliminada', `Quitamos "${place.title}" de tu historial.`);
    }
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
        user?.nombre || 'Turista Explorador',
        user?.avatarUrl ?? undefined,
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

  // PRD §2: la flecha necesita la ubicación real del teléfono.
  const handleUbicacion = async () => {
    const coords = await actualizarUbicacion();
    if (!coords) {
      Alert.alert(
        'Sin ubicación',
        'No pudimos obtener tu ubicación. Revisá los permisos de la app en los ajustes del teléfono.'
      );
    }
  };

  const handleDescargar = async () => {
    if (!place || descargando) return;
    try {
      await descargar(place as any, nivelDescarga);
      setIsDescargaModalVisible(false);
      Alert.alert('Descargado', 'El lugar quedó disponible sin conexión.');
    } catch (e: any) {
      Alert.alert('No se pudo descargar', e?.message ?? 'Intentá de nuevo.');
    }
  };

  const handleEliminarDescarga = () => {
    if (!place) return;
    Alert.alert('Borrar descarga', `¿Quitar "${place.title}" de tus descargas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminar(place.id);
            Alert.alert('Borrado', 'Se liberó el espacio.');
          } catch {
            Alert.alert('Error', 'No se pudo borrar.');
          }
        },
      },
    ]);
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
              <FotoLugar
                uri={item}
                categoriaId={place.categoriaId ?? place.category}
                style={styles.heroImage}
                iconSize={54}
                mostrarEtiqueta
              />
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

          {/* Información: horario, entrada, teléfono, web y accesibilidad (PRD §1) */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Información</Text>

            {apertura && (
              <View style={styles.infoRow}>
                <Ionicons
                  name={apertura.abierto ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={apertura.abierto ? '#059669' : '#B45309'}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: apertura.abierto ? '#059669' : '#B45309', fontWeight: '600' },
                  ]}
                >
                  {apertura.texto}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
              <View style={{ flex: 1 }}>
                {horariosTexto.length > 0 ? (
                  horariosTexto.map((linea) => (
                    <Text key={linea} style={styles.infoText}>
                      {linea}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.infoTextMuted}>Horario a confirmar</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="ticket-outline" size={18} color="#4F46E5" />
              <Text style={styles.infoText}>Entrada: {precio}</Text>
            </View>

            {place.telefono ? (
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${place.telefono}`)}
                accessibilityRole="button"
                accessibilityLabel={`Llamar al ${place.telefono}`}
              >
                <Ionicons name="call-outline" size={18} color="#4F46E5" />
                <Text style={[styles.infoText, styles.infoLink]}>{place.telefono}</Text>
              </TouchableOpacity>
            ) : null}

            {place.sitioWeb ? (
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(place.sitioWeb)}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${place.sitioWeb}`}
              >
                <Ionicons name="globe-outline" size={18} color="#4F46E5" />
                <Text style={[styles.infoText, styles.infoLink]} numberOfLines={1}>
                  {place.sitioWeb}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.infoRow}>
              <Ionicons
                name={place.accesible ? 'accessibility-outline' : 'close-circle-outline'}
                size={18}
                color={place.accesible ? '#059669' : '#9CA3AF'}
              />
              <Text style={[styles.infoText, !place.accesible && { color: '#9CA3AF' }]}>
                {place.accesible
                  ? 'Accesible para silla de ruedas'
                  : 'No accesible para silla de ruedas'}
              </Text>
            </View>
          </View>

          {/* PRD §2: flecha con brújula cuando el lugar no se ve */}
          {ubicacionActual && (
            <FlechaLugar origen={ubicacionActual} destino={place.coordinates} />
          )}

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
              onPress={handleToggleVisited}
            >
              <Ionicons
                name={isVisited ? 'checkmark-circle' : 'footsteps-outline'}
                size={20}
                color={isVisited ? '#fff' : '#4F46E5'}
              />
              <Text style={[styles.btnAccionText, isVisited && styles.btnAccionTextActive]}>
                {isVisited ? 'Quitar de visitados' : 'Marcar Visitado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAccionPrimary} onPress={handleOpenGoogleMaps}>
              <Ionicons name="navigate-outline" size={20} color="#fff" />
              <Text style={styles.btnAccionTextPrimary}>Cómo Llegar</Text>
            </TouchableOpacity>
          </View>

          {/* PRD §2: distancia y flecha hacia el lugar */}
          {!ubicacionActual && (
            <TouchableOpacity
              style={styles.btnUbicacion}
              onPress={handleUbicacion}
              disabled={actualizandoUbicacion}
              activeOpacity={0.8}
            >
              {actualizandoUbicacion ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Ionicons name="locate-outline" size={16} color="#4F46E5" />
              )}
              <Text style={styles.btnUbicacionText}>
                {actualizandoUbicacion
                  ? 'Buscando tu ubicación…'
                  : 'Ver qué tan lejos estoy y para qué lado queda'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Modo offline */}
          <View style={styles.offlineCard}>
            <View style={styles.offlineHeader}>
              <Ionicons name="cloud-download-outline" size={20} color="#4F46E5" />
              <Text style={styles.offlineTitle}>Modo offline</Text>
            </View>

            {estaDescargado(place.id) ? (
              <>
                <Text style={styles.offlineStatus}>
                  ✅ Disponible sin conexión ·{' '}
                  {obtenerDescarga(place.id)?.nivel === 'completo' ? 'Completo' : 'Liviano'} ·{' '}
                  {formatearBytes(obtenerDescarga(place.id)?.pesoBytes ?? 0)}
                </Text>
                <Text style={styles.offlineMeta}>
                  Descargado el{' '}
                  {obtenerDescarga(place.id)
                    ? new Date(obtenerDescarga(place.id)!.descargadoEn).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                      })
                    : ''}
                </Text>

                <View style={styles.offlineActions}>
                  <TouchableOpacity
                    style={styles.offlineBtn}
                    onPress={() => {
                      setNivelDescarga('liviano');
                      setIsDescargaModalVisible(true);
                    }}
                    disabled={descargando}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
                    <Text style={styles.offlineBtnText}>Actualizar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.offlineBtn, styles.offlineBtnDanger]}
                    onPress={handleEliminarDescarga}
                    disabled={descargando}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    <Text style={[styles.offlineBtnText, styles.offlineBtnTextDanger]}>Borrar</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.offlineLink}
                  onPress={() => router.push('/descargas')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.offlineLinkText}>Ver mis descargas</Text>
                  <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.offlineStatus}>
                  No descargado. Bajá la ficha para verla sin conexión.
                </Text>

                <TouchableOpacity
                  style={styles.offlineBtnPrimary}
                  onPress={() => {
                    setNivelDescarga('liviano');
                    setIsDescargaModalVisible(true);
                  }}
                  disabled={descargando}
                  activeOpacity={0.85}
                >
                  {descargando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.offlineBtnPrimaryText}>Descargar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Descripción */}
          <Text style={styles.sectionTitle}>Acerca de este lugar</Text>
          <Text style={styles.description}>{place.description}</Text>

          {/* Audioguía (PRD §6) */}
          {audioguia && audioUrl && (
            <ReproductorAudioguia
              key={audioUrl}
              url={audioUrl}
              titulo={place.title}
              duracionSegundos={audioguia.duracionSegundos}
              idioma={audioguia.idioma}
              disponibleOffline={!!audioLocal}
            />
          )}

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

      {/* MODAL: descarga offline */}
      <Modal
        visible={isDescargaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDescargaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¿Cuánto querés descargar?</Text>
              <TouchableOpacity onPress={() => setIsDescargaModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{place.title}</Text>

            <TouchableOpacity
              style={[styles.nivelOption, nivelDescarga === 'liviano' && styles.nivelOptionActive]}
              onPress={() => setNivelDescarga('liviano')}
              activeOpacity={0.8}
            >
              <View style={styles.nivelRadio}>
                {nivelDescarga === 'liviano' && <View style={styles.nivelRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nivelTitle}>Liviano</Text>
                <Text style={styles.nivelDesc}>
                  {`Datos + portada${place.audioguia ? ' + audioguía' : ''} · ~${formatearBytes(
                    estimarPesoBytes(place, 'liviano')
                  )}`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nivelOption, nivelDescarga === 'completo' && styles.nivelOptionActive]}
              onPress={() => setNivelDescarga('completo')}
              activeOpacity={0.8}
            >
              <View style={styles.nivelRadio}>
                {nivelDescarga === 'completo' && <View style={styles.nivelRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nivelTitle}>Completo</Text>
                <Text style={styles.nivelDesc}>
                  {`Datos + galería completa${place.audioguia ? ' + audioguía' : ''} · ~${formatearBytes(
                    estimarPesoBytes(place, 'completo')
                  )}`}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.modalHint}>
              {place.audioguia
                ? 'Se guardan las imágenes y la audioguía en el dispositivo para usarlas sin conexión.'
                : 'Se guardan las imágenes en el dispositivo para usarlas sin conexión.'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsDescargaModalVisible(false)}
                disabled={descargando}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirm, descargando && styles.modalConfirmDisabled]}
                onPress={handleDescargar}
                disabled={descargando}
              >
                {descargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Descargar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  btnUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  btnUbicacionText: { fontSize: 12, fontWeight: '600', color: '#4F46E5', flexShrink: 1 },

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

  // Información del lugar
  infoCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  infoTextMuted: { flex: 1, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  infoLink: { color: '#4F46E5', textDecorationLine: 'underline' },

  // Modo offline
  offlineCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  offlineTitle: { fontSize: 15, fontWeight: 'bold', color: '#4F46E5' },
  offlineStatus: { fontSize: 13, color: '#374151', lineHeight: 19 },
  offlineMeta: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  offlineActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  offlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  offlineBtnText: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  offlineBtnDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  offlineBtnTextDanger: { color: '#DC2626' },
  offlineBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  offlineBtnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  offlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 6,
  },
  offlineLinkText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },

  // Modal descarga
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  nivelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  nivelOptionActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  nivelRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nivelRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
  nivelTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  nivelDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  modalHint: { fontSize: 11, color: '#9CA3AF', marginTop: 4, lineHeight: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' },
  modalConfirm: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  modalConfirmDisabled: { backgroundColor: '#A5B4FC' },
  modalConfirmText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
});
