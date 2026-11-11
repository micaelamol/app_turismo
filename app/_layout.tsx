// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { ActivityIndicator, LogBox, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { PlacesProvider } from '../src/context/PlacesContext';
import { inicializarBaseDeDatos } from '../src/servicios/database';

// Expo Go en Android muestra avisos de "push notifications" al importar
// expo-notifications (SDK 53+). La app solo usa notificaciones LOCALES, que sí
// funcionan en Expo Go, así que silenciamos esos avisos puntuales.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications)',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

// Se ejecuta una sola vez al cargar el módulo, antes del primer render,
// así las tablas ya existen cuando PlacesProvider pide los datos.
try {
  inicializarBaseDeDatos();
} catch (err) {
  console.error('Error al inicializar SQLite:', err);
}

/**
 * Mientras se restaura la sesión guardada no mostramos las pestañas: si no,
 * se ve "Invitado" un instante antes de que aparezca la cuenta.
 */
function Arranque() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitulo}>Colón</Text>
        <Text style={styles.splashBajada}>Guía Turística & Cultural</Text>
        <ActivityIndicator size="large" color="#4F46E5" style={styles.splashSpinner} />
      </View>
    );
  }

  // Slot deja pasar a las rutas hijas ((tabs), (auth), place/[id])
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlacesProvider>
        <Arranque />
      </PlacesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  splashTitulo: { fontSize: 34, fontWeight: 'bold', color: '#1F2937' },
  splashBajada: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  splashSpinner: { marginTop: 24 },
});
