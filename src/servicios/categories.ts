// src/servicios/categories.ts
import * as Network from 'expo-network';
import { Categoria, RespuestaApiExito } from '../tipos';
import { guardarCategoriasEnSQLite, obtenerCategoriasDeSQLite } from './database';
import { BASE_URL } from './config';


/**
 * Obtiene el listado de categorías. 
 * Si el dispositivo cuenta con conexión a internet, consulta y sincroniza con PostgreSQL.
 * Si se encuentra offline (ej. Ischigualasto o zonas de diques), lee desde SQLite local.
 */
export async function obtenerCategorias(): Promise<RespuestaApiExito<Categoria[]>> {
  try {
    // 1. Evaluar el estado de conectividad del dispositivo
    const estadoRed = await Network.getNetworkStateAsync();

    if (estadoRed.isConnected && estadoRed.isInternetReachable) {
      // 2. Flujo Online: Petición HTTP al servidor PostgreSQL
      const respuesta = await fetch(`${BASE_URL}/categorias`);
      
      if (!respuesta.ok) {
        throw new Error(`Error en el servidor backend: ${respuesta.status}`);
      }

      const resultado: RespuestaApiExito<Categoria[]> = await respuesta.json();

      // Sincronización asíncrona en segundo plano hacia la base de datos local SQLite
      await guardarCategoriasEnSQLite(resultado.datos);

      return resultado;
    } else {
      // 3. Flujo Offline: Recuperación local en SQLite
      return await obtenerCategoriasDesdeSQLiteLocal();
    }
  } catch (error) {
    console.warn('Fallo en la consulta online. Activando respaldo local de contingencia:', error);
    // Mecanismo de defensa por si el servidor backend está caído pero hay Wi-Fi conectado
    return await obtenerCategoriasDesdeSQLiteLocal();
  }
}

/**
 * Función interna auxiliar para formatear la salida de SQLite con la estructura de la API
 */
async function obtenerCategoriasDesdeSQLiteLocal(): Promise<RespuestaApiExito<Categoria[]>> {
  const categoriasLocales = await obtenerCategoriasDeSQLite();
  return {
    datos: categoriasLocales,
    meta: {
      total: categoriasLocales.length,
      pagina: 1,
      porPagina: categoriasLocales.length
    }
  };
}



// import { Categoria, RespuestaApiExito } from '../tipos';

// const BASE_URL = 'http://192.168.0.102:3000';

// /**
//  * Obtiene el listado de categorías desde la API de PostgreSQL
//  */
// export async function obtenerCategorias(): Promise<RespuestaApiExito<Categoria[]>> {
//   const respuesta = await fetch(`${BASE_URL}/categorias`);
  
//   if (!respuesta.ok) {
//     throw new Error('Error al obtener las categorías del servidor');
//   }

//   return await respuesta.json();
// }




