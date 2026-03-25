const prisma = require('../../shared/prisma/client');

const DEFAULT_REGLAS = {
  limite_reservas_activas: {
    valor: 2,
    descripcion: 'Max reservas activas simultaneas por usuario',
  },
  max_reservas_por_dia: {
    valor: 1,
    descripcion: 'Max reservas activas por usuario en un mismo dia',
  },
  anticipacion_reserva_min: {
    valor: 30,
    descripcion: 'Minutos minimos de anticipacion para crear reserva',
  },
  anticipacion_cancelacion_min: {
    valor: 15,
    descripcion: 'Minutos minimos de anticipacion para cancelar reserva',
  },
};

async function leerConfigConDefault(clave) {
  let config = await prisma.configuracion.findUnique({ where: { clave } });
  if (!config) {
    const def = DEFAULT_REGLAS[clave];
    config = await prisma.configuracion.create({
      data: {
        clave,
        valor: String(def.valor),
        descripcion: def.descripcion,
      },
    });
  }
  return parseInt(config.valor, 10);
}

async function obtenerReglasReserva() {
  const limiteReservasActivas = await leerConfigConDefault('limite_reservas_activas');
  const maxReservasPorDia = await leerConfigConDefault('max_reservas_por_dia');
  const anticipacionReservaMin = await leerConfigConDefault('anticipacion_reserva_min');
  const anticipacionCancelacionMin = await leerConfigConDefault('anticipacion_cancelacion_min');

  return {
    limiteReservasActivas,
    maxReservasPorDia,
    anticipacionReservaMin,
    anticipacionCancelacionMin,
  };
}

module.exports = { obtenerReglasReserva };
