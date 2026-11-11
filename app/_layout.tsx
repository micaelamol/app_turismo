// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';
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
 * No hay pantalla de arranque propia: la app abre directo en el login (si no
 * hay cuenta desbloqueada, el layout de las pestañas redirige ahí). Las
 * pantallas tienen fondo claro, así que la hora y la batería van en oscuro
 * aunque el teléfono esté en modo noche: si no, no se leen.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <PlacesProvider>
        <StatusBar style="dark" />
        <Slot />
      </PlacesProvider>
    </AuthProvider>
  );
}
