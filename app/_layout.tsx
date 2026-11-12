// app/_layout.tsx
// Este import va primero: silencia el aviso de Expo Go antes de que
// expo-notifications se cargue desde el hook de proximidad.
import '../src/servicios/silenciarAvisosExpoGo';

import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { PlacesProvider } from '../src/context/PlacesContext';
import { useAvisosProximidad } from '../src/hooks/useAvisosProximidad';
import { inicializarBaseDeDatos } from '../src/servicios/database';

// Se ejecuta una sola vez al cargar el módulo, antes del primer render,
// así las tablas ya existen cuando PlacesProvider pide los datos.
try {
  inicializarBaseDeDatos();
} catch (err) {
  console.error('Error al inicializar SQLite:', err);
}

// El aviso de proximidad necesita los lugares y la ubicación, por eso va
// adentro de PlacesProvider. No dibuja nada: solo escucha y avisa.
function AvisosDeProximidad() {
  useAvisosProximidad();
  return null;
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
        <AvisosDeProximidad />
        <StatusBar style="dark" />
        <Slot />
      </PlacesProvider>
    </AuthProvider>
  );
}
