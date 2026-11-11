// app/evento/[id].tsx
// Detalle de un evento de la agenda. Archivo nuevo: no modifica pantallas existentes.
// Si no hay red, cae a la copia guardada en agenda_offline.db.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { usePlaces } from '../../src/context/PlacesContext';
import { useAgendaEventos } from '../../src/hooks/useAgendaEventos';
import { eventoGuardadoAEvento, obtenerEventoGuardado } from '../../src/servicios/agendaDb';
import { obtenerEventoPorId } from '../../src/servicios/events';
import { CityEvent } from '../../src/tipos';
import {
  colorEstadoEvento,
  descripcionEvento,
  direccionEvento,
  duracionEvento,
  etiquetaEstadoEvento,
  eventoYaPaso,
  formatearFechaEvento,
  formatearHoraEvento,
  imagenEvento,
  textoPrecioEvento,
  tituloEvento,
} from '../../src/utils/eventos';

export default function EventoDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const eventoId = String(params.id ?? '');

  const { getEventById } = usePlaces();
  const { user } = useAuth();
  const usuarioId = user?.id ?? 'local';
  const { estaGuardado, tieneRecordatorio, guardarEvento, quitarEvento } = useAgendaEventos();

  const [evento, setEvento] = useState<CityEvent | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [imagenFallo, setImagenFallo] = useState<boolean>(false);

  useEffect(() => {
    let activo = true;

    const cargarEvento = async () => {
      const desdeContexto = getEventById(eventoId);
      if (desdeContexto) {
        if (activo) {
          setEvento(desdeContexto);
          setCargando(false);
        }
        return;
      }

      try {
        setCargando(true);
        setError(null);
        const respuesta = await obtenerEventoPorId(eventoId);
        if (!activo) return;

        if ('datos' in respuesta && respuesta.datos) {
          setEvento(respuesta.datos);
        } else {
          setError('No encontramos el evento que buscás.');
        }
      } catch {
        // Sin conexión: intentamos con la copia guardada para offline.
        const guardado = await obtenerEventoGuardado(eventoId, usuarioId);
        if (!activo) return;

        if (guardado) {
          setEvento(eventoGuardadoAEvento(guardado));
        } else {
          setError('No pudimos cargar el evento. Revisá tu conexión e intentá de nuevo.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarEvento();
    return () => {
      activo = false;
    };
    // getEventById se recrea en cada render del contexto: lo omitimos a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const abrirComoLlegar = async () => {
    if (!evento) return;

    const coordenadas = evento.coordenadas;
    const destino = coordenadas
      ? `${coordenadas.latitud},${coordenadas.longitud}`
      : encodeURIComponent(`${direccionEvento(evento)}, Colón, Entre Ríos`);

    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${destino}`
        : Platform.OS === 'android'
        ? `geo:0,0?q=${destino}`
        : `https://www.google.com/maps/search/?api=1&query=${destino}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('No pudimos abrir el mapa', 'Probá buscando el lugar manualmente en tu app de mapas.');
    }
  };

  const alternarGuardado = async () => {
    if (!evento || procesando) return;

    setProcesando(true);
    try {
      if (estaGuardado(evento.id)) {
        const resultado = await quitarEvento(evento.id);
        Alert.alert('Mi agenda', resultado.mensaje);
      } else {
        const resultado = await guardarEvento(evento);
        Alert.alert(
          !resultado.guardado
            ? 'No se pudo guardar'
            : resultado.recordatorioProgramado
            ? 'Guardado con recordatorio'
            : 'Guardado en mi agenda',
          resultado.mensaje
        );
      }
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.centeredText}>Cargando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!evento) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.centeredText}>{error ?? 'Evento no encontrado'}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Volver a la agenda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imagen = imagenEvento(evento);
  const precio = textoPrecioEvento(evento);
  const guardado = estaGuardado(evento.id);
  const conRecordatorio = tieneRecordatorio(evento.id);
  const yaPaso = eventoYaPaso(evento);
  const horaInicio = formatearHoraEvento(evento.inicio);
  const horaFin = formatearHoraEvento(evento.fin);
  const duracion = duracionEvento(evento.inicio, evento.fin ?? null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del evento</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {imagen && !imagenFallo ? (
          <Image
            source={{ uri: imagen }}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => setImagenFallo(true)}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View
              style={[styles.estadoBadge, { backgroundColor: colorEstadoEvento(evento.estado) }]}
            >
              <Text style={styles.estadoBadgeText}>{etiquetaEstadoEvento(evento.estado)}</Text>
            </View>
            {precio && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{precio}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{tituloEvento(evento)}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
            <Text style={styles.metaText}>{formatearFechaEvento(evento.inicio)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color="#4F46E5" />
            <Text style={styles.metaText}>
              {horaInicio ? `${horaInicio} hs` : 'Horario a confirmar'}
              {horaFin ? ` · hasta las ${horaFin} hs` : ''}
              {duracion ? ` · dura ${duracion}` : ''}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color="#4F46E5" />
            <Text style={styles.metaText}>{direccionEvento(evento)}</Text>
          </View>

          <Text style={styles.description}>{descripcionEvento(evento)}</Text>

          {yaPaso ? (
            <View style={styles.pastBox}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.pastText}>
                Este evento ya pasó. Se muestra como referencia y no se puede recordar.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.reminderBox,
                conRecordatorio && styles.reminderBoxActive,
                guardado && !conRecordatorio && styles.reminderBoxWarning,
              ]}
            >
              <Ionicons
                name={conRecordatorio ? 'notifications' : 'notifications-outline'}
                size={18}
                color={conRecordatorio ? '#065F46' : guardado ? '#92400E' : '#4F46E5'}
              />
              <Text
                style={[
                  styles.reminderText,
                  conRecordatorio && styles.reminderTextActive,
                  guardado && !conRecordatorio && styles.reminderTextWarning,
                ]}
              >
                {conRecordatorio
                  ? 'Recordatorio activo: te avisamos antes de que empiece el evento.'
                  : guardado
                  ? 'El evento está guardado, pero el aviso está desactivado. Activá las notificaciones desde los ajustes del teléfono.'
                  : 'Si lo guardás en tu agenda, te avisamos 1 hora antes.'}
              </Text>
            </View>
          )}

          {(!yaPaso || guardado) && (
            <TouchableOpacity
              style={[styles.primaryButton, guardado && styles.primaryButtonRemove]}
              onPress={alternarGuardado}
              disabled={procesando}
              activeOpacity={0.85}
            >
              {procesando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={guardado ? 'trash-outline' : 'add-circle-outline'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>
                    {guardado ? 'Quitar de mi agenda' : 'Guardar en mi agenda'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={abrirComoLlegar} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={18} color="#4F46E5" />
            <Text style={styles.secondaryButtonText}>Cómo llegar</Text>
          </TouchableOpacity>

          {evento.lugarId && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push(`/place/${evento.lugarId}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="business-outline" size={16} color="#6B7280" />
              <Text style={styles.linkButtonText}>Ver el lugar del evento</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centeredText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroPlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    margin: 16,
    marginTop: -24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  estadoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  priceBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    marginBottom: 14,
  },
  reminderBoxActive: {
    backgroundColor: '#ECFDF5',
  },
  reminderBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  pastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },
  pastText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: '#4F46E5',
    lineHeight: 17,
  },
  reminderTextActive: {
    color: '#065F46',
  },
  reminderTextWarning: {
    color: '#92400E',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButtonRemove: {
    backgroundColor: '#DC2626',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 13,
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  linkButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
