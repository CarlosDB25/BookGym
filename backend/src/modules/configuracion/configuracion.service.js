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
  ventana_checkin_min: {
    valor: 15,
    descripcion: 'Ventana de minutos antes/despues del inicio para check-in',
  },
  umbral_noshow: {
    valor: 3,
    descripcion: 'Numero de inasistencias antes de suspension automatica',
  },
  dias_suspension_por_noshow: {
    valor: 7,
    descripcion: 'Dias de suspension por alcanzar el umbral de no-show',
  },
};

async function leerConfigConDefault(clave) {
  let config = await prisma.configuracion.findUnique({ where: { clave } });
  if (!config) {
    const def = DEFAULT_REGLAS[clave];
    if (!def) return null;
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
  const ventanaCheckinMin = await leerConfigConDefault('ventana_checkin_min');
  const umbralNoshow = await leerConfigConDefault('umbral_noshow');
  const diasSuspensionPorNoshow = await leerConfigConDefault('dias_suspension_por_noshow');

  return {
    limiteReservasActivas,
    maxReservasPorDia,
    anticipacionReservaMin,
    anticipacionCancelacionMin,
    ventanaCheckinMin,
    umbralNoshow,
    diasSuspensionPorNoshow,
  };
}

module.exports = { obtenerReglasReserva };
