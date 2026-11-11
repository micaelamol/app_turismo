// src/servicios/silenciarAvisosExpoGo.ts
// Se importa PRIMERO en app/_layout.tsx. expo-notifications avisa al cargarse
// que el push remoto no funciona en Expo Go; la app solo usa notificaciones
// locales, así que ese aviso no aplica y lo silenciamos antes de que aparezca.
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications)',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);
