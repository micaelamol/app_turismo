import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/types';

export default function VisitedScreen() {
  const { visitedPlaces, getPlaceById } = usePlaces();
  const router = useRouter();

  const visitedData: Place[] = visitedPlaces
    .map((id: string) => getPlaceById(id))
    .filter((place: Place | undefined): place is Place => !!place);

  const renderItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/place/${item.id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Historial de Lugares Visitados</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  heading: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#111827' },
  list: { paddingBottom: 24 },
  card: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#F9FAFB', borderRadius: 8, overflow: 'hidden' },
  thumbnail: { width: 80, height: 80 },
  info: { flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#6B7280', textAlign: 'center' },
});