// app/preferencias.tsx
// Preferencias de la cuenta (PRD §5: la cuenta es para guardar cosas).
// Se guardan en el teléfono (kv-store) y, con sesión, también en la API.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { usePlaces } from '../src/context/PlacesContext';
import {
  actualizarPreferencias,
  aplicarTema,
  guardarPreferenciasLocales,
  leerPreferenciasLocales,
  normalizarPreferencias,
  PREFERENCIAS_INICIALES,
} from '../src/servicios/preferencias';
import { Preferencias } from '../src/tipos';

const RADIOS: Array<Preferencias['radioAvisoMetros']> = [100, 250, 500];

export default function PreferenciasScreen() {
  const router = useRouter();
  const { user, actualizarUsuario } = useAuth();
  const { categories } = usePlaces();
  const usuarioId = user?.id ?? 'local';

  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_INICIALES);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;

    (async () => {
      const iniciales = normalizarPreferencias(
        user?.preferencias ?? (await leerPreferenciasLocales(usuarioId))
      );
      if (vivo) {
        setPrefs(iniciales);
        aplicarTema(iniciales.tema);
        setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [usuarioId, user?.preferencias]);

  const alternarCategoria = (categoriaId: string) => {
    setPrefs((prev) => ({
      ...prev,
      categoriasFavoritas: prev.categoriasFavoritas.includes(categoriaId)
        ? prev.categoriasFavoritas.filter((id) => id !== categoriaId)
        : [...prev.categoriasFavoritas, categoriaId],
    }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      // Primero el teléfono: así queda aunque se corte la señal.
      await guardarPreferenciasLocales(prefs, usuarioId);
      aplicarTema(prefs.tema);

      if (user) {
        try {
          const actualizado = await actualizarPreferencias(prefs);
          await actualizarUsuario(actualizado);
        } catch {
          Alert.alert(
            'Guardado en el teléfono',
            'No pudimos avisarle a tu cuenta. Probá de nuevo cuando tengas señal.'
          );
          return;
        }
      }

      Alert.alert('Preferencias guardadas', 'Las vamos a tener en cuenta.');
      router.back();
    } finally {
      setGuardando(false);
    }
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
        <Text style={styles.headerTitle}>Preferencias</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!user && (
          <View style={styles.aviso}>
            <Ionicons name="information-circle-outline" size={18} color="#92400E" />
            <Text style={styles.avisoTexto}>
              Sin cuenta, las preferencias quedan solo en este teléfono.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Avisos</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Avisarme cuando paso cerca de un lugar</Text>
              <Text style={styles.rowHint}>Un aviso por lugar y por día.</Text>
            </View>
            <Switch
              value={prefs.avisarProximidad}
              onValueChange={(valor) => setPrefs((prev) => ({ ...prev, avisarProximidad: valor }))}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={prefs.avisarProximidad ? '#4F46E5' : '#F9FAFB'}
              accessibilityLabel="Avisarme cuando paso cerca de un lugar"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.rowTitle}>Distancia del aviso</Text>
          <View style={styles.optionsRow}>
            {RADIOS.map((radio) => {
              const activo = prefs.radioAvisoMetros === radio;
              return (
                <TouchableOpacity
                  key={radio}
                  style={[styles.option, activo && styles.optionActive]}
                  onPress={() => setPrefs((prev) => ({ ...prev, radioAvisoMetros: radio }))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                >
                  <Text style={[styles.optionText, activo && styles.optionTextActive]}>
                    {radio} m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Categorías que te interesan</Text>
        <View style={styles.card}>
          <Text style={styles.rowHint}>Las usamos para ordenar lo que te mostramos.</Text>
          <View style={styles.chips}>
            {categories.map((categoria) => {
              const activa = prefs.categoriasFavoritas.includes(categoria.id);
              return (
                <TouchableOpacity
                  key={categoria.id}
                  style={[styles.chip, activa && styles.chipActive]}
                  onPress={() => alternarCategoria(categoria.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                >
                  <Text style={[styles.chipText, activa && styles.chipTextActive]}>
                    {categoria.nombre || categoria.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (guardando || cargando) && styles.saveButtonDisabled]}
          onPress={guardar}
          disabled={guardando || cargando}
        >
          <Text style={styles.saveButtonText}>
            {guardando ? 'Guardando...' : 'Guardar preferencias'}
          </Text>
        </TouchableOpacity>
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
  scrollContent: { padding: 16, paddingBottom: 32 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avisoTexto: { flex: 1, fontSize: 13, color: '#92400E' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTexts: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowHint: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  optionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  optionActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  optionTextActive: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  chipTextActive: { color: '#4F46E5', fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
