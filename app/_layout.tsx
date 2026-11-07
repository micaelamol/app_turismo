// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { PlacesProvider } from '../src/context/PlacesContext';
import { inicializarBaseDeDatos } from '../src/servicios/database';

// Se ejecuta una sola vez al cargar el módulo, antes del primer render,
// así las tablas ya existen cuando PlacesProvider pide los datos.
try {
  inicializarBaseDeDatos();
} catch (err) {
  console.error('Error al inicializar SQLite:', err);
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlacesProvider>
        {/* Slot deja pasar a las rutas hijas ((tabs), (auth), place/[id]) */}
        <Slot />
      </PlacesProvider>
    </AuthProvider>
  );
}