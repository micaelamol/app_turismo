# Colón Turismo

TP de aplicaciones móviles. App en Expo / React Native para recorrer Colón: catálogo de
lugares, mapa, agenda de eventos, audioguías, visitas por QR y descargas para usar sin señal.

Usa la API "Mi Ciudad" (NestJS + PostgreSQL), que corre en la misma compu.

## Cómo levantarla

1. Levantar la API siguiendo su README (`pnpm install`, `pnpm db:reiniciar`, `pnpm dev`).
   Queda en el puerto 3000.
2. Sacar la IP de la compu con `ipconfig` (Windows) o `ipconfig getifaddr en0` (Mac).
3. Copiar `.env.example` a `.env` y poner esa IP.
4. `npm install` y `npx expo start`. Abrir con Expo Go.

Si la app abre pero no aparecen los lugares, probar `http://TU-IP:3000/salud` en el
navegador del teléfono. Si no responde, es el firewall de Windows o están en redes distintas.

## Usuarios de demo

- `lucia@mail.com` / `lucia1234`
- `nuevo@demo.ar` / `nuevo1234`
- `turismo@colon.demo.ar` / `turismo1234` (admin)

También se puede entrar como invitado.

## Fotos y audios

Lo que se sube desde la app queda en `api-mi-ciudad/archivos/`, que está ignorado por git.
En el repo no hay fotos ni audios nuestros: con la semilla se ven los de demo. Las descargas
quedan guardadas en el teléfono.

## Lo que no está

- El aviso con la app cerrada no funciona porque `POST /dispositivos` devuelve 501.
- Reseñas y "quitar visita" son solo locales, la API no tiene endpoints para eso.
