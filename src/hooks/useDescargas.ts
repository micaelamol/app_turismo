// src/hooks/useDescargas.ts
// Estado y acciones de "Mis descargas" (lugares disponibles offline).

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Lugar } from '../tipos';
import {
  DescargaLugar,
  NivelDescarga,
  eliminarDescargaDeDb,
  eliminarTodasLasDescargasDeDb,
  inicializarDescargasDb,
  listarDescargas,
  obtenerDescarga,
} from '../servicios/descargasDb';
import {
  descargarLugar,
  eliminarDescarga,
  eliminarTodasLasDescargas,
  formatearBytes,
  pesoTotalDescargasBytes,
} from '../servicios/descargas';

export function useDescargas() {
  const [descargas, setDescargas] = useState<DescargaLugar[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [pesoTotal, setPesoTotal] = useState<number>(0);

  const recargar = useCallback(async () => {
    try {
      setError(null);
      await inicializarDescargasDb();
      const lista = await listarDescargas();
      setDescargas(lista);
      const peso = await pesoTotalDescargasBytes();
      setPesoTotal(peso);
    } catch (error) {
      console.warn('No se pudo leer las descargas', error);
      setError('No pudimos abrir tus descargas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  const estaDescargado = useCallback(
    (lugarId: string) => descargas.some((d) => d.id === lugarId),
    [descargas]
  );

  const obtenerDescargaActual = useCallback(
    (lugarId: string) => descargas.find((d) => d.id === lugarId) ?? null,
    [descargas]
  );

  const descargar = useCallback(
    async (lugar: Lugar, nivel: NivelDescarga): Promise<DescargaLugar> => {
      setDescargandoId(lugar.id);
      try {
        const descarga = await descargarLugar(lugar, nivel);
        await recargar();
        return descarga;
      } finally {
        setDescargandoId(null);
      }
    },
    [recargar]
  );

  const eliminar = useCallback(
    async (lugarId: string): Promise<void> => {
      setDescargandoId(lugarId);
      try {
        await eliminarDescarga(lugarId);
        await recargar();
      } finally {
        setDescargandoId(null);
      }
    },
    [recargar]
  );

  const eliminarTodo = useCallback(async (): Promise<void> => {
    await eliminarTodasLasDescargas();
    await recargar();
  }, [recargar]);

  return {
    descargas,
    cargando,
    error,
    descargandoId,
    pesoTotal,
    estaDescargado,
    obtenerDescarga: obtenerDescargaActual,
    descargar,
    eliminar,
    eliminarTodo,
    recargar,
    formatearBytes,
  };
}
