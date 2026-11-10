// app/(tabs)/recorrido.tsx
// PRD §4 "Mi recorrido": registrar visitas por QR, por cercanía o a mano,
// con foto y nota corta; ver el recorrido completo en orden.
// PRD §8: respuesta háptica al registrar la visita.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EscanerVisita from '../../src/componentes/EscanerVisita';
import RegistroCercania from '../../src/componentes/RegistroCercania';
import { usePlaces } from '../../src/context/PlacesContext';
import { OrigenVisita, Place, Visita } from '../../src/tipos';

const ORIGEN_ETIQUETA: Record<OrigenVisita, string> = {
  qr: 'QR del cartel',
  gps: 'Cerca del lugar',
  manual: 'Manual',
};

const ORIGEN_ICONO: Record<OrigenVisita, string> = {
  qr: 'qr-code-outline',
  gps: 'navigate-outline',
  manual: 'create-outline',
};

type ItemVisita = { visita: Visita; lugar: Place | undefined };

function formatearFechaVisita(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = fecha.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} · ${hora}`;
}

async function vibrarExito(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Algunos emuladores no tienen motor háptico.
  }
}

export default function RecorridoScreen() {
  const {
    visitas,
    getPlaceById,
    getPlaceByQR,
    places,
    registrarVisita,
    actualizarNotaVisita,
    eliminarVisita,
    lugaresCercanos,
    actualizarUbicacion,
    permisoUbicacion,
    actualizandoUbicacion,
    visitasHuerfanas,
    limpiarVisitasHuerfanas,
  } = usePlaces();

  const router = useRouter();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [modo, setModo] = useState<'qr' | 'foto'>('qr');
  const [cercaniaOpen, setCercaniaOpen] = useState(false);

  const [notaModal, setNotaModal] = useState<{ visitaId: string; titulo: string } | null>(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  const items: ItemVisita[] = visitas.map((visita) => ({
    visita,
    lugar: getPlaceById(visita.lugarId),
  }));

  const lugaresVisitados = new Set(visitas.map((v) => v.lugarId)).size;
  const sinSincronizar = visitas.filter((v) => !v.sincronizada).length;

  const abrirCamara = (nuevoModo: 'qr' | 'foto') => {
    setModo(nuevoModo);
    setScannerOpen(true);
  };

  const handleFinish = async (place: Place, photoUri?: string) => {
    await registrarVisita(place.id, {
      origen: modo === 'qr' ? 'qr' : 'manual',
      fotoUri: photoUri ?? null,
    });
    await vibrarExito();
  };

  const handleRegistrarCercania = async (lugarId: string, nota: string | null) => {
    await registrarVisita(lugarId, { origen: 'gps', nota });
    await vibrarExito();

    const lugar = getPlaceById(lugarId);
    Alert.alert(
      '¡Visita registrada! 🎉',
      lugar
        ? `Guardamos tu visita a "${lugar.title}" en tu recorrido.`
        : 'Guardamos la visita en tu recorrido.'
    );
  };

  const abrirNota = (visita: Visita, lugar: Place | undefined) => {
    setNotaTexto(visita.nota ?? '');
    setNotaModal({
      visitaId: visita.id,
      titulo: lugar?.title ?? 'este lugar',
    });
  };

  const guardarNota = async () => {
    if (!notaModal || guardandoNota) return;
    setGuardandoNota(true);
    try {
      await actualizarNotaVisita(notaModal.visitaId, notaTexto);
      setNotaModal(null);
    } finally {
      setGuardandoNota(false);
    }
  };

  const confirmarBorrar = (visita: Visita, lugar: Place | undefined) => {
    Alert.alert(
      'Borrar visita',
      `¿Querés quitar la visita${lugar ? ` a "${lugar.title}"` : ''} de tu recorrido?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await eliminarVisita(visita.id);
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // Sin motor háptico.
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ItemVisita }) => {
    const { visita, lugar } = item;
    const foto = visita.fotoUri ?? lugar?.imageUrl ?? visita.lugarImagen ?? null;
    const nombre = lugar?.title ?? visita.lugarNombre ?? 'Lugar no disponible';

    return (
      <View style={styles.card}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailVacio]}>
            <Ionicons name="image-outline" size={22} color="#9CA3AF" />
          </View>
        )}

        <View style={styles.info}>
          <TouchableOpacity
            onPress={() => lugar && router.push(`/place/${lugar.id}`)}
            disabled={!lugar}
            activeOpacity={0.7}
          >
            <Text style={styles.titulo} numberOfLines={1}>
              {nombre}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fecha}>{formatearFechaVisita(visita.fechaHora)}</Text>

          {!lugar && (
            <Text style={styles.avisoLugar}>
              Este lugar ya no está publicado en el catálogo
              {visita.lugarId ? ` (${visita.lugarId})` : ''}.
            </Text>
          )}

          <View style={styles.etiquetas}>
            <View style={styles.etiquetaOrigen}>
              <Ionicons name={ORIGEN_ICONO[visita.origen] as any} size={11} color="#4F46E5" />
              <Text style={styles.etiquetaOrigenTexto}>{ORIGEN_ETIQUETA[visita.origen]}</Text>
            </View>
            {!visita.sincronizada && (
              <View style={styles.etiquetaPendiente}>
                <Ionicons name="cloud-offline-outline" size={11} color="#B45309" />
                <Text style={styles.etiquetaPendienteTexto}>Sin sincronizar</Text>
              </View>
            )}
          </View>

          {visita.nota ? (
            <View style={styles.notaCaja}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color="#6B7280" />
              <Text style={styles.notaTexto}>{visita.nota}</Text>
            </View>
          ) : null}

          <View style={styles.acciones}>
            <TouchableOpacity
              style={styles.accionBtn}
              onPress={() => abrirNota(visita, lugar)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={visita.nota ? 'create-outline' : 'add-circle-outline'}
                size={13}
                color="#4F46E5"
              />
              <Text style={styles.accionTexto}>{visita.nota ? 'Editar nota' : 'Agregar nota'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionBtn}
              onPress={() => confirmarBorrar(visita, lugar)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={13} color="#DC2626" />
              <Text style={[styles.accionTexto, { color: '#DC2626' }]}>Borrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const encabezado = (
    <View>
      <Text style={styles.heading}>Mi recorrido</Text>

      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{visitas.length}</Text>
          <Text style={styles.resumenTexto}>visitas</Text>
        </View>
        <View style={styles.resumenDivisor} />
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{lugaresVisitados}</Text>
          <Text style={styles.resumenTexto}>lugares</Text>
        </View>
        <View style={styles.resumenDivisor} />
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{sinSincronizar}</Text>
          <Text style={styles.resumenTexto}>sin subir</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cercaniaBtn}
        onPress={() => setCercaniaOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="navigate" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.cercaniaTitulo}>Registrar por cercanía</Text>
          <Text style={styles.cercaniaSub}>Usa tu GPS y ordena los lugares por distancia</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C7D2FE" />
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.qrBtn} onPress={() => abrirCamara('qr')}>
          <Ionicons name="qr-code-outline" size={20} color="#4F46E5" />
          <Text style={styles.qrBtnText}>Escanear QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoBtn} onPress={() => abrirCamara('foto')}>
          <Ionicons name="camera-outline" size={20} color="#4F46E5" />
          <Text style={styles.photoBtnText}>Sacar foto</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Escaneá el QR del cartel, registrá la visita estando cerca o sacá una foto. Podés sumar una
        nota corta a cada visita.
      </Text>

      {visitasHuerfanas.length > 0 && (
        <View style={styles.huerfanasCard}>
          <Ionicons name="alert-circle-outline" size={20} color="#B45309" />
          <View style={{ flex: 1 }}>
            <Text style={styles.huerfanasTitulo}>
              {visitasHuerfanas.length}{' '}
              {visitasHuerfanas.length === 1 ? 'visita apunta' : 'visitas apuntan'} a lugares que
              ya no están publicados
            </Text>
            <Text style={styles.huerfanasTexto}>
              Quedaron de una versión anterior del catálogo. Podés quitarlas del recorrido.
            </Text>
            <TouchableOpacity
              style={styles.huerfanasBtn}
              onPress={() => {
                Alert.alert(
                  'Quitar visitas huérfanas',
                  `Se van a borrar ${visitasHuerfanas.length} ${
                    visitasHuerfanas.length === 1 ? 'visita' : 'visitas'
                  } que apuntan a lugares que ya no existen. ¿Continuar?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Quitar',
                      style: 'destructive',
                      onPress: () => {
                        limpiarVisitasHuerfanas();
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.huerfanasBtnTexto}>Quitar esas visitas</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {visitas.length > 0 && <Text style={styles.subheading}>Visitas registradas</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.visita.id}
        renderItem={renderItem}
        ListHeaderComponent={encabezado}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="footsteps-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              Todavía no registraste ninguna visita. Cuando llegues a un lugar, marcalo y queda acá.
            </Text>
          </View>
        }
      />

      <EscanerVisita
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        getPlaceByQR={getPlaceByQR}
        places={places}
        modo={modo}
        onFinish={handleFinish}
      />

      <RegistroCercania
        visible={cercaniaOpen}
        onClose={() => setCercaniaOpen(false)}
        lugares={lugaresCercanos}
        permiso={permisoUbicacion}
        cargandoUbicacion={actualizandoUbicacion}
        onPedirUbicacion={actualizarUbicacion}
        onRegistrar={handleRegistrarCercania}
      />

      {/* Modal: nota corta de una visita (PRD §4) */}
      <Modal
        visible={!!notaModal}
        animationType="slide"
        transparent
        onRequestClose={() => setNotaModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nota de la visita</Text>
              <TouchableOpacity onPress={() => setNotaModal(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitulo}>{notaModal?.titulo}</Text>

            <TextInput
              style={styles.modalInput}
              value={notaTexto}
              onChangeText={setNotaTexto}
              placeholder="Ej: Hacía 38 grados pero valió la pena"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={140}
              textAlignVertical="top"
              autoFocus
            />
            <Text style={styles.contador}>{notaTexto.length}/140</Text>

            <View style={styles.modalAcciones}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => setNotaModal(null)}
                disabled={guardandoNota}
              >
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalGuardar, guardandoNota && styles.modalGuardarDisabled]}
                onPress={guardarNota}
                disabled={guardandoNota}
              >
                {guardandoNota ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalGuardarTexto}>Guardar nota</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  lista: { paddingHorizontal: 16, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#111827' },
  subheading: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 20, marginBottom: 4 },

  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    marginTop: 12,
  },
  resumenItem: { flex: 1, alignItems: 'center' },
  resumenNumero: { fontSize: 20, fontWeight: 'bold', color: '#4F46E5' },
  resumenTexto: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  resumenDivisor: { width: 1, height: 26, backgroundColor: '#E5E7EB' },

  cercaniaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  cercaniaTitulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cercaniaSub: { color: '#C7D2FE', fontSize: 11, marginTop: 1 },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 12,
    borderRadius: 12,
  },
  qrBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 13 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 12,
    borderRadius: 12,
  },
  photoBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 13 },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 10, marginBottom: 4, lineHeight: 17 },
  huerfanasCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  huerfanasTitulo: { fontSize: 13, fontWeight: 'bold', color: '#92400E' },
  huerfanasTexto: { fontSize: 11, color: '#B45309', marginTop: 3, lineHeight: 15 },
  huerfanasBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  huerfanasBtnTexto: { fontSize: 11, fontWeight: 'bold', color: '#92400E' },

  card: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  thumbnail: { width: 92, height: 92, backgroundColor: '#E5E7EB' },
  thumbnailVacio: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, padding: 10, justifyContent: 'center' },
  titulo: { fontSize: 15, fontWeight: '600', color: '#111827' },
  fecha: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  avisoLugar: { fontSize: 10, color: '#B45309', marginTop: 2, lineHeight: 14 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  etiquetaOrigen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  etiquetaOrigenTexto: { fontSize: 10, fontWeight: '600', color: '#4F46E5' },
  etiquetaPendiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  etiquetaPendienteTexto: { fontSize: 10, fontWeight: '600', color: '#B45309' },
  notaCaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notaTexto: { flex: 1, fontSize: 12, color: '#4B5563', fontStyle: 'italic', lineHeight: 16 },
  acciones: { flexDirection: 'row', gap: 12, marginTop: 8 },
  accionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  accionTexto: { fontSize: 11, fontWeight: '600', color: '#4F46E5' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalSubtitulo: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 96,
  },
  contador: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  modalAcciones: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  modalCancelarTexto: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' },
  modalGuardar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  modalGuardarDisabled: { backgroundColor: '#A5B4FC' },
  modalGuardarTexto: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
});
