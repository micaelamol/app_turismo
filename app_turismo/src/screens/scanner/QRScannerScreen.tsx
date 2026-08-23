import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
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
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScanCode = (qrCodeId: string) => {
    const place = getPlaceByQR(qrCodeId);
    if (place) {
      setLastScanned(place.title);
      markAsVisited(place.id);
      Alert.alert(
        '🎯 ¡Tótem Escaneado con Éxito!',
        `Has desbloqueado la información en vivo de: ${place.title}`,
        [
          {
            text: 'Ver Ficha del Sitio',
            onPress: () => navigation.navigate('PlaceDetail', { placeId: place.id }),
          },
          { text: 'Seguir Escaneando', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Código no reconocido', 'Este QR no corresponde a un punto turístico registrado.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escáner de Tótems QR</Text>
        <Text style={styles.subtitle}>Apunta a la placa o código QR de cualquier monumento</Text>
      </View>

      {/* Visor de Cámara Simulado / Real */}
      <View style={styles.cameraBox}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Ionicons name="qr-code-outline" size={100} color="rgba(255,255,255,0.3)" />

          <View style={styles.laserLine} />
        </View>
        <Text style={styles.scanInstruction}>Coloca el código QR dentro del marco</Text>
      </View>

      {/* Simulador de Escaneo Rápido para Pruebas en Vivo */}
      <View style={styles.simulatorSection}>
        <View style={styles.simulatorHeader}>
          <Ionicons name="flash-outline" size={16} color="#4F46E5" />
          <Text style={styles.simulatorTitle}>Tótems y Placas disponibles para probar:</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.simScroll}>
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.qrItemButton}
              onPress={() => handleScanCode(place.qrCodeId)}
            >
              <Ionicons name="qr-code" size={18} color="#4F46E5" />
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
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  cameraBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#4F46E5',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scanInstruction: {
    color: '#E5E7EB',
    fontSize: 13,
    marginTop: 20,
  },
  simulatorSection: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    color: '#E5E7EB',
  },
  simScroll: {
    flexDirection: 'row',
  },
  qrItemButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  qrItemText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  qrItemCode: {
    color: '#9CA3AF',
    fontSize: 10,
  },
});
