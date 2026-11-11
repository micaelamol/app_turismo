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

// Si el sistema no contesta en este tiempo, cortamos para no dejar la pantalla
// trabada esperando un diálogo que nunca aparece.
const ESPERA_MAXIMA_MS = 45000;

/** Abre el diálogo del sistema. Nunca lanza: devuelve qué pasó. */
export async function pedirBiometria(
  mensaje: string
): Promise<Exclude<ResultadoBiometria, 'sin-sesion'>> {
  if (!(await biometriaDisponible())) return 'no-disponible';

  // Si quedó un diálogo colgado de un intento anterior, lo cerramos: si no,
  // authenticateAsync contesta "autenticación en curso" y no pasa nada.
  try {
    LocalAuthentication.cancelAuthenticate();
  } catch {
    // En iOS esta función puede no existir; no es un problema.
  }

  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const seColgo = new Promise<'fallida'>((resolver) => {
    temporizador = setTimeout(() => {
      try {
        LocalAuthentication.cancelAuthenticate();
      } catch {
        // Nada para hacer.
      }
      resolver('fallida');
    }, ESPERA_MAXIMA_MS);
  });

  try {
    const resultado = await Promise.race([
      LocalAuthentication.authenticateAsync({
        promptMessage: mensaje,
        cancelLabel: 'Cancelar',
        // Si falla varias veces, el sistema ofrece el PIN del teléfono.
        disableDeviceFallback: false,
      }),
      seColgo,
    ]);

    if (resultado === 'fallida') return 'fallida';
    if (resultado.success) return 'ok';

    const erroresDeCancelacion = ['user_cancel', 'app_cancel', 'system_cancel'];
    return erroresDeCancelacion.includes(resultado.error) ? 'cancelada' : 'fallida';
  } catch {
    return 'fallida';
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}
