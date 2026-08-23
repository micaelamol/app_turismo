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
import { usePlaces } from '../../context/PlacesContext';
import { CityEvent } from '../../types';

interface Props {
  navigation: any;
}

export const EventsScreen: React.FC<Props> = ({ navigation }) => {
  const { events } = usePlaces();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredEvents =
    selectedFilter === 'all' ? events : events.filter((e) => e.category === selectedFilter);

  const renderEventCard = ({ item }: { item: CityEvent }) => (
    <View style={styles.eventCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
      <View style={styles.priceTag}>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#4F46E5" />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#4F46E5" />
          <Text style={styles.metaText}>{item.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#4F46E5" />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <Text style={styles.eventDescription}>{item.description}</Text>

        <TouchableOpacity style={styles.remindButton}>
          <Ionicons name="notifications-outline" size={16} color="#4F46E5" />
          <Text style={styles.remindText}>Recordarme este evento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos & Actividades</Text>
        <Text style={styles.subtitle}>Descubre qué está pasando en la ciudad hoy</Text>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
  },
  eventDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    marginTop: 14,
  },
  remindText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
});
