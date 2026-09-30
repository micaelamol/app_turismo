// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#A8422A', 
      tabBarInactiveTintColor: '#666',
      headerShown: true,
      tabBarStyle: { backgroundColor: '#fff' }
    }}>
      {/* 1. Inicio (Tu Home Screen con categorías y banner) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 2. Nueva pestaña dedicada al Mapa interactivo de San Juan */}
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 3. Agenda de Eventos */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 4. Tu Historial de Recorrido */}
      <Tabs.Screen
        name="recorrido"
        options={{
          title: 'Mi Recorrido',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="footsteps-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 5. Perfil de Usuario (Yo) con favoritos y bitácora integrados */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Yo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
