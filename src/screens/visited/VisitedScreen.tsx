import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { usePlaces } from '../../context/PlacesContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const VisitedScreen: React.FC = () => {
  const { visitedPlaces, getPlaceById } = usePlaces();
  const navigation = useNavigation();

  const visitedData = visitedPlaces
    .map((id) => getPlaceById(id))
    .filter((place): place is any => !!place);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PlaceDetail' as any, { placeId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Historial de Lugares Visitados</Text>
      {visitedData.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Aún no has marcado ningún lugar como visitado.</Text>
        </View>
      ) : (
        <FlatList
          data={visitedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

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
