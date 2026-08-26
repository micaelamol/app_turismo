import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usePlaces } from '../../context/PlacesContext';
import { Place } from '../../types';

interface Props {
  navigation: any;
}

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, switchRole } = useAuth();
  const { places, favorites, visitedPlaces, toggleFavorite } = usePlaces();
  const [activeTab, setActiveTab] = useState<'favorites' | 'visited'>('favorites');

  const favoritePlaces = places.filter((p) => favorites.includes(p.id));
  const visitedPlacesList = places.filter((p) => visitedPlaces.includes(p.id));

  const currentList = activeTab === 'favorites' ? favoritePlaces : visitedPlacesList;

  const renderItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.itemCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={styles.itemCategory}>{item.category.toUpperCase()}</Text>
          {activeTab === 'visited' && (
            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: '#065F46', fontWeight: 'bold' }}>✓ VISITADO</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.btnHeart}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons
          name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
          size={22}
          color={favorites.includes(item.id) ? '#EF4444' : '#9CA3AF'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Perfil del Usuario */}
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <Image
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Explorador'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'turista@miciudad.com'}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {user?.role === 'turista' ? '✈️ Modo Turista' : '🏡 Modo Habitante'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Cambiador rápido de perfil */}
        <View style={styles.roleSwitchRow}>
          <Text style={styles.switchLabel}>Cambiar Modo:</Text>
          <TouchableOpacity
            style={[styles.miniSwitch, user?.role === 'turista' && styles.miniSwitchActive]}
            onPress={() => switchRole('turista')}
          >
            <Text style={[styles.miniSwitchText, user?.role === 'turista' && styles.miniSwitchTextActive]}>
              Turista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniSwitch, user?.role === 'habitante' && styles.miniSwitchActive]}
            onPress={() => switchRole('habitante')}
          >
            <Text style={[styles.miniSwitchText, user?.role === 'habitante' && styles.miniSwitchTextActive]}>
              Habitante
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjetas de Estadísticas */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Guardados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{visitedPlaces.length}</Text>
            <Text style={styles.statLabel}>Visitados</Text>
          </View>
        </View>
      </View>

      {/* Selector de Pestañas (Favoritos / Visitados) */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'favorites' && styles.tabButtonActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeTab === 'favorites' ? '#4F46E5' : '#6B7280'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'favorites' && styles.tabButtonTextActive]}
          >
            Mis Favoritos ({favoritePlaces.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'visited' && styles.tabButtonActive]}
          onPress={() => setActiveTab('visited')}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={activeTab === 'visited' ? '#4F46E5' : '#6B7280'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'visited' && styles.tabButtonTextActive]}
          >
            Bitácora de Visitas ({visitedPlacesList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listado */}
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'favorites' ? 'heart-dislike-outline' : 'map-outline'}
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'favorites'
                ? 'No tienes lugares favoritos aún'
                : 'Aún no has marcado sitios visitados'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              Explora la ciudad y guarda los rincones que más te gusten.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleTag: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  roleSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  miniSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniSwitchActive: {
    backgroundColor: '#4F46E5',
  },
  miniSwitchText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  miniSwitchTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tabHeader: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#4F46E5',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  btnHeart: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});
