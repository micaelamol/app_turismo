// src/servicios/avisosProximidad.ts
// PRD §8: avisar cuando la persona pasa cerca de un lugar, sin convertir la
// app en una máquina de notificaciones. Regla: un aviso por lugar y por día.
// Son notificaciones LOCALES: no usan push ni tokens.

import * as Notifications from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import { Place } from '../tipos';
import { formatearDistancia } from '../utils/geo';
import { configurarHandlerNotificaciones } from './notificaciones';

configurarHandlerNotificaciones();

const CANAL_PROXIMIDAD = 'lugares-cerca';
const CLAVE_REGISTRO = 'avisos_proximidad_v1';
const CLAVE_PERMISO_PEDIDO = 'avisos_proximidad_permiso_v1';

export type MotivoSinAviso = 'sin_permiso' | 'ya_avisado' | 'inactivo' | 'error';

export interface ResultadoAviso {
  enviado: boolean;
  motivo?: MotivoSinAviso;
}

/** Un registro por cuenta: lugarId -> día en que ya se avisó. */
type Registro = Record<string, string>;

function claveDe(usuarioId: string): string {
  return `${CLAVE_REGISTRO}:${usuarioId}`;
}

/** Día local en formato YYYY-MM-DD (el aviso se renueva a la medianoche). */
function diaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

async function leerRegistro(usuarioId: string): Promise<Registro> {
  try {
    const crudo = await Storage.getItem(claveDe(usuarioId));
    if (!crudo) return {};

    const guardado = JSON.parse(crudo);
    if (!guardado || typeof guardado !== 'object') return {};

    // Solo interesa lo de hoy: lo viejo se descarta.
    const hoy = diaDeHoy();
    const vigente: Registro = {};
    Object.entries(guardado as Registro).forEach(([lugarId, fecha]) => {
      if (fecha === hoy) vigente[lugarId] = hoy;
    });
    return vigente;
  } catch {
    return {};
  }
}

async function marcarAvisado(usuarioId: string, lugarId: string): Promise<void> {
  try {
    const registro = await leerRegistro(usuarioId);
    registro[lugarId] = diaDeHoy();
    await Storage.setItem(claveDe(usuarioId), JSON.stringify(registro));
  } catch (error) {
    console.warn('No se pudo guardar el aviso de proximidad', error);
  }
}

/** Canal propio en Android 8+ (si no, el aviso no tiene importancia ni sonido). */
export async function prepararCanalProximidad(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CANAL_PROXIMIDAD, {
    name: 'Lugares cerca',
    description: 'Un aviso cuando pasás cerca de un lugar turístico',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#4F46E5',
    sound: 'default',
  });
}

/** Pide permiso de notificaciones para los avisos de proximidad. */
export async function pedirPermisoAvisos(): Promise<boolean> {
  try {
    await prepararCanalProximidad();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) return false;

    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch (error) {
    console.warn('No se pudo pedir permiso para los avisos', error);
    return false;
  }
}

let permisoConcedido = false;

/**
 * Pide el permiso una sola vez por instalación. El sistema igual decide si
 * vuelve a mostrar el diálogo, pero así no lo molestamos en cada arranque.
 */
export async function asegurarPermisoAvisos(): Promise<boolean> {
  if (permisoConcedido) return true;

  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) {
      permisoConcedido = true;
      return true;
    }
    if (!actual.canAskAgain) return false;

    const yaPedido = await Storage.getItem(CLAVE_PERMISO_PEDIDO);
    if (yaPedido === '1') return false;

    await Storage.setItem(CLAVE_PERMISO_PEDIDO, '1');
    permisoConcedido = await pedirPermisoAvisos();
    return permisoConcedido;
  } catch (error) {
    console.warn('No se pudo revisar el permiso de los avisos', error);
    return false;
  }
}

/**
 * Muestra el aviso si el lugar está activo y todavía no se avisó hoy.
 * Devuelve `enviado: false` sin molestar cuando ya corresponde callarse.
 */
export async function avisarSiEstoyCerca(
  lugar: Place,
  distancia: number,
  usuarioId: string
): Promise<ResultadoAviso> {
  if (lugar.activo === false) return { enviado: false, motivo: 'inactivo' };

  const registro = await leerRegistro(usuarioId);
  if (registro[lugar.id]) return { enviado: false, motivo: 'ya_avisado' };

  const tienePermiso = await asegurarPermisoAvisos();
  if (!tienePermiso) return { enviado: false, motivo: 'sin_permiso' };

  try {
    await prepararCanalProximidad();
    const nombre = lugar.nombre || lugar.title || 'un lugar';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Estás cerca de ${nombre}`,
        body: `A ${formatearDistancia(distancia)}. Tocá para ver horarios y cómo llegar.`,
        data: { tipo: 'proximidad', lugarId: lugar.id },
        sound: 'default',
      },
      // Sin fecha: se muestra ahora mismo, en el canal de proximidad.
      trigger: { channelId: CANAL_PROXIMIDAD },
    });

    await marcarAvisado(usuarioId, lugar.id);
    return { enviado: true };
  } catch (error) {
    console.warn('No se pudo mostrar el aviso de proximidad', error);
    return { enviado: false, motivo: 'error' };
  }
}
