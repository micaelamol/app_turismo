import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePlaces } from '../../context/PlacesContext';

interface Props {
  navigation: any;
}

export const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { places, getPlaceByQR, markAsVisited } = usePlaces();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(true);

  const handleScanCode = (scannedData: string) => {
    if (!isScanningActive) return;
    setIsScanningActive(false);

    // Intentar buscar el lugar por código directo o coincidencia de ID
    const cleanCode = scannedData.trim();
    const place = getPlaceByQR(cleanCode);

    if (place) {
      markAsVisited(place.id);
      Alert.alert(
        '🎯 ¡Tótem Escaneado con Éxito!',
        `Has desbloqueado la información en vivo de: ${place.title}`,
        [
          {
            text: 'Ver Ficha del Sitio',
            onPress: () => {
              setIsScanningActive(true);
              navigation.navigate('PlaceDetail', { placeId: place.id });
            },
          },
          {
            text: 'Seguir Escaneando',
            style: 'cancel',
            onPress: () => setIsScanningActive(true),
          },
        ]
      );
    } else {
      Alert.alert(
        'Código no reconocido',
        `El código escaneado ("${cleanCode}") no pertenece a un tótem turístico registrado.`,
        [{ text: 'Aceptar', onPress: () => setIsScanningActive(true) }]
      );
    }
  };

  const isCameraAvailable = Platform.OS !== 'web' || !!permission?.granted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escáner de Tótems QR</Text>
        <Text style={styles.subtitle}>Apunta a la placa o código QR de cualquier monumento</Text>
      </View>

      {/* Visor de Cámara Real */}
      <View style={styles.cameraBox}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={isScanningActive ? ({ data }) => handleScanCode(data) : undefined}
          />
        ) : (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={54} color="#6366F1" style={{ marginBottom: 12 }} />
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionText}>
              Para escanear placas y tótems turísticos en vivo, permite el acceso a la cámara.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.permissionBtnText}>Habilitar Cámara</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Marco de Escaneo con esquinas brillantes */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Ionicons
            name="qr-code-outline"
            size={80}
            color={permission?.granted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}
          />

          {isScanningActive && <View style={styles.laserLine} />}
        </View>

        <Text style={styles.scanInstruction}>
          {permission?.granted
            ? 'Enfoca el código QR dentro del recuadro'
            : 'O prueba seleccionando un tótem abajo'}
        </Text>
      </View>

      {/* Simulador y Acceso Rápido de Tótems (para pruebas sin salir a la calle) */}
      <View style={styles.simulatorSection}>
        <View style={styles.simulatorHeader}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <Text style={styles.simulatorTitle}>Tótems disponibles para probar en vivo:</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.simScroll}>
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.qrItemButton}
              onPress={() => handleScanCode(place.qrCodeId)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={18} color="#818CF8" />
              <Text style={styles.qrItemText} numberOfLines={1}>
                {place.title.split(' ')[0]}
              </Text>
              <Text style={styles.qrItemCode}>{place.qrCodeId}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 18,
    paddingTop: 24,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  cameraBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  permissionBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1E293B',
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scanFrame: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#6366F1',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  laserLine: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  scanInstruction: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 24,
    fontWeight: '500',
  },
  simulatorSection: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  simulatorTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  simScroll: {
    flexDirection: 'row',
  },
  qrItemButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  qrItemText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  qrItemCode: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
});
