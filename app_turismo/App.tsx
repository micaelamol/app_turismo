import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PlacesProvider } from './src/context/PlacesContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlacesProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </PlacesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
