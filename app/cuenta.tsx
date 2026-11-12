// app/cuenta.tsx
// Datos de la cuenta (PRD, tabla Usuario): nombre y foto de perfil.
// El email no se cambia desde la app: el back no lo permite en PATCH /yo.
import { Ionicons } from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { subirArchivo } from '../src/servicios/archivos';
import { actualizarCuenta } from '../src/servicios/cuenta';

const LARGO_MAXIMO_NOMBRE = 100;

export default function CuentaScreen() {
  const router = useRouter();
  const { user, actualizarUsuario } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  if (!user) {
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
          <Text style={styles.headerTitle}>Mi cuenta</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.vacio}>
          <Ionicons name="person-outline" size={40} color="#9CA3AF" />
          <Text style={styles.vacioTexto}>Entrá a tu cuenta para ver estos datos.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Elige una foto del teléfono, la sube a /archivos y guarda la URL en /yo.
  const cambiarFoto = async (desdeCamara: boolean) => {
    try {
      const permiso = desdeCamara
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Sin permiso',
          desdeCamara
            ? 'Para sacar la foto necesitamos usar la cámara.'
            : 'Para elegir la foto necesitamos entrar a tus imágenes.'
        );
        return;
      }

      const resultado = desdeCamara
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      if (resultado.canceled || !resultado.assets?.[0]?.uri) return;

      setSubiendoFoto(true);
      const url = await subirArchivo(resultado.assets[0].uri);
      setAvatarUrl(url);

      // La foto se guarda en el acto; el nombre queda para el botón Guardar.
      const actualizado = await actualizarCuenta({ avatarUrl: url });
      await actualizarUsuario(actualizado);
    } catch (error: any) {
      const sinRed = !error?.response;
      Alert.alert(
        'No pudimos cambiar la foto',
        sinRed
          ? 'No hay conexión. Probá de nuevo cuando tengas señal.'
          : 'Probá de nuevo en un rato.'
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  const elegirFoto = () => {
    Alert.alert('Foto de perfil', '¿De dónde la sacamos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: () => cambiarFoto(true) },
      { text: 'Mis imágenes', onPress: () => cambiarFoto(false) },
      ...(avatarUrl
        ? [
            {
              text: 'Sacar la foto',
              style: 'destructive' as const,
              onPress: () => quitarFoto(),
            },
          ]
        : []),
    ]);
  };

  const quitarFoto = async () => {
    setSubiendoFoto(true);
    try {
      const actualizado = await actualizarCuenta({ avatarUrl: null });
      setAvatarUrl(null);
      await actualizarUsuario(actualizado);
    } catch {
      Alert.alert('No pudimos sacar la foto', 'Probá de nuevo cuando tengas señal.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio) {
      Alert.alert('Falta el nombre', 'Escribí cómo querés que te llamemos.');
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarCuenta({ nombre: limpio });
      await actualizarUsuario(actualizado);
      Alert.alert('Datos guardados', 'Ya quedaron en tu cuenta.');
      router.back();
    } catch (error: any) {
      const sinRed = !error?.response;
      Alert.alert(
        'No pudimos guardar',
        sinRed
          ? 'No hay conexión. Probá de nuevo cuando tengas señal.'
          : error?.response?.data?.error?.mensaje ?? 'Probá de nuevo en un rato.'
      );
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
        <Text style={styles.headerTitle}>Mi cuenta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.fotoBloque}>
          <TouchableOpacity
            onPress={elegirFoto}
            activeOpacity={0.8}
            accessibilityLabel="Cambiar foto de perfil"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarVacio]}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.camaraBadge}>
              {subiendoFoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.fotoHint}>Tocá la foto para cambiarla</Text>
        </View>

        <Text style={styles.sectionTitle}>Tus datos</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            placeholderTextColor="#9CA3AF"
            maxLength={LARGO_MAXIMO_NOMBRE}
            autoCapitalize="words"
            accessibilityLabel="Nombre"
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Email</Text>
          <View style={styles.soloLectura}>
            <Text style={styles.soloLecturaTexto}>{user.email}</Text>
            <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
          </View>
          <Text style={styles.rowHint}>El email no se puede cambiar desde la app.</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (guardando || subiendoFoto) && styles.saveButtonDisabled]}
          onPress={guardar}
          disabled={guardando || subiendoFoto}
        >
          <Text style={styles.saveButtonText}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
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
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  vacioTexto: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  fotoBloque: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E5E7EB',
  },
  avatarVacio: { alignItems: 'center', justifyContent: 'center' },
  camaraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F9FAFB',
  },
  fotoHint: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 20,
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
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  soloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  soloLecturaTexto: { flex: 1, fontSize: 16, color: '#6B7280' },
  rowHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
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
