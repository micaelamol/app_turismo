// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#A8422A',
      tabBarInactiveTintColor: '#666',
      headerShown: true,
      tabBarStyle: { backgroundColor: '#fff' }
    }}>
      {/* 1. Inicio (banner, categorías y lugares) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 2. Mapa interactivo de Colón */}
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 3. Agenda de eventos */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 4. Historial de recorrido */}
      <Tabs.Screen
        name="recorrido"
        options={{
          title: 'Mi Recorrido',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="footsteps-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 5. Perfil con favoritos y bitácora */}
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