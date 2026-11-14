// src/utils/comoLlegar.ts
// PRD, punto 2: el botón tiene que abrir la app de mapas y llevar "caminando o en auto".
// Google Maps solo respeta el modo si se lo pasamos en `travelmode`; sin eso
// resuelve siempre en auto.
import { Alert, Linking } from 'react-native';

export type ModoViaje = 'walking' | 'driving';

/** URL de Google Maps con el modo de viaje ya elegido. */
export function urlComoLlegar(destino: string, modo: ModoViaje): string {
  // Las coordenadas se pasan como "lat,lng" y la coma tiene que quedar suelta.
  const punto = encodeURIComponent(destino.trim()).replace(/%2C/g, ',');
  return `https://www.google.com/maps/dir/?api=1&destination=${punto}&travelmode=${modo}`;
}

async function abrirMapa(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'No pudimos abrir el mapa',
      'Probá buscando el lugar manualmente en tu app de mapas.'
    );
  }
}

/** Pregunta caminando o en auto y abre la app de mapas con ese modo. */
export function elegirComoLlegar(destino: string): void {
  Alert.alert('¿Cómo vas?', 'Elegí cómo querés llegar.', [
    {
      text: 'Caminando',
      onPress: () => abrirMapa(urlComoLlegar(destino, 'walking')),
    },
    {
      text: 'En auto',
      onPress: () => abrirMapa(urlComoLlegar(destino, 'driving')),
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
