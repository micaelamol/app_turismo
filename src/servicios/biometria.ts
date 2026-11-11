// src/servicios/biometria.ts
// Huella o rostro del teléfono (PRD, tabla técnica: "reingreso con huella o rostro").
// No reemplaza a la contraseña: solo desbloquea la sesión que ya está guardada.
import * as LocalAuthentication from 'expo-local-authentication';

export type ResultadoBiometria = 'ok' | 'cancelada' | 'fallida' | 'no-disponible' | 'sin-sesion';

/** true cuando el teléfono tiene lector y hay una huella o rostro registrado. */
export async function biometriaDisponible(): Promise<boolean> {
  try {
    const [tieneLector, hayRegistro] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return tieneLector && hayRegistro;
  } catch {
    return false;
  }
}

/** Abre el diálogo del sistema. Nunca lanza: devuelve qué pasó. */
export async function pedirBiometria(
  mensaje: string
): Promise<Exclude<ResultadoBiometria, 'sin-sesion'>> {
  if (!(await biometriaDisponible())) return 'no-disponible';

  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: mensaje,
      cancelLabel: 'Cancelar',
      // Si falla varias veces, el sistema ofrece el PIN del teléfono.
      disableDeviceFallback: false,
    });

    if (resultado.success) return 'ok';

    const erroresDeCancelacion = ['user_cancel', 'app_cancel', 'system_cancel'];
    return erroresDeCancelacion.includes(resultado.error) ? 'cancelada' : 'fallida';
  } catch {
    return 'fallida';
  }
}
