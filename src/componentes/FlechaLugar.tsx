// src/componentes/FlechaLugar.tsx
// PRD §2: "Cuando el lugar está lejos y no se ve el cartel, que una flecha
// indique para qué lado queda."
// PRD §8: usa el magnetómetro del teléfono (expo-sensors).

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Coordinates } from '../tipos';
import {
  distanciaMetros,
  formatearDistancia,
  normalizarAngulo,
  puntoCardinal,
  rumboHacia,
} from '../utils/geo';

type Props = {
  origen: Coordinates;
  destino: Coordinates;
};

export default function FlechaLugar({ origen, destino }: Props) {
  const [rumboTelefono, setRumboTelefono] = useState(0);
  const [sensorDisponible, setSensorDisponible] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    let suscripcion: { remove: () => void } | null = null;

    (async () => {
      try {
        const disponible = await Magnetometer.isAvailableAsync();
        if (!activo) return;
        setSensorDisponible(disponible);
        if (!disponible) return;

        Magnetometer.setUpdateInterval(150);
        suscripcion = Magnetometer.addListener(({ x, y }) => {
          // Rumbo del teléfono respecto del norte magnético (0° = norte).
          // El vector del campo apunta al norte en coordenadas del equipo:
          // con la pantalla plana y el borde superior al norte, x≈0 e y>0.
          const angulo = Math.atan2(-x, y) * (180 / Math.PI);
          setRumboTelefono(angulo >= 0 ? angulo : angulo + 360);
        });
      } catch (e) {
        console.warn('No se pudo usar el magnetómetro', e);
        if (activo) setSensorDisponible(false);
      }
    })();

    return () => {
      activo = false;
      suscripcion?.remove();
    };
  }, []);

  const distancia = distanciaMetros(origen, destino);
  const direccion = rumboHacia(origen, destino);
  const rotacion = normalizarAngulo(direccion - rumboTelefono);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={20} color="#4F46E5" />
        <Text style={styles.titulo}>¿Para qué lado queda?</Text>
      </View>

      <View style={styles.fila}>
        <View style={styles.flechaCaja}>
          <Ionicons
            name="arrow-up"
            size={40}
            color="#4F46E5"
            style={{ transform: [{ rotate: `${rotacion}deg` }] }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.distancia}>{formatearDistancia(distancia)}</Text>
          <Text style={styles.texto}>
            Queda hacia el <Text style={styles.negrita}>{puntoCardinal(direccion)}</Text>.
          </Text>

          {sensorDisponible === false ? (
            <Text style={styles.pista}>
              Este teléfono no tiene brújula disponible. Podés orientarte con el mapa.
            </Text>
          ) : sensorDisponible ? (
            <Text style={styles.pista}>
              Apoyá el teléfono plano y apuntá al frente: la flecha gira con vos.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  titulo: { fontSize: 15, fontWeight: 'bold', color: '#4F46E5' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flechaCaja: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  distancia: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  texto: { fontSize: 13, color: '#374151', marginTop: 2 },
  negrita: { fontWeight: 'bold' },
  pista: { fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 15 },
});
