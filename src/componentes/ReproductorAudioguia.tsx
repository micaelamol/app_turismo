// src/componentes/ReproductorAudioguia.tsx
// PRD §6: audioguía con play/pausa, adelantar/retroceder, barra de posición,
// tiempo restante, reproducción en segundo plano y audio local si está descargado.

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatearTiempo, idiomaLegible, textoRestante } from '../servicios/audioguias';

interface Props {
  url: string;
  titulo: string;
  duracionSegundos?: number | null;
  idioma?: 'es' | 'en' | 'pt' | null;
  disponibleOffline?: boolean;
}

const SALTO_SEGUNDOS = 15;
const ESPERA_MAXIMA_MS = 8000;

function resolverUrlEnDispositivo(rawUrl: string): string {
  if (rawUrl.startsWith('file://')) return rawUrl;

  const hostLocal = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  if (rawUrl.startsWith('http')) {
    return rawUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?/, hostLocal);
  }

  return `${hostLocal}/${rawUrl.replace(/^\//, '')}`;
}

export default function ReproductorAudioguia({
  url,
  titulo,
  duracionSegundos,
  idioma,
  disponibleOffline,
}: Props) {
  const [fuenteLista, setFuenteLista] = useState<string | null>(null);
  const player = useAudioPlayer(fuenteLista, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const [anchoBarra, setAnchoBarra] = useState(0);
  const [solicitando, setSolicitando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = status.duration > 0 ? status.duration : duracionSegundos ?? 0;
  const actual = total > 0 ? Math.min(status.currentTime, total) : status.currentTime;
  const avance = total > 0 ? Math.min(1, actual / total) : 0;
  const cargando = status.isBuffering || (solicitando && !status.isLoaded);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});

    return () => {
      if (espera.current) clearTimeout(espera.current);
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const urlFinal = resolverUrlEnDispositivo(url);

    (async () => {
      try {
        if (urlFinal.startsWith('file://')) {
          if (activo) {
            setFuenteLista(urlFinal);
            player.replace(urlFinal);
          }
          return;
        }

        const carpeta = new Directory(Paths.cache, 'audioguias_tmp');
        if (!carpeta.exists) carpeta.create();

        const nombreArchivo = urlFinal.split('/').pop() || 'audio.mp3';
        const destino = new File(carpeta, nombreArchivo);

        // Si ya está descargado y no está vacío, lo usa directo (funciona sin internet)
        if (!destino.exists || destino.size === 0) {
          if (destino.exists) destino.delete();
          await File.downloadFileAsync(urlFinal, destino);
        }

        if (activo) {
          setFuenteLista(destino.uri);
          player.replace(destino.uri);
        }
      } catch (err) {
        console.error('Error cargando audioguía:', err);
        if (activo) setFallo(true);
      }
    })();

    return () => {
      activo = false;
    };
  }, [url]);

  useEffect(() => {
    if (!status.isLoaded) return;
    setFallo(false);
    setSolicitando(false);
    if (espera.current) {
      clearTimeout(espera.current);
      espera.current = null;
    }
  }, [status.isLoaded]);

  const esperarCarga = () => {
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      if (!status.isLoaded) {
        setFallo(true);
        setSolicitando(false);
      }
    }, ESPERA_MAXIMA_MS);
  };

  const alternar = () => {
    if (!fuenteLista) return;

    if (status.playing) {
      player.pause();
      return;
    }

    setFallo(false);

    if (status.didJustFinish || (total > 0 && actual >= total - 0.5)) {
      player.seekTo(0);
    }

    try {
      player.setActiveForLockScreen(true, {
        title: `Audioguía · ${titulo}`,
        artist: 'Colón Turismo',
        albumTitle: 'Audioguía',
      });
    } catch {}

    setSolicitando(true);
    player.play();
    esperarCarga();
  };

  const reintentar = () => {
    setFallo(false);
    if (fuenteLista) {
      setSolicitando(true);
      player.replace(fuenteLista);
      player.play();
      esperarCarga();
    }
  };

  const saltar = (segundos: number) => {
    if (total <= 0) return;
    player.seekTo(Math.min(Math.max(0, actual + segundos), total));
  };

  const buscar = (x: number) => {
    if (total <= 0 || anchoBarra <= 0) return;
    const proporcion = Math.min(1, Math.max(0, x / anchoBarra));
    player.seekTo(proporcion * total);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icono}>
          <Ionicons name="headset" size={18} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Audioguía</Text>
          <Text style={styles.subtitulo}>
            {idiomaLegible(idioma)}
            {total > 0 ? ` · ${formatearTiempo(total)}` : ''}
          </Text>
        </View>
        {disponibleOffline && (
          <View style={styles.chipOffline}>
            <Ionicons name="download-outline" size={12} color="#065F46" />
            <Text style={styles.chipOfflineText}>Descargada</Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.barra}
        onLayout={(e) => setAnchoBarra(e.nativeEvent.layout.width)}
        onPress={(e) => buscar(e.nativeEvent.locationX)}
      >
        <View style={styles.barraFondo} />
        <View style={[styles.barraAvance, { width: `${avance * 100}%` }]} />
        <View style={[styles.perilla, { left: Math.max(0, avance * anchoBarra - 7) }]} />
      </Pressable>

      <View style={styles.tiempos}>
        <Text style={styles.tiempo}>{formatearTiempo(actual)}</Text>
        <Text style={styles.tiempo}>{textoRestante(actual, total)}</Text>
      </View>

      <View style={styles.controles}>
        <Pressable onPress={() => saltar(-SALTO_SEGUNDOS)} style={styles.salto}>
          <Ionicons name="play-back" size={18} color="#4F46E5" />
          <Text style={styles.saltoTexto}>15</Text>
        </Pressable>

        <Pressable onPress={fallo ? reintentar : alternar} style={styles.botonPlay}>
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name={status.playing ? 'pause' : 'play'} size={26} color="#fff" />
          )}
        </Pressable>

        <Pressable onPress={() => saltar(SALTO_SEGUNDOS)} style={styles.salto}>
          <Ionicons name="play-forward" size={18} color="#4F46E5" />
          <Text style={styles.saltoTexto}>15</Text>
        </Pressable>
      </View>

      {fallo ? (
        <Text style={styles.aviso}>
          No pudimos cargar el audio. Revisá la conexión o descargá la ficha del lugar para escucharla sin
          internet.
        </Text>
      ) : !disponibleOffline ? (
        <Text style={styles.ayuda}>
          Para escucharla sin conexión, descargá la ficha del lugar desde “Modo offline”.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  subtitulo: { fontSize: 12, color: '#4B5563', marginTop: 1 },
  chipOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipOfflineText: { fontSize: 10, fontWeight: '600', color: '#065F46' },
  barra: { height: 22, justifyContent: 'center' },
  barraFondo: { height: 5, borderRadius: 3, backgroundColor: '#C7D2FE' },
  barraAvance: { position: 'absolute', height: 5, borderRadius: 3, backgroundColor: '#4F46E5' },
  perilla: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#fff',
  },
  tiempos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  tiempo: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    marginTop: 2,
  },
  salto: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  saltoTexto: { fontSize: 10, fontWeight: '700', color: '#4F46E5', marginTop: -2 },
  botonPlay: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aviso: { fontSize: 12, color: '#B45309', textAlign: 'center', marginTop: 4 },
  ayuda: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 2 },
});
