// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const { user, modoInvitado } = useAuth();

  // Sin cuenta y sin elegir "Explorar como Invitado" no se entra a las
  // pestañas: se muestra el login (ahí está el botón de huella si hay sesión).
  if (!user && !modoInvitado) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4F46E5',
      tabBarInactiveTintColor: '#9CA3AF',
      headerShown: true,
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#F3F4F6' },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      {/* 1. Inicio (banner, categorías y lugares) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* 2. Mapa interactivo de Colón */}
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* 3. Agenda de eventos */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* 4. Historial de recorrido */}
      <Tabs.Screen
        name="recorrido"
        options={{
          title: 'Mi Recorrido',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'footsteps' : 'footsteps-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* 5. Perfil con favoritos y bitácora */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Yo',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}