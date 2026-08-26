import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('turista@sanjuan.gob.ar');
  const [password, setPassword] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<UserRole>('turista');

  const handleLogin = () => {
    login(email, selectedRole);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="sunny" size={42} color="#F59E0B" />
        </View>
        <Text style={styles.appName}>San Juan</Text>
        <Text style={styles.tagline}>Guía Turística & Cultural ☀️🍷</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.roleTitle}>Selecciona tu perfil:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'turista' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('turista')}
          >
            <Ionicons
              name="airplane-outline"
              size={20}
              color={selectedRole === 'turista' ? '#fff' : '#6B7280'}
            />
            <Text
              style={[styles.roleButtonText, selectedRole === 'turista' && styles.roleButtonTextActive]}
            >
              Turista
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, selectedRole === 'habitante' && styles.roleButtonActive]}
            onPress={() => setSelectedRole('habitante')}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={selectedRole === 'habitante' ? '#fff' : '#6B7280'}
            />
            <Text
              style={[styles.roleButtonText, selectedRole === 'habitante' && styles.roleButtonTextActive]}
            >
              Sanjuanino
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Ingresar a San Juan</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Regístrate gratis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
});
