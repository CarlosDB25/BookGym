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

function parseMonday(fecha) {
  const base = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  const day = base.getDay();
  const adjust = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + adjust);
  base.setHours(0, 0, 0, 0);
  return base;
}

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

async function resumen(fecha) {
  const minutosAnticipacionReserva = await leerConfigConDefault(
    'anticipacion_reserva_min',
    30,
    'Minutos minimos de anticipacion para crear reserva'
  );

  const inicio = parseMonday(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 5);

  const franjas = await prisma.franja.findMany({
    where: { fecha: { gte: inicio, lt: fin } },
    include: { plantilla: true },
  });

  const ahora = new Date();
  const franjasVigentes = franjas.filter((f) => {
    const inicioFranja = inicioFranjaBogota(f.fecha, f.plantilla.horaInicio);
    const limiteReserva = new Date(inicioFranja.getTime() - minutosAnticipacionReserva * 60 * 1000);
    return ahora < limiteReserva;
  });
  const idsFranjasVigentes = franjasVigentes.map((f) => f.id);

  const totalReservadas =
    idsFranjasVigentes.length > 0
      ? await prisma.reserva.count({
          where: {
            estado: 'activa',
            idFranja: { in: idsFranjasVigentes },
          },
        })
      : 0;

  const totalCapacidad = franjasVigentes.reduce((acc, f) => acc + f.plantilla.capacidadMaxima, 0);
  const totalDisponibles = franjasVigentes.reduce((acc, f) => acc + f.cuposDisponibles, 0);

  const saturacionAlta = franjasVigentes.filter((f) => {
    const ocupacion = 1 - f.cuposDisponibles / f.plantilla.capacidadMaxima;
    return ocupacion >= 0.75;
  }).length;
  const saturacionMedia = franjasVigentes.filter((f) => {
    const ocupacion = 1 - f.cuposDisponibles / f.plantilla.capacidadMaxima;
    return ocupacion >= 0.4 && ocupacion < 0.75;
  }).length;
  const saturacionBaja = franjasVigentes.length - saturacionAlta - saturacionMedia;

  return {
    semana: inicio.toISOString().slice(0, 10),
    totalCapacidad,
    totalDisponibles,
    totalReservadas,
    ocupacionPromedio: totalCapacidad > 0 ? Math.round((totalReservadas / totalCapacidad) * 100) : 0,
    saturacionAlta,
    saturacionMedia,
    saturacionBaja,
    totalFranjas: franjasVigentes.length,
  };
}

module.exports = { resumen };
