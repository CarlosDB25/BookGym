const prisma = require('../../shared/prisma/client');

async function leerConfig(clave) {
  const config = await prisma.configuracion.findUnique({ where: { clave } });

  if (!config) {
    throw new Error(`Configuracion '${clave}' no encontrada`);
  }

  return parseInt(config.valor, 10);
}

async function crearReserva(idUsuario, idFranja) {
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

  const limite = await leerConfig('limite_reservas_activas');
  const activas = await prisma.reserva.count({
    where: {
      idUsuario,
      estado: 'activa',
    },
  });

  if (activas >= limite) {
    throw new Error(`Limite de ${limite} reservas activas alcanzado`);
  }

  return prisma.$transaction(async (tx) => {
    const franja = await tx.franja.findUnique({ where: { id: idFranja } });

    if (!franja) {
      throw new Error('Franja no encontrada');
    }

    if (franja.cuposDisponibles <= 0) {
      throw new Error('Sin cupos disponibles en esta franja');
    }

    await tx.franja.update({
      where: { id: idFranja },
      data: { cuposDisponibles: { decrement: 1 } },
    });

    return tx.reserva.create({
      data: { idUsuario, idFranja, estado: 'activa' },
      include: { franja: { include: { plantilla: true } } },
    });
  });
}

async function cancelarReserva(idReserva, idUsuario) {
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
  const inicioTurno = new Date(reserva.franja.fecha);
  const [h, m] = reserva.franja.plantilla.horaInicio.split(':');
  inicioTurno.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

  if (ahora >= inicioTurno) {
    throw new Error('No es posible cancelar un turno que ya ha iniciado');
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
  return prisma.reserva.findMany({
    where: { idUsuario, estado: 'activa' },
    include: { franja: { include: { plantilla: true } } },
    orderBy: { fechaCreacion: 'desc' },
  });
}

module.exports = {
  crearReserva,
  cancelarReserva,
  obtenerReservasActivas,
};
