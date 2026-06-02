const prisma = require('../../shared/prisma/client');
const { Prisma } = require('@prisma/client');

const CONFIG_DEFAULTS = {
  ventana_checkin_min: {
    valor: 15,
    descripcion: 'Minutos desde inicio del turno para hacer check-in',
  },
};

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

async function leerConfig(clave) {
  let config = await prisma.configuracion.findUnique({ where: { clave } });
  if (!config && CONFIG_DEFAULTS[clave]) {
    const def = CONFIG_DEFAULTS[clave];
    config = await prisma.configuracion.create({
      data: { clave, valor: String(def.valor), descripcion: def.descripcion },
    });
  }
  if (!config) {
    throw new Error(`Configuracion '${clave}' no encontrada`);
  }
  return parseInt(config.valor, 10);
}

async function registrarCheckIn(idReserva, idUsuario, rolUsuario) {
  const ventanaCheckinMin = await leerConfig('ventana_checkin_min');

  const reserva = await prisma.reserva.findUnique({
    where: { id: idReserva },
    include: { franja: { include: { plantilla: true } }, asistencia: true },
  });

  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (reserva.idUsuario !== idUsuario && rolUsuario !== 'administrador') {
    const error = new Error('No autorizado para registrar check-in de esta reserva');
    error.statusCode = 403;
    throw error;
  }

  if (reserva.estado !== 'activa') {
    const error = new Error(`La reserva no esta activa (estado: ${reserva.estado})`);
    error.statusCode = 400;
    throw error;
  }

  if (reserva.asistencia) {
    const error = new Error('El check-in ya fue registrado para esta reserva');
    error.statusCode = 400;
    throw error;
  }

  const ahora = new Date();
  const inicioTurno = inicioFranjaBogota(reserva.franja.fecha, reserva.franja.plantilla.horaInicio);
  const aperturaVentana = new Date(inicioTurno.getTime() - ventanaCheckinMin * 60 * 1000);
  const cierreVentana = new Date(inicioTurno.getTime() + ventanaCheckinMin * 60 * 1000);

  if (ahora < aperturaVentana || ahora > cierreVentana) {
    const error = new Error(
      `El check-in solo esta permitido entre ${ventanaCheckinMin} minutos antes y ${ventanaCheckinMin} minutos despues del inicio del turno`
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const asistencia = await tx.asistencia.create({
      data: {
        idReserva,
        registradoPor: idUsuario,
        resultado: 'presente',
      },
    });

    await tx.reserva.update({
      where: { id: idReserva },
      data: { estado: 'completada' },
    });

    return {
      mensaje: 'Check-in registrado exitosamente',
      asistencia,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

module.exports = { registrarCheckIn };
