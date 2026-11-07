// app/(tabs)/agenda.tsx
import { Ionicons } from '@react-native-vector-icons/ionicons'; // Requisito estricto de la cátedra
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaces } from '../../src/context/PlacesContext';
import { CityEvent } from '../../src/tipos';

export default function EventsScreen() {
  const { events, eventReminders, toggleEventReminder } = usePlaces();
  const [selectedFilter] = useState('all');

  const filteredEvents =
    selectedFilter === 'all'
      ? events
      : events.filter((e: CityEvent) => e.category === selectedFilter);

  const handleToggleReminder = (event: CityEvent) => {
    const isNowReminded = toggleEventReminder(event.id);
    if (isNowReminded) {
      Alert.alert(
        '🔔 ¡Recordatorio Activado!',
        `Te avisaremos con anticipación antes de: ${event.title || event.titulo}.`
      );
    } else {
      Alert.alert('Recordatorio desactivado', `Ya no recibirás alertas de ${event.title || event.titulo}.`);
    }
  };

  const renderEventCard = ({ item }: { item: CityEvent }) => {
    const isReminded = eventReminders.includes(item.id);

    // Mapeo adaptativo por si los campos vienen desde la API en español o inglés
    const titulo = item.title || item.titulo || '';
    const descripcion = item.description || item.descripcion || '';
    const direccion = item.location || item.direccionLibre || 'Colón, Entre Ríos';
    const imagen = item.imageUrl || item.imagenUrl || null;

    // Precio: null = no se muestra la etiqueta, 0 = Gratis
    let precio: string | null = null;
    if (item.price !== undefined && item.price !== null) {
      precio = String(item.price);
    } else if (item.precio === 0) {
      precio = 'Gratis';
    } else if (item.precio !== null && item.precio !== undefined) {
      precio = `$${item.precio}`;
    }

    // Fechas ISO 8601 del backend
    const fechaTexto =
      item.date ||
      (item.inicio
        ? new Date(item.inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
        : null);
    const horaTexto =
      item.time ||
      (item.inicio
        ? new Date(item.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        : null);

    return (
      <View style={styles.eventCard}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
            <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
          </View>
        )}
        {precio && (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{precio}</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.eventTitle}>{titulo}</Text>

          {fechaTexto && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#4F46E5" />
              <Text style={styles.metaText}>{fechaTexto}</Text>
            </View>
          )}

          {horaTexto && (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#4F46E5" />
              <Text style={styles.metaText}>{horaTexto} hs</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#4F46E5" />
            <Text style={styles.metaText} numberOfLines={1}>
              {direccion}
            </Text>
          </View>

          <Text style={styles.eventDescription}>{descripcion}</Text>

          <TouchableOpacity
            style={[styles.remindButton, isReminded && styles.remindButtonActive]}
            onPress={() => handleToggleReminder(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isReminded ? 'notifications' : 'notifications-outline'}
              size={16}
              color={isReminded ? '#fff' : '#4F46E5'}
            />
            <Text style={[styles.remindText, isReminded && styles.remindTextActive]}>
              {isReminded ? '✓ Recordatorio Activado' : 'Recordarme este evento'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos & Actividades</Text>
        <Text style={styles.subtitle}>Descubre qué está pasando en Colón</Text>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item: CityEvent) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay eventos programados por el momento.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 16,
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
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 24,
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
  eventImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
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
  remindButtonActive: {
    backgroundColor: '#10B981',
  },
  remindTextActive: {
    color: '#fff',
  },
});


// import { Ionicons } from '@expo/vector-icons';
// import React, { useState } from 'react';
// import {
//   Alert,
//   FlatList,
//   Image,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { usePlaces } from '../../src/context/PlacesContext';
// import { CityEvent } from '../../src/types';

// export default function EventsScreen() {
//   const { events, eventReminders, toggleEventReminder } = usePlaces();
//   const [selectedFilter, setSelectedFilter] = useState('all');

//   const filteredEvents =
//     selectedFilter === 'all'
//       ? events
//       : events.filter((e: CityEvent) => e.category === selectedFilter);

//   const handleToggleReminder = (event: CityEvent) => {
//     const isNowReminded = toggleEventReminder(event.id);
//     if (isNowReminded) {
//       Alert.alert(
//         '🔔 ¡Recordatorio Activado!',
//         `Te avisaremos con anticipación antes de: ${event.title} (${event.date} a las ${event.time}).`
//       );
//     } else {
//       Alert.alert('Recordatorio desactivado', `Ya no recibirás alertas de ${event.title}.`);
//     }
//   };

//   const renderEventCard = ({ item }: { item: CityEvent }) => {
//     const isReminded = eventReminders.includes(item.id);
//     return (
//       <View style={styles.eventCard}>
//         <Image source={{ uri: item.imageUrl }} style={styles.eventImage} />
//         <View style={styles.priceTag}>
//           <Text style={styles.priceText}>{item.price}</Text>
//         </View>

//         <View style={styles.cardContent}>
//           <Text style={styles.eventTitle}>{item.title}</Text>

//           <View style={styles.metaRow}>
//             <Ionicons name="calendar-outline" size={14} color="#4F46E5" />
//             <Text style={styles.metaText}>{item.date}</Text>
//           </View>

//           <View style={styles.metaRow}>
//             <Ionicons name="time-outline" size={14} color="#4F46E5" />
//             <Text style={styles.metaText}>{item.time}</Text>
//           </View>

//           <View style={styles.metaRow}>
//             <Ionicons name="location-outline" size={14} color="#4F46E5" />
//             <Text style={styles.metaText} numberOfLines={1}>
//               {item.location}
//             </Text>
//           </View>

//           <Text style={styles.eventDescription}>{item.description}</Text>

//           <TouchableOpacity
//             style={[styles.remindButton, isReminded && styles.remindButtonActive]}
//             onPress={() => handleToggleReminder(item)}
//             activeOpacity={0.8}
//           >
//             <Ionicons
//               name={isReminded ? 'notifications' : 'notifications-outline'}
//               size={16}
//               color={isReminded ? '#fff' : '#4F46E5'}
//             />
//             <Text style={[styles.remindText, isReminded && styles.remindTextActive]}>
//               {isReminded ? '✓ Recordatorio Activado' : 'Recordarme este evento'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Eventos & Actividades</Text>
//         <Text style={styles.subtitle}>Descubre qué está pasando en la ciudad hoy</Text>
//       </View>

//       <FlatList
//         data={filteredEvents}
//         renderItem={renderEventCard}
//         keyExtractor={(item: CityEvent) => item.id}
//         contentContainerStyle={styles.list}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   header: {
//     padding: 16,
//     paddingTop: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#111827',
//   },
//   subtitle: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginTop: 2,
//   },
//   list: {
//     padding: 16,
//     gap: 16,
//   },
//   eventCard: {
//     backgroundColor: '#fff',
//     borderRadius: 18,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//     position: 'relative',
//   },
//   eventImage: {
//     width: '100%',
//     height: 140,
//   },
//   priceTag: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: '#10B981',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   priceText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: 'bold',
//   },
//   cardContent: {
//     padding: 16,
//   },
//   eventTitle: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#111827',
//     marginBottom: 8,
//   },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 4,
//   },
//   metaText: {
//     fontSize: 12,
//     color: '#4B5563',
//   },
//   eventDescription: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginTop: 8,
//     lineHeight: 18,
//   },
//   remindButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 6,
//     paddingVertical: 10,
//     borderRadius: 10,
//     backgroundColor: '#EEF2FF',
//     marginTop: 14,
//   },
//   remindText: {
//     fontSize: 13,
//     fontWeight: 'bold',
//     color: '#4F46E5',
//   },
//   remindButtonActive: {
//     backgroundColor: '#10B981',
//   },
//   remindTextActive: {
//     color: '#fff',
//   },
// });