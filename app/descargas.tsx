// app/descargas.tsx
// "Mis descargas": lugares disponibles sin conexión + administración de espacio.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaces } from '../src/context/PlacesContext';
import { useDescargas } from '../src/hooks/useDescargas';
import {
  guardarPreferenciaSoloWifi,
  obtenerPreferenciaSoloWifi,
} from '../src/servicios/descargas';

export default function DescargasScreen() {
  const router = useRouter();
  const {
    descargas,
    cargando,
    descargandoId,
    pesoTotal,
    eliminar,
    eliminarTodo,
    formatearBytes,
  } = useDescargas();

  const [soloWifi, setSoloWifi] = useState<boolean>(true);

  const { places, catalogoActualizadoEn, catalogoOffline, actualizarCatalogo } = usePlaces();
  const [actualizandoCatalogo, setActualizandoCatalogo] = useState(false);

  useEffect(() => {
    obtenerPreferenciaSoloWifi().then(setSoloWifi);
  }, []);

  const refrescarCatalogo = async () => {
    setActualizandoCatalogo(true);
    try {
      await actualizarCatalogo();
      Alert.alert('Catálogo actualizado', 'Los lugares quedaron guardados para usar sin conexión.');
    } finally {
      setActualizandoCatalogo(false);
    }
  };

  const cambiarSoloWifi = async (valor: boolean) => {
    setSoloWifi(valor);
    await guardarPreferenciaSoloWifi(valor);
  };

  const confirmarBorrarTodo = () => {
    if (descargas.length === 0) return;

    Alert.alert(
      'Liberar espacio',
      `Se borrarán ${descargas.length} lugar(es) descargado(s) (${formatearBytes(pesoTotal)}). ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarTodo();
              Alert.alert('Listo', 'Se liberó el espacio.');
            } catch {
              Alert.alert('Error', 'No se pudo borrar.');
            }
          },
        },
      ]
    );
  };

  const confirmarBorrarUno = (id: string, nombre: string) => {
    Alert.alert('Borrar descarga', `¿Quitar "${nombre}" de tus descargas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminar(id);
          } catch {
            Alert.alert('Error', 'No se pudo borrar.');
          }
        },
      },
    ]);
  };

  const renderDescarga = ({ item }: { item: (typeof descargas)[number] }) => {
    const imagen = item.portadaLocal || item.datos.imageUrl || null;
    const nombre = item.datos.nombre || item.datos.title || 'Lugar';
    const procesando = descargandoId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/place/${item.id}`)}
      >
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {nombre}
          </Text>

          <View style={styles.cardMetaRow}>
            <View
              style={[
                styles.nivelBadge,
                item.nivel === 'completo' ? styles.nivelCompleto : styles.nivelLiviano,
              ]}
            >
              <Text style={styles.nivelBadgeText}>
                {item.nivel === 'completo' ? 'Completo' : 'Liviano'}
              </Text>
            </View>
            <Text style={styles.cardMetaText}>{formatearBytes(item.pesoBytes)}</Text>
            <Text style={styles.cardMetaText}>
              {new Date(item.descargadoEn).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.borrarBtn}
            onPress={() => confirmarBorrarUno(item.id, nombre)}
            disabled={procesando}
            activeOpacity={0.8}
          >
            {procesando ? (
              <Text style={styles.borrarBtnText}>Borrando...</Text>
            ) : (
              <>
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                <Text style={styles.borrarBtnText}>Borrar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis descargas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Resumen de espacio */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="folder-outline" size={20} color="#4F46E5" />
            <Text style={styles.summaryTitle}>Espacio usado</Text>
            <Text style={styles.summaryValue}>{formatearBytes(pesoTotal)}</Text>
          </View>
          <Text style={styles.summarySub}>
            {descargas.length} lugar(es) disponible(s) sin conexión
          </Text>
        </View>

        {/* Catálogo completo (PRD §7) */}
        <View style={styles.catalogoCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="albums-outline" size={20} color="#4F46E5" />
            <Text style={styles.summaryTitle}>Catálogo completo</Text>
            <Text style={styles.summaryValue}>{places.length} lugares</Text>
          </View>
          <Text style={styles.summarySub}>
            {catalogoActualizadoEn
              ? `Guardado el ${new Date(catalogoActualizadoEn).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}. Podés ver los lugares y tu recorrido sin conexión.`
              : 'Se guarda automáticamente al abrir la app.'}
            {catalogoOffline ? ' Ahora estás viendo la copia guardada.' : ''}
          </Text>

          <TouchableOpacity
            style={styles.actualizarBtn}
            onPress={refrescarCatalogo}
            disabled={actualizandoCatalogo}
            activeOpacity={0.85}
          >
            {actualizandoCatalogo ? (
              <Text style={styles.actualizarBtnText}>Actualizando…</Text>
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#4F46E5" />
                <Text style={styles.actualizarBtnText}>Actualizar catálogo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Preferencia Wi-Fi */}
        <View style={styles.prefCard}>
          <View style={styles.prefRow}>
            <Ionicons name="wifi-outline" size={20} color="#4F46E5" />
            <View style={styles.prefTexts}>
              <Text style={styles.prefTitle}>Solo con Wi-Fi</Text>
              <Text style={styles.prefSub}>
                Si está activo, las descargas no usan datos móviles.
              </Text>
            </View>
            <Switch
              value={soloWifi}
              onValueChange={cambiarSoloWifi}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={soloWifi ? '#4F46E5' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Lista */}
        {cargando ? (
          <Text style={styles.emptyText}>Cargando descargas...</Text>
        ) : descargas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-download-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Todavía no descargaste lugares</Text>
            <Text style={styles.emptySub}>
              Abrí la ficha de un lugar y tocá "Descargar" para verlo sin conexión.
            </Text>
          </View>
        ) : (
          <FlatList
            data={descargas}
            renderItem={renderDescarga}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        )}

        {/* Liberar espacio */}
        {descargas.length > 0 && (
          <TouchableOpacity
            style={styles.liberarBtn}
            onPress={confirmarBorrarTodo}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.liberarBtnText}>Liberar espacio</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#111827' },
  headerSpacer: { width: 36 },
  scrollContent: { paddingBottom: 32 },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#4F46E5' },
  summarySub: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  catalogoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actualizarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actualizarBtnText: { fontSize: 12, fontWeight: 'bold', color: '#4F46E5' },
  prefCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefTexts: { flex: 1 },
  prefTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  prefSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardImage: { width: 90, height: 90 },
  cardImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nivelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  nivelLiviano: { backgroundColor: '#EEF2FF' },
  nivelCompleto: { backgroundColor: '#ECFDF5' },
  nivelBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#4F46E5' },
  cardMetaText: { fontSize: 11, color: '#6B7280' },
  borrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  borrarBtnText: { fontSize: 11, fontWeight: 'bold', color: '#DC2626' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginTop: 8 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
  liberarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liberarBtnText: { fontSize: 13, fontWeight: 'bold', color: '#DC2626' },
});
