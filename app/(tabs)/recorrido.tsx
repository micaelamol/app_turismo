import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EscanerVisita from '../../src/componentes/EscanerVisita';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/types';

export default function VisitedScreen() {
  const {
    visitedPlaces,
    getPlaceById,
    getPlaceByQR,
    toggleVisited,
    visitPhotos,
    saveVisitPhoto,
    places,
  } = usePlaces();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [modo, setModo] = useState<'qr' | 'foto'>('qr');

  const visitedData: Place[] = visitedPlaces
    .map((id: string) => getPlaceById(id))
    .filter((place: Place | undefined): place is Place => !!place);

  const abrirCamara = (nuevoModo: 'qr' | 'foto') => {
    setModo(nuevoModo);
    setScannerOpen(true);
  };

  const handleFinish = async (place: Place, photoUri?: string) => {
    // toggleVisited alterna, así que solo lo llamo si todavía no estaba visitado
    if (!visitedPlaces.includes(place.id)) toggleVisited(place.id);
    if (photoUri) await saveVisitPhoto(place.id, photoUri);
  };

  const renderItem = ({ item }: { item: Place }) => {
    const photo = visitPhotos[item.id];
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/place/${item.id}`)}>
        <Image source={{ uri: photo ?? item.imageUrl }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.address}
          </Text>
          {photo && (
            <View style={styles.photoTag}>
              <Ionicons name="camera" size={12} color="#4F46E5" />
              <Text style={styles.photoTagText}>Con foto de tu visita</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Historial de Lugares Visitados</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.qrBtn} onPress={() => abrirCamara('qr')}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.qrBtnText}>Escanear QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoBtn} onPress={() => abrirCamara('foto')}>
          <Ionicons name="camera-outline" size={20} color="#4F46E5" />
          <Text style={styles.photoBtnText}>Sacar foto</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Escanea el QR del cartel para registrar tu visita, o saca una foto y elige el lugar.
      </Text>

      {visitedData.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Aún no has marcado ningún lugar como visitado.</Text>
        </View>
      ) : (
        <FlatList
          data={visitedData}
          keyExtractor={(item: Place) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <EscanerVisita
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        getPlaceByQR={getPlaceByQR}
        places={places}
        modo={modo}
        onFinish={handleFinish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#111827' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  qrBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
  },
  photoBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 14 },
  hint: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: { width: 80, height: 80 },
  info: { flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  photoTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  photoTagText: { fontSize: 11, color: '#4F46E5', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#6B7280', textAlign: 'center' },
});
