import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePlaces } from '../../context/PlacesContext';
import { Place } from '../../types';

interface Props {
  navigation: any;
}

export const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const { places, getPlaceByQR, markAsVisited } = usePlaces();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedPlace, setScannedPlace] = useState<Place | null>(null);

  const handleScanCode = (scannedData: string) => {
    const cleanCode = scannedData.trim();
    if (!cleanCode) return;

    const place = getPlaceByQR(cleanCode);

    if (place) {
      markAsVisited(place.id);
      setScannedPlace(place);
      setErrorMessage(null);
      setManualCode('');
    } else {
      setErrorMessage(`El código "${cleanCode}" no pertenece a un tótem turístico registrado.`);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleGoToPlace = () => {
    if (scannedPlace) {
      const placeId = scannedPlace.id;
      setScannedPlace(null);
      setIsScanningActive(true);
      navigation.navigate('PlaceDetail', { placeId });
    }
  };

  const handleCloseModal = () => {
    setScannedPlace(null);
    setIsScanningActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escáner de Tótems QR</Text>
        <Text style={styles.subtitle}>Apunta a la placa o código QR de cualquier monumento</Text>
      </View>

      {/* Visor de Cámara Real */}
      <View style={styles.cameraBox}>
        {Platform.OS !== 'web' && permission?.granted ? (
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
            <Ionicons name="qr-code" size={54} color="#6366F1" style={{ marginBottom: 12 }} />
            <Text style={styles.permissionTitle}>
              {Platform.OS === 'web' ? 'Escáner QR Interactivo' : 'Permiso de Cámara Requerido'}
            </Text>
            <Text style={styles.permissionText}>
              {Platform.OS === 'web'
                ? 'Puedes ingresar el código de un tótem o tocar cualquier punto de la lista para simular el escaneo.'
                : 'Para escanear placas turísticas en vivo con tu celular, habilita el acceso a la cámara.'}
            </Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
                <Text style={styles.permissionBtnText}>Habilitar Cámara</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Marco de Escaneo con esquinas */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Ionicons
            name="scan-outline"
            size={80}
            color="rgba(255,255,255,0.25)"
          />

          <View style={styles.laserLine} />
        </View>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      {/* Ingreso manual de código QR */}
      <View style={styles.manualInputSection}>
        <View style={styles.inputRow}>
          <Ionicons name="keypad-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Escribir código (ej: QR-SARMIENTO-01)..."
            placeholderTextColor="#64748B"
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={() => handleScanCode(manualCode)}
          />
          {manualCode.length > 0 && (
            <TouchableOpacity
              style={styles.btnValidate}
              onPress={() => handleScanCode(manualCode)}
            >
              <Text style={styles.btnValidateText}>Escanear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selector Rápido de Tótems */}
      <View style={styles.simulatorSection}>
        <View style={styles.simulatorHeader}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <Text style={styles.simulatorTitle}>Tótems y códigos listos para probar:</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.simScroll}>
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.qrItemButton}
              onPress={() => handleScanCode(place.qrCodeId)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={16} color="#818CF8" />
              <Text style={styles.qrItemText} numberOfLines={1}>
                {place.title.split(' ')[0]} {place.title.split(' ')[1] || ''}
              </Text>
              <Text style={styles.qrItemCode}>{place.qrCodeId}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🎯 MODAL INTERACTIVO DE ÉXITO AL ESCANEAR */}
      <Modal
        visible={!!scannedPlace}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="checkmark-circle" size={54} color="#10B981" />
            </View>

            <Text style={styles.modalTitle}>¡Tótem Escaneado con Éxito!</Text>
            <Text style={styles.modalSub}>Desbloqueaste la información histórica de:</Text>

            {scannedPlace && (
              <View style={styles.modalPlaceCard}>
                <Image source={{ uri: scannedPlace.imageUrl }} style={styles.modalPlaceImage} />
                <View style={styles.modalPlaceInfo}>
                  <Text style={styles.modalPlaceCategory}>{scannedPlace.category.toUpperCase()}</Text>
                  <Text style={styles.modalPlaceTitle} numberOfLines={2}>
                    {scannedPlace.title}
                  </Text>
                  <Text style={styles.modalPlaceAddress} numberOfLines={1}>
                    {scannedPlace.address}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.visitSavedBadge}>
              <Ionicons name="shield-checkmark" size={15} color="#065F46" />
              <Text style={styles.visitSavedText}>✓ Guardado en tu Bitácora de Visitas</Text>
            </View>

            <TouchableOpacity style={styles.btnModalPrimary} onPress={handleGoToPlace}>
              <Text style={styles.btnModalPrimaryText}>Ver Ficha Completa del Lugar</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnModalSecondary} onPress={handleCloseModal}>
              <Text style={styles.btnModalSecondaryText}>Seguir Escaneando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
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
    padding: 24,
    backgroundColor: '#1E293B',
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scanFrame: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#6366F1',
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
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  manualInputSection: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  btnValidate: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnValidateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  simulatorSection: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  simulatorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  simScroll: {
    flexDirection: 'row',
  },
  qrItemButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  qrItemText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  qrItemCode: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderIcon: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  modalPlaceCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalPlaceImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    marginRight: 10,
  },
  modalPlaceInfo: {
    flex: 1,
  },
  modalPlaceCategory: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 2,
  },
  modalPlaceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalPlaceAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  visitSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  visitSavedText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnModalPrimary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  btnModalPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnModalSecondary: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnModalSecondaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});

