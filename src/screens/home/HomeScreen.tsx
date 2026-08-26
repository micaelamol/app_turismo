import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Image,
    ImageBackground,
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
import { Place } from '../../types';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
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

  const featuredPlaces = places.filter((p) => p.isFeatured);

  const renderCategoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && { backgroundColor: item.color, borderColor: item.color }]}
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
      onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
      >
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

  const renderPlaceCard = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.placeCardImage} />
      <View style={styles.placeCardInfo}>
        <View style={styles.placeCardHeader}>
          <Text style={styles.placeCategoryTag}>{item.category.toUpperCase()}</Text>
          <View style={styles.ratingBox}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={item.rating >= star ? 'star' : item.rating >= star - 0.5 ? 'star-half' : 'star-outline'}
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 🌟 HERO BANNER CON LA FOTO PANORÁMICA DE SAN JUAN */}
        <ImageBackground
          source={{ uri: 'https://www.plataforma10.com.ar/viajes/wp-content/uploads/2025/01/san-juan-arreglada-2048x667.jpg' }}
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
              <Text style={styles.heroGreeting}>¡Hola, {user?.name?.split(' ')[0] || 'Explorador'}!</Text>
              <Text style={styles.heroTitle}>Tierra del Sol y del Buen Vino</Text>
              <Text style={styles.heroSubtitle}>Descubre monumentos, bodegas, diques y cultura viva</Text>
            </View>
          </View>
        </ImageBackground>

        {/* CONTENIDO PRINCIPAL */}
        <View style={styles.bodyContent}>
          {/* Buscador flotante */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar teatros, museos, diques, bodegas..."
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
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Lugares Destacados / Imperdibles */}
          {!searchQuery && selectedCategory === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Imperdibles de San Juan</Text>
                <Text style={styles.seeAllText}>Top Valorados</Text>
              </View>
              <FlatList
                data={featuredPlaces}
                renderItem={renderFeaturedItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredList}
              />
            </View>
          )}

          {/* Listado Principal de Lugares */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'Destinos Turísticos' : `Lugares en ${selectedCategory}`}
              </Text>
              <Text style={styles.resultsCount}>{filteredPlaces.length} encontrados</Text>
            </View>

            {filteredPlaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={40} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No encontramos resultados</Text>
                <Text style={styles.emptyStateSub}>Intenta con otra palabra clave o categoría.</Text>
              </View>
            ) : (
              filteredPlaces.map((place) => (
                <React.Fragment key={place.id}>{renderPlaceCard({ item: place })}</React.Fragment>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroBanner: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroBannerImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 16,
    paddingTop: 36,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sanjuanTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sanjuanTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  roleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleChipText: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroTexts: {
    marginBottom: 8,
  },
  heroGreeting: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: '#E5E7EB',
    fontSize: 12,
    marginTop: 4,
  },
  bodyContent: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  resultsCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoriesList: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  featuredList: {
    gap: 14,
  },
  featuredCard: {
    width: 260,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1F2937',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  badge: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  featuredLocation: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  placeCardImage: {
    width: '100%',
    height: 150,
  },
  placeCardInfo: {
    padding: 14,
  },
  placeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeCategoryTag: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  placeCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  placeCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  placeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
