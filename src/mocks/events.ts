// src/mocks/eventos.ts
import { Evento } from '../tipos';

export const MOCK_EVENTOS: Evento[] = [
  
  {
    id: "evt-017",
    titulo: "Peña en el anfiteatro",
    descripcion: "Noche de folclore con artistas de la región.",
    lugarId: "lug-009", // Asociado al Anfiteatro Municipal
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-14T21:00:00-03:00",
    fin: "2026-11-15T02:00:00-03:00",
    imagenUrl: "https://colon.tur.ar",
    precio: 0, // Gratis
    estado: "programado"
  },
  {
    id: "evt-018",
    titulo: "Noche de luces en la costanera",
    descripcion: "Música en vivo y fuegos artificiales sobre el río. Empieza a la noche y sigue hasta la madrugada: cruza la medianoche.",
    lugarId: "lug-014", // Costanera Gobernador Quirós
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-12-31T22:00:00-03:00",
    fin: "2027-01-01T04:00:00-03:00",
    imagenUrl: null,
    precio: 0,
    estado: "cancelado" // Caso de prueba solicitado por la dirección
  },
  {
    id: "evt-019",
    titulo: "Feria de artesanos en la plaza",
    descripcion: "Artesanías, dulces caseros y comidas regionales en la Plaza San Martín. La entrada es libre.",
    lugarId: "lug-027", // Feria de la Plaza San Martín
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-14T10:00:00-03:00",
    fin: "2026-11-15T22:00:00-03:00",
    imagenUrl: null,
    precio: 0,
    estado: "programado"
  },
  {
    id: "evt-020",
    titulo: "Peña folklórica en el Club de Pescadores",
    descripcion: "Empanadas, guitarreada y baile. Consultá el precio en el club.",
    lugarId: null, // Caso especial: sin lugarId en catálogo
    direccionLibre: "Club de Pescadores, Costanera Sur, Colón",
    coordenadas: { latitud: -32.2350, longitud: -58.1340 },
    inicio: "2026-11-20T21:30:00-03:00",
    fin: null,
    imagenUrl: null,
    precio: null, // Precio dinámico / no aplica directo
    estado: "programado"
  }
    {
    id: "evt-021",
    titulo: "Regata del río Uruguay",
    descripcion: "Regata de veleros frente a la costanera. Suspendida por el pronóstico de viento.",
    lugarId: "lug-007", // Puerto Viejo
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-14T14:00:00-03:00",
    fin: "2026-11-14T18:00:00-03:00",
    imagenUrl: null,
    precio: 0,
    estado: "suspendido" // Caso solicitado: marcado como suspendido por clima
  },
  {
    id: "evt-022",
    titulo: "Cine bajo las estrellas",
    descripcion: "Función al aire libre en el parque. Cancelada.",
    lugarId: "lug-015", // Parque Dr. Herminio J. Quirós
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-15T20:30:00-03:00",
    fin: "2026-11-15T22:30:00-03:00",
    imagenUrl: null,
    precio: 0,
    estado: "cancelado"
  },
  {
    id: "evt-023",
    titulo: "Fiesta de la Playa",
    descripcion: "Música, deportes de playa y un día entero en la Playa Norte.",
    lugarId: "lug-002", // Playa Norte
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-01-15T09:00:00-03:00",
    fin: "2026-01-18T23:59:00-03:00",
    imagenUrl: "https://colon.tur.ar",
    precio: 0,
    estado: "finalizado"
  },
  {
    id: "evt-024",
    titulo: "Muestra de fotografía de Colón",
    descripcion: "Fotos históricas de la ciudad en el Museo Casa de la Cultura.",
    lugarId: "lug-005", // Museo Casa de la Cultura
    direccionLibre: null,
    coordenadas: null,
    inicio: "2026-11-10T18:00:00-03:00",
    fin: "2026-11-25T21:00:00-03:00",
    imagenUrl: null,
    precio: null,
    estado: "programado"
  }

];
