const prisma = require('../../shared/prisma/client');

async function leerConfigConDefault(clave, valorDefecto, descripcionDefecto) {
  let config = await prisma.configuracion.findUnique({ where: { clave } });
  if (!config) {
    config = await prisma.configuracion.create({
      data: {
        clave,
        valor: String(valorDefecto),
        descripcion: descripcionDefecto,
      },
    });
  }
  return parseInt(config.valor, 10);
}

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

function nivelSaturacion(cuposDisponibles, capacidadMaxima) {
  const ocupacion = 1 - cuposDisponibles / capacidadMaxima;

  if (ocupacion < 0.4) return 'baja';
  if (ocupacion < 0.75) return 'media';
  return 'alta';
}

async function obtenerDisponibilidadSemana(fechaInicio) {
  const anticipacionReservaMin = await leerConfigConDefault(
    'anticipacion_reserva_min',
    30,
    'Minutos minimos de anticipacion para crear reserva'
  );

  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);

  const fechaFin = new Date(inicio);
  fechaFin.setDate(inicio.getDate() + 5);

  const franjas = await prisma.franja.findMany({
    where: {
      fecha: {
        gte: inicio,
        lt: fechaFin,
      },
    },
    include: { plantilla: true },
    orderBy: [{ fecha: 'asc' }, { plantilla: { horaInicio: 'asc' } }],
  });

  const ahora = new Date();
  const franjasVigentes = franjas.filter((f) => {
    const inicioTurno = inicioFranjaBogota(f.fecha, f.plantilla.horaInicio);
    const limiteReserva = new Date(inicioTurno.getTime() - anticipacionReservaMin * 60 * 1000);
    return ahora < limiteReserva;
  });

  return franjasVigentes.map((f) => ({
    id: f.id,
    fecha: f.fecha,
    diaSemana: f.plantilla.diaSemana,
    horaInicio: f.plantilla.horaInicio,
    horaFin: f.plantilla.horaFin,
    capacidadMaxima: f.plantilla.capacidadMaxima,
    cuposDisponibles: f.cuposDisponibles,
    saturacion: nivelSaturacion(f.cuposDisponibles, f.plantilla.capacidadMaxima),
  }));
}

module.exports = { obtenerDisponibilidadSemana };
