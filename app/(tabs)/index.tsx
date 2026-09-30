// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredPlaces,
    places,
    isFavorite,
    toggleFavorite,
  } = usePlaces();

  const featuredPlaces = places.filter((p: Place) => p.isFeatured);

  const goToDetail = (id: string) => {
    router.push({
      pathname: '/PlaceDetail',
      params: { placeId: id },
    } as any);
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isSelected && { backgroundColor: item.color, borderColor: item.color },
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={isSelected ? '#fff' : item.color}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeaturedItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      activeOpacity={0.9}
      onPress={() => goToDetail(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
        <Ionicons
          name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite(item.id) ? '#EF4444' : '#fff'}
        />
      </TouchableOpacity>
      <View style={styles.featuredContent}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.featuredRow}>
          <Ionicons name="location-outline" size={14} color="#E5E7EB" />
          <Text style={styles.featuredLocation} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPlaceCard = (item: Place) => (
    <TouchableOpacity
      key={item.id}
      style={styles.placeCard}
      activeOpacity={0.85}
      onPress={() => goToDetail(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.placeCardImage} />
      <View style={styles.placeCardInfo}>
        <View style={styles.placeCardHeader}>
          <Text style={styles.placeCategoryTag}>{item.category.toUpperCase()}</Text>
          <View style={styles.ratingBox}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={
                  item.rating >= star
                    ? 'star'
                    : item.rating >= star - 0.5
                    ? 'star-half'
                    : 'star-outline'
                }
                size={13}
                color="#F59E0B"
              />
            ))}
            <Text style={styles.ratingText}>
              {item.ratingCount > 0 ? `${item.rating.toFixed(1)} (${item.ratingCount})` : '0.0'}
            </Text>
          </View>
        </View>
        <Text style={styles.placeCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.placeCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.placeCardFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Ionicons
              name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite(item.id) ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO BANNER */}
        <ImageBackground
          source={{
            uri: 'https://www.plataforma10.com.ar/viajes/wp-content/uploads/2025/01/san-juan-arreglada-2048x667.jpg',
          }}
          style={styles.heroBanner}
          imageStyle={styles.heroBannerImage}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroTopRow}>
              <View style={styles.sanjuanTag}>
                <Ionicons name="sunny" size={14} color="#F59E0B" />
                <Text style={styles.sanjuanTagText}>SAN JUAN, ARGENTINA</Text>
              </View>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>
                  {user?.role === 'turista' ? '✈️ Turista' : '🏡 Sanjuanino'}
                </Text>
              </View>
            </View>

            <View style={styles.heroTexts}>
              <Text style={styles.heroGreeting}>
                ¡Hola, {user?.name?.split(' ')[0] || 'Explorador'}!
              </Text>
              <Text style={styles.heroTitle}>Tierra del Sol y del Buen Vino</Text>
              <Text style={styles.heroSubtitle}>
                Descubre monumentos, bodegas, diques y cultura viva
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* CONTENIDO PRINCIPAL */}
        <View style={styles.bodyContent}>
          {/* Buscador */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar teatros, museos, diques, bodegas..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categorías */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Imperdibles */}
          {!searchQuery && selectedCategory === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Imperdibles de San Juan</Text>
                <Text style={styles.seeAllText}>Top Valorados</Text>
              </View>
              <FlatList
                data={featuredPlaces}
                renderItem={renderFeaturedItem}
                keyExtractor={(item: Place) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
              />
            </View>
          )}

          {/* Listado principal (sin FlatList anidada para evitar warnings) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'Destinos Turísticos' : 'Resultados'}
              </Text>
            </View>
            {filteredPlaces.length === 0 ? (
              <Text style={styles.emptyText}>No se encontraron lugares.</Text>
            ) : (
              filteredPlaces.map((item: Place) => renderPlaceCard(item))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 24 },

  // Hero
  heroBanner: { width: '100%', height: 220 },
  heroBannerImage: { resizeMode: 'cover' },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sanjuanTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sanjuanTagText: { fontSize: 10, fontWeight: 'bold', color: '#111827', marginLeft: 4 },
  roleChip: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleChipText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  heroTexts: { marginBottom: 8 },
  heroGreeting: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  heroTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: 2 },
  heroSubtitle: { fontSize: 12, color: '#D1D5DB', marginTop: 4 },

  // Body
  bodyContent: {
    marginTop: -20,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Buscador
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  // Secciones
  section: { marginTop: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  seeAllText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 12 },

  // Categorías
  categoriesList: { paddingRight: 16 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  categoryChipTextActive: { color: '#fff' },

  // Destacados
  featuredList: { paddingRight: 16 },
  featuredCard: {
    width: 260,
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#111827',
  },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  featuredTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  featuredRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  featuredLocation: { fontSize: 12, color: '#E5E7EB', marginLeft: 4, flex: 1 },

  // Tarjetas de lugares
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  placeCardImage: { width: '100%', height: 160 },
  placeCardInfo: { padding: 12 },
  placeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeCategoryTag: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5' },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
  placeCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  placeCardDescription: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  placeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  locationText: { fontSize: 12, color: '#6B7280', marginLeft: 4, flex: 1 },
});
