
import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { PlacesProvider } from '../src/context/PlacesContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlacesProvider>
        {/* Slot le da el paso libre a tu carpeta (tabs) para que muestre la barra de abajo */}
        <Slot />
      </PlacesProvider>
    </AuthProvider>
  );
}
