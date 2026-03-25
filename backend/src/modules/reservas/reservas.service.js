const prisma = require('../../shared/prisma/client');
const { Prisma } = require('@prisma/client');

const CONFIG_DEFAULTS = {
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

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

function esFranjaVigente(franja) {
  return inicioFranjaBogota(franja.fecha, franja.plantilla.horaInicio) > new Date();
}

async function leerConfig(clave) {
  let config = await prisma.configuracion.findUnique({ where: { clave } });

  if (!config && CONFIG_DEFAULTS[clave]) {
    const def = CONFIG_DEFAULTS[clave];
    config = await prisma.configuracion.create({
      data: {
        clave,
        valor: String(def.valor),
        descripcion: def.descripcion,
      },
    });
  }

  if (!config) {
    throw new Error(`Configuracion '${clave}' no encontrada`);
  }

  return parseInt(config.valor, 10);
}

async function crearReserva(idUsuario, idFranja) {
  const minutosAnticipacionReserva = await leerConfig('anticipacion_reserva_min');
  const limite = await leerConfig('limite_reservas_activas');
  const maxReservasPorDia = await leerConfig('max_reservas_por_dia');

  const franjaObjetivo = await prisma.franja.findUnique({
    where: { id: idFranja },
    include: { plantilla: true },
  });

  if (!franjaObjetivo) {
    throw new Error('Franja no encontrada');
  }

  const ahora = new Date();
  const inicioTurno = inicioFranjaBogota(franjaObjetivo.fecha, franjaObjetivo.plantilla.horaInicio);
  const limiteReserva = new Date(inicioTurno.getTime() - minutosAnticipacionReserva * 60 * 1000);

  if (ahora >= limiteReserva) {
    throw new Error(
      `La reserva solo esta permitida hasta ${minutosAnticipacionReserva} minutos antes del inicio del turno`
    );
  }

  const suspension = await prisma.suspension.findFirst({
    where: {
      idUsuario,
      activa: true,
      fechaFin: { gte: new Date() },
    },
  });

  if (suspension) {
    throw new Error(`Usuario suspendido hasta ${new Date(suspension.fechaFin).toLocaleDateString('es-CO')}`);
  }

  return prisma.$transaction(async (tx) => {
    const franja = await tx.franja.findUnique({
      where: { id: idFranja },
      include: { plantilla: true },
    });

    if (!franja) {
      throw new Error('Franja no encontrada');
    }

    const ahoraTx = new Date();
    const inicioTurnoTx = inicioFranjaBogota(franja.fecha, franja.plantilla.horaInicio);
    const limiteReservaTx = new Date(inicioTurnoTx.getTime() - minutosAnticipacionReserva * 60 * 1000);
    if (ahoraTx >= limiteReservaTx) {
      throw new Error(
        `La reserva solo esta permitida hasta ${minutosAnticipacionReserva} minutos antes del inicio del turno`
      );
    }

    const activas = await tx.reserva.count({
      where: {
        idUsuario,
        estado: 'activa',
      },
    });

    if (activas >= limite) {
      throw new Error(`Limite de ${limite} reservas activas alcanzado`);
    }

    const reservasMismoDia = await tx.reserva.count({
      where: {
        idUsuario,
        estado: 'activa',
        franja: {
          fecha: franja.fecha,
        },
      },
    });

    if (reservasMismoDia >= maxReservasPorDia) {
      if (maxReservasPorDia <= 1) {
        throw new Error('Solo puedes tener una reserva activa por dia');
      }
      throw new Error(`Solo puedes tener ${maxReservasPorDia} reservas activas por dia`);
    }

    const yaReservada = await tx.reserva.findFirst({
      where: {
        idUsuario,
        idFranja,
        estado: 'activa',
      },
    });

    if (yaReservada) {
      throw new Error('Ya tienes una reserva activa en esta franja');
    }

    // Seccion critica: decremento atomico solo si todavia hay cupo.
    const updateResult = await tx.franja.updateMany({
      where: {
        id: idFranja,
        cuposDisponibles: { gt: 0 },
      },
      data: {
        cuposDisponibles: { decrement: 1 },
      },
    });

    if (updateResult.count !== 1) {
      throw new Error('Sin cupos disponibles en esta franja');
    }

    return tx.reserva.create({
      data: { idUsuario, idFranja, estado: 'activa' },
      include: { franja: { include: { plantilla: true } } },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function cancelarReserva(idReserva, idUsuario) {
  const minutosAnticipacionCancelacion = await leerConfig('anticipacion_cancelacion_min');

  const reserva = await prisma.reserva.findUnique({
    where: { id: idReserva },
    include: { franja: { include: { plantilla: true } } },
  });

  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }

  if (reserva.idUsuario !== idUsuario) {
    throw new Error('No autorizado');
  }

  if (reserva.estado === 'cancelada') {
    throw new Error('Reserva ya cancelada');
  }

  const ahora = new Date();
  const inicioTurno = inicioFranjaBogota(reserva.franja.fecha, reserva.franja.plantilla.horaInicio);
  const limiteCancelacion = new Date(inicioTurno.getTime() - minutosAnticipacionCancelacion * 60 * 1000);

  if (ahora >= limiteCancelacion) {
    throw new Error(
      `La cancelacion solo esta permitida hasta ${minutosAnticipacionCancelacion} minutos antes del inicio del turno`
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.reserva.update({
      where: { id: idReserva },
      data: { estado: 'cancelada' },
    });

    await tx.franja.update({
      where: { id: reserva.idFranja },
      data: { cuposDisponibles: { increment: 1 } },
    });

    return { mensaje: 'Reserva cancelada exitosamente' };
  });
}

async function obtenerReservasActivas(idUsuario) {
  const activas = await prisma.reserva.findMany({
    where: { idUsuario, estado: 'activa' },
    include: { franja: { include: { plantilla: true } } },
    orderBy: [{ franja: { fecha: 'asc' } }, { fechaCreacion: 'desc' }],
  });

  return activas.filter((r) => esFranjaVigente(r.franja));
}

async function obtenerHistorialReservas(idUsuario) {
  const reservas = await prisma.reserva.findMany({
    where: { idUsuario },
    include: { franja: { include: { plantilla: true } } },
    orderBy: [{ franja: { fecha: 'desc' } }, { fechaCreacion: 'desc' }],
  });

  return reservas.filter((r) => r.estado === 'cancelada' || !esFranjaVigente(r.franja));
}

module.exports = {
  crearReserva,
  cancelarReserva,
  obtenerReservasActivas,
  obtenerHistorialReservas,
};
