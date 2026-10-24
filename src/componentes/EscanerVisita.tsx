import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Place } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  getPlaceByQR: (qr: string) => Place | undefined;
  places: Place[];
  onFinish: (place: Place, photoUri?: string) => void;
  modo?: 'qr' | 'foto';
};

export default function EscanerVisita({
  visible,
  onClose,
  getPlaceByQR,
  places,
  onFinish,
  modo = 'qr',
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [choosingPlace, setChoosingPlace] = useState(false);

  const reset = () => {
    setPlace(null);
    setPhotoUri(null);
    setLocked(false);
    setChoosingPlace(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleScan = ({ data }: { data: string }) => {
    if (locked) return;
    setLocked(true);

    const raw = data.trim();
    const lastSegment = raw.split('/').filter(Boolean).pop() ?? raw;
    const found = getPlaceByQR(raw) ?? getPlaceByQR(lastSegment);

    if (found) {
      setPlace(found);
    } else {
      Alert.alert('QR no reconocido', 'Este código no corresponde a ningún lugar de la app.', [
        { text: 'Reintentar', onPress: () => setLocked(false) },
        { text: 'Cerrar', onPress: close },
      ]);
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch (e) {
      Alert.alert('Error', 'No se pudo sacar la foto.');
    }
  };

  const finish = (withPhoto: boolean) => {
    if (!place) return;
    onFinish(place, withPhoto && photoUri ? photoUri : undefined);
    close();
  };

  const renderContent = () => {
    if (!permission) return <View style={styles.center} />;

    if (!permission.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryText}>Dar permiso</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Foto sacada sin lugar: elegir a qué lugar pertenece
    if (photoUri && !place && choosingPlace) {
      return (
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>¿De qué lugar es esta foto?</Text>
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setPlace(item);
                  setChoosingPlace(false);
                }}
              >
                <Text style={styles.pickerItemTitle}>{item.title}</Text>
                <Text style={styles.pickerItemSub} numberOfLines={1}>
                  {item.address}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setChoosingPlace(false);
              setPhotoUri(null);
            }}
          >
            <Text style={styles.secondaryText}>Volver a la cámara</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Foto sacada: vista previa
    if (photoUri) {
      return (
        <View style={styles.flex}>
          <Image source={{ uri: photoUri }} style={styles.flex} resizeMode="cover" />
          <View style={styles.bottomBar}>
            {place ? (
              <>
                <Text style={styles.placeName}>{place.title}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
                    <Text style={styles.secondaryText}>Repetir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => finish(true)}>
                    <Text style={styles.primaryText}>Guardar visita</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.placeName}>Foto lista</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhotoUri(null)}>
                    <Text style={styles.secondaryText}>Repetir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => setChoosingPlace(true)}
                  >
                    <Text style={styles.primaryText}>Elegir lugar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      );
    }

    // Cámara: en modo QR lee el código; en modo foto solo saca la foto
    return (
      <View style={styles.flex}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={place || modo === 'foto' ? undefined : handleScan}
        />
        <View style={styles.bottomBar}>
          {!place ? (
            <>
              <Text style={styles.text}>
                {modo === 'qr'
                  ? 'Apunta al código QR del cartel'
                  : 'Saca una foto y después elige el lugar'}
              </Text>
              <View style={styles.row}>
                {/* BOTÓN DE PRUEBA: borrar cuando termines de probar en el emulador */}
                {modo === 'qr' && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => handleScan({ data: 'p5' })}
                  >
                    <Text style={styles.secondaryText}>Simular QR (p5)</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.primaryText}>Sacar foto</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.placeName}>¡Llegaste a {place.title}!</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => finish(false)}>
                  <Text style={styles.secondaryText}>Sin foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.primaryText}>Sacar foto</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={styles.flex}>
        {visible && renderContent()}
        <TouchableOpacity style={styles.closeBtn} onPress={close}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  text: { color: '#fff', fontSize: 15, textAlign: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  placeName: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { color: '#fff', fontWeight: '600' },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#111827',
    paddingTop: 100,
    paddingHorizontal: 16,
    gap: 12,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  pickerItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  pickerItemTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pickerItemSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
});