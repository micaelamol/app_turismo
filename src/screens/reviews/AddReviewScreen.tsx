import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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

interface Props {
  route: any;
  navigation: any;
}

export const AddReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { placeId } = route.params;
  const { user } = useAuth();
  const { getPlaceById, addReview } = usePlaces();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState('');

  const place = getPlaceById(placeId);

  const handlePublish = () => {
    if (!comment.trim()) {
      Alert.alert(
        'Escribe un comentario',
        'Por favor comparte qué tal fue tu experiencia o un consejo para otros viajeros.'
      );
      return;
    }

    addReview(
      placeId,
      user?.name || 'Turista Explorador',
      user?.avatar,
      rating,
      comment.trim(),
      photo.trim() || undefined
    );

    Alert.alert('¡Experiencia Publicada! 📸', 'Tu reseña ya es visible para toda la comunidad.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compartir Experiencia</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lugar Info */}
        {place && (
          <View style={styles.placeCard}>
            <Image source={{ uri: place.imageUrl }} style={styles.placeThumb} />
            <View style={styles.placeInfo}>
              <Text style={styles.placeName} numberOfLines={2}>{place.title}</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
            </View>
          </View>
        )}

        {/* Rating */}
        <Text style={styles.label}>¿Cómo calificarías este lugar?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn}>
              <Ionicons
                name={s <= rating ? 'star' : 'star-outline'}
                size={36}
                color="#F59E0B"
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>{rating} de 5 estrellas</Text>

        {/* Comment */}
        <Text style={styles.label}>Tu Comentario / Consejo para otros turistas:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Cuenta tu experiencia: ¿Qué tal el lugar? ¿Recomiendas algún horario o qué llevar?..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />

        {/* Photo */}
        <Text style={styles.label}>Adjuntar Foto de tu visita (Opcional):</Text>
        <View style={styles.photoPresetsRow}>
          <TouchableOpacity
            style={[
              styles.photoPresetBtn,
              photo === 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' && styles.photoPresetBtnActive,
            ]}
            onPress={() =>
              setPhoto('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80')
            }
          >
            <Ionicons name="camera-outline" size={18} color="#4F46E5" />
            <Text style={styles.photoPresetText}>Foto de Paisaje</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.photoPresetBtn,
              photo === 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' && styles.photoPresetBtnActive,
            ]}
            onPress={() =>
              setPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80')
            }
          >
            <Ionicons name="person-outline" size={18} color="#4F46E5" />
            <Text style={styles.photoPresetText}>Selfie / Recuerdo</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.photoUrlInput}
          placeholder="O pega el enlace de tu foto..."
          placeholderTextColor="#9CA3AF"
          value={photo}
          onChangeText={setPhoto}
        />

        {photo ? (
          <View style={styles.photoPreviewBox}>
            <Image source={{ uri: photo }} style={styles.photoPreviewImg} />
            <TouchableOpacity style={styles.btnRemovePhoto} onPress={() => setPhoto('')}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removePhotoText}>Quitar Foto</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity style={styles.btnSubmit} onPress={handlePublish}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.btnSubmitText}>Publicar Experiencia</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeThumb: {
    width: 80,
    height: 80,
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: '#B45309',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 20,
  },
  photoPresetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  photoPresetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  photoPresetBtnActive: {
    backgroundColor: '#C7D2FE',
    borderColor: '#4F46E5',
  },
  photoPresetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  photoUrlInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  photoPreviewBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPreviewImg: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  btnRemovePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removePhotoText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
