// app/(tabs)/perfil.tsx
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
import { useAuth } from '../../src/context/AuthContext';
import { usePlaces } from '../../src/context/PlacesContext';
import { Place } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const { places, favorites, visitedPlaces, toggleFavorite } = usePlaces();
  const [activeTab, setActiveTab] = useState<'favorites' | 'visited'>('favorites');

  const favoritePlaces = places.filter((p: Place) => favorites.includes(p.id));
  const visitedPlacesList = places.filter((p: Place) => visitedPlaces.includes(p.id));

  const currentList = activeTab === 'favorites' ? favoritePlaces : visitedPlacesList;

  const renderItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.itemCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/PlaceDetail',
          params: { placeId: item.id },
        } as any)
      }
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text style={styles.itemCategory}>{item.category.toUpperCase()}</Text>
          {activeTab === 'visited' && (
            <View
              style={{
                backgroundColor: '#D1FAE5',
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
              }}
            >
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
      <TouchableOpacity style={styles.btnHeart} onPress={() => toggleFavorite(item.id)}>
        <Ionicons
          name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
          size={22}
          color={favorites.includes(item.id) ? '#EF4444' : '#9CA3AF'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Perfil del Usuario */}
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <Image
            source={{
              uri:
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            }}
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
            <Text
              style={[styles.miniSwitchText, user?.role === 'turista' && styles.miniSwitchTextActive]}
            >
              Turista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniSwitch, user?.role === 'habitante' && styles.miniSwitchActive]}
            onPress={() => switchRole('habitante')}
          >
            <Text
              style={[
                styles.miniSwitchText,
                user?.role === 'habitante' && styles.miniSwitchTextActive,
              ]}
            >
              Habitante
            </Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas */}
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

      {/* Pestañas */}
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

      {/* Listado   */}
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={(item: Place) => item.id}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280' },
  roleTag: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleTagText: { fontSize: 11, fontWeight: 'bold', color: '#4F46E5' },
  logoutBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 12 },
  roleSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  switchLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginLeft: 4 },
  miniSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  miniSwitchActive: { backgroundColor: '#4F46E5' },
  miniSwitchText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  miniSwitchTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: '#4F46E5' },
  tabButtonText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabButtonTextActive: { color: '#4F46E5', fontWeight: 'bold' },
  list: { padding: 16 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#E5E7EB' },
  itemInfo: { flex: 1, paddingHorizontal: 12 },
  itemCategory: { fontSize: 9, fontWeight: 'bold', color: '#4F46E5' },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  itemAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  btnHeart: { padding: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
});