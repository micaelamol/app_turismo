// app/(tabs)/agenda.tsx
import { Ionicons } from '@react-native-vector-icons/ionicons'; // Requisito estricto de la cátedra
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaces } from '../../src/context/PlacesContext';
import { useAgendaEventos } from '../../src/hooks/useAgendaEventos';
import { eventoGuardadoAEvento } from '../../src/servicios/agendaDb';
import { CityEvent } from '../../src/tipos';
import {
  claveDiaEvento,
  eventoYaPaso,
  ordenarEventosPorInicio,
  tituloDiaEvento,
} from '../../src/utils/eventos';

function ImagenEvento({ uri }: { uri: string | null }) {
  const [fallo, setFallo] = useState(false);

  if (!uri || fallo) {
    return (
      <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
        <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.eventImage}
      onError={() => setFallo(true)}
    />
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const { events, cargando, error } = usePlaces();
  const { eventosGuardados, estaGuardado, guardarEvento, quitarEvento } = useAgendaEventos();
  const [selectedFilter] = useState('all');
  const [vista, setVista] = useState<'todos' | 'guardados'>('todos');

  const eventosGuardadosComoEventos = eventosGuardados.map(eventoGuardadoAEvento);

  // Si la API no devolvió eventos (sin red o error) y hay guardados,
  // mostramos la copia local para que la agenda siga siendo usable.
  const mostrandoGuardadosPorFaltaDeRed =
    vista === 'todos' &&
    eventosGuardados.length > 0 &&
    (Boolean(error) || (!cargando && events.length === 0));

  const eventosBase =
    vista === 'guardados' || mostrandoGuardadosPorFaltaDeRed
      ? eventosGuardadosComoEventos
      : events;

  const filteredEvents =
    selectedFilter === 'all'
      ? eventosBase
      : eventosBase.filter((e: CityEvent) => e.category === selectedFilter);

  // PRD §3: "Ver los eventos por día, empezando por hoy."
  const secciones = useMemo(() => {
    const porDia = new Map<string, CityEvent[]>();

    for (const evento of ordenarEventosPorInicio(filteredEvents)) {
      const clave = claveDiaEvento(evento.inicio);
      const lista = porDia.get(clave);
      if (lista) {
        lista.push(evento);
      } else {
        porDia.set(clave, [evento]);
      }
    }

    return Array.from(porDia.entries()).map(([clave, data]) => ({
      title: tituloDiaEvento(clave),
      data,
    }));
  }, [filteredEvents]);

  const handleToggleReminder = async (event: CityEvent) => {
    if (estaGuardado(event.id)) {
      const resultado = await quitarEvento(event.id);
      Alert.alert('Mi agenda', resultado.mensaje);
      return;
    }

    const resultado = await guardarEvento(event);
    Alert.alert(
      !resultado.guardado
        ? 'No se pudo guardar'
        : resultado.recordatorioProgramado
        ? '🔔 ¡Recordatorio Activado!'
        : 'Evento guardado',
      resultado.mensaje
    );
  };

  const renderEventCard = ({ item }: { item: CityEvent }) => {
    const isReminded = estaGuardado(item.id);
    // Los eventos vencidos se siguen mostrando, pero marcados y sin recordatorio.
    const yaPaso = eventoYaPaso(item);

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
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/evento/${item.id}`)}
          accessibilityLabel={`Ver detalle de ${titulo}`}
        >
          <ImagenEvento uri={imagen} />
          {precio && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{precio}</Text>
            </View>
          )}

          {yaPaso && (
            <View style={styles.pastTag}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.pastTagText}>Ya pasó</Text>
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text style={styles.eventTitle}>{titulo}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>

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
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          {yaPaso ? (
            isReminded ? (
              <TouchableOpacity
                style={[styles.remindButton, styles.remindButtonPast]}
                onPress={() => handleToggleReminder(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#6B7280" />
                <Text style={[styles.remindText, styles.remindTextPast]}>
                  Quitar de mi agenda
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.remindButton, styles.remindButtonPast]}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={[styles.remindText, styles.remindTextPast]}>
                  Evento vencido · no se puede recordar
                </Text>
              </View>
            )
          ) : (
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
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos & Actividades</Text>
        <Text style={styles.subtitle}>Descubre qué está pasando en Colón</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, vista === 'todos' && styles.chipActive]}
            onPress={() => setVista('todos')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="albums-outline"
              size={14}
              color={vista === 'todos' ? '#fff' : '#4B5563'}
            />
            <Text style={[styles.chipText, vista === 'todos' && styles.chipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, vista === 'guardados' && styles.chipActive]}
            onPress={() => setVista('guardados')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={vista === 'guardados' ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={vista === 'guardados' ? '#fff' : '#4B5563'}
            />
            <Text style={[styles.chipText, vista === 'guardados' && styles.chipTextActive]}>
              Mis guardados ({eventosGuardados.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {mostrandoGuardadosPorFaltaDeRed && (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
          <Text style={styles.offlineNoticeText}>
            No pudimos cargar los eventos de la ciudad. Te mostramos los que guardaste.
          </Text>
        </View>
      )}

      <SectionList
        sections={secciones}
        renderItem={renderEventCard}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        keyExtractor={(item: CityEvent) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {vista === 'guardados'
              ? 'Todavía no guardaste eventos. Tocá "Recordarme" en uno para verlo acá sin conexión.'
              : 'No hay eventos programados por el momento.'}
          </Text>
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#fff',
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    paddingVertical: 2,
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
  pastTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventTitle: {
    flex: 1,
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
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  remindButtonPast: {
    backgroundColor: '#F3F4F6',
  },
  remindTextPast: {
    color: '#6B7280',
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