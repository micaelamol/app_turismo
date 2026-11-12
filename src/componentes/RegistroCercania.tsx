// src/componentes/RegistroCercania.tsx
// PRD §4: registrar una visita "estando físicamente cerca", con nota corta.
// La lista llega ordenada por distancia desde PlacesContext.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LugarCercano, PermisoUbicacion } from '../context/PlacesContext';
import { formatearDistancia } from '../utils/geo';
import FotoLugar from './FotoLugar';

const LARGO_MAXIMO_NOTA = 140;

type Props = {
  visible: boolean;
  onClose: () => void;
  lugares: LugarCercano[];
  permiso: PermisoUbicacion;
  cargandoUbicacion: boolean;
  onPedirUbicacion: () => Promise<unknown>;
  onRegistrar: (lugarId: string, nota: string | null) => Promise<void>;
};

export default function RegistroCercania({
  visible,
  onClose,
  lugares,
  permiso,
  cargandoUbicacion,
  onPedirUbicacion,
  onRegistrar,
}: Props) {
  const [seleccionado, setSeleccionado] = useState<LugarCercano | null>(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const pedidoHecho = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setSeleccionado(null);
    setNota('');
    setGuardando(false);
    pedidoHecho.current = false;
  }, [visible]);

  // Pedimos la ubicación una sola vez por apertura.
  useEffect(() => {
    if (!visible || pedidoHecho.current) return;
    if (lugares.length > 0 || permiso === 'denegado') return;
    pedidoHecho.current = true;
    onPedirUbicacion();
  }, [visible, lugares.length, permiso, onPedirUbicacion]);

  const confirmar = async (conNota: boolean) => {
    if (!seleccionado || guardando) return;
    setGuardando(true);
    try {
      await onRegistrar(seleccionado.lugar.id, conNota ? nota : null);
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const renderLista = () => {
    if (cargandoUbicacion) {
      return (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.textoCentro}>Buscando tu ubicación…</Text>
        </View>
      );
    }

    if (permiso === 'denegado') {
      return (
        <View style={styles.centro}>
          <Ionicons name="location-outline" size={44} color="#9CA3AF" />
          <Text style={styles.textoCentro}>
            Sin permiso de ubicación no podemos calcular qué tenés cerca.
          </Text>
          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={() => {
              pedidoHecho.current = true;
              onPedirUbicacion();
            }}
          >
            <Text style={styles.botonPrimarioTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (lugares.length === 0) {
      return (
        <View style={styles.centro}>
          <Ionicons name="map-outline" size={44} color="#9CA3AF" />
          <Text style={styles.textoCentro}>
            Todavía no tenemos tu ubicación. Tocá el botón para calcular las distancias.
          </Text>
          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={() => {
              pedidoHecho.current = true;
              onPedirUbicacion();
            }}
          >
            <Text style={styles.botonPrimarioTexto}>Usar mi ubicación</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={lugares}
        keyExtractor={(item) => item.lugar.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => {
              setSeleccionado(item);
              setNota('');
            }}
          >
            <FotoLugar
              uri={item.lugar.imageUrl}
              categoriaId={item.lugar.category}
              style={styles.thumb}
              iconSize={22}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitulo} numberOfLines={1}>
                {item.lugar.title}
              </Text>
              <Text style={styles.itemDireccion} numberOfLines={1}>
                {item.lugar.address}
              </Text>
            </View>
            <View style={styles.distancia}>
              <Ionicons name="walk-outline" size={13} color="#4F46E5" />
              <Text style={styles.distanciaTexto}>{formatearDistancia(item.distancia)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderNota = () => {
    if (!seleccionado) return null;
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.notaContenedor}>
          <TouchableOpacity
            style={styles.volver}
            onPress={() => setSeleccionado(null)}
            accessibilityRole="button"
            accessibilityLabel="Volver a la lista de lugares cercanos"
          >
            <Ionicons name="arrow-back" size={18} color="#4F46E5" />
            <Text style={styles.volverTexto}>Volver</Text>
          </TouchableOpacity>

          <FotoLugar
            uri={seleccionado.lugar.imageUrl}
            categoriaId={seleccionado.lugar.category}
            style={styles.notaImagen}
            iconSize={40}
            mostrarEtiqueta
          />

          <Text style={styles.notaTitulo}>¡Llegaste a {seleccionado.lugar.title}!</Text>
          <Text style={styles.notaSubtitulo}>
            Estás a {formatearDistancia(seleccionado.distancia)}. Contanos cómo fue la visita.
          </Text>

          <Text style={styles.etiqueta}>Nota corta (opcional)</Text>
          <TextInput
            style={styles.input}
            value={nota}
            onChangeText={setNota}
            placeholder="Ej: Hacía 38 grados pero valió la pena"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={LARGO_MAXIMO_NOTA}
            textAlignVertical="top"
          />
          <Text style={styles.contador}>
            {nota.length}/{LARGO_MAXIMO_NOTA}
          </Text>

          <TouchableOpacity
            style={[styles.botonPrimario, guardando && styles.botonDeshabilitado]}
            onPress={() => confirmar(true)}
            disabled={guardando}
            activeOpacity={0.85}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.botonPrimarioTexto}>Registrar visita</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => confirmar(false)}
            disabled={guardando}
            activeOpacity={0.85}
          >
            <Text style={styles.botonSecundarioTexto}>Registrar sin nota</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>
              {seleccionado ? 'Tu visita' : 'Lo que tenés cerca'}
            </Text>
            <Text style={styles.subtitulo}>
              {seleccionado
                ? 'La nota queda guardada en tu recorrido.'
                : 'Ordenado por distancia real desde tu ubicación.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cerrar}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {seleccionado ? renderNota() : renderLista()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: '#fff' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  subtitulo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 12,
  },
  textoCentro: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E5E7EB' },
  itemInfo: { flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemDireccion: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  distancia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanciaTexto: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  notaContenedor: { flex: 1, padding: 20, gap: 8 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  volverTexto: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  notaImagen: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  notaTitulo: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  notaSubtitulo: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 96,
  },
  contador: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  botonPrimarioTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  botonDeshabilitado: { backgroundColor: '#A5B4FC' },
  botonSecundario: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  botonSecundarioTexto: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
});
