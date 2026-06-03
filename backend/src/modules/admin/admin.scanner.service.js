const prisma = require('../../shared/prisma/client');

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

function hoyBogota() {
  const now = new Date();
  const bogotaMs = now.getTime() - 5 * 3600000;
  const bogotaDate = new Date(bogotaMs);
  const y = bogotaDate.getUTCFullYear();
  const m = String(bogotaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(bogotaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
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

async function verificarEstudiante(cedula) {
  const usuario = await prisma.usuario.findUnique({
    where: { idInstitucional: cedula },
    select: { idInstitucional: true, rol: true, estado: true },
  });

  if (!usuario) {
    const error = new Error('Estudiante no encontrado en el sistema');
    error.statusCode = 404;
    throw error;
  }

  const suspension = await prisma.suspension.findFirst({
    where: {
      idUsuario: cedula,
      activa: true,
      fechaFin: { gte: new Date() },
    },
    select: { id: true, fechaInicio: true, fechaFin: true, motivo: true },
  });

  if (suspension) {
    return {
      estado: 'SUSPENDIDO',
      usuario: { id: usuario.idInstitucional, rol: usuario.rol, estado: usuario.estado },
      suspension: {
        id: suspension.id,
        fechaInicio: suspension.fechaInicio,
        fechaFin: suspension.fechaFin,
        motivo: suspension.motivo,
      },
    };
  }

  const ventanaCheckinMin = await leerConfig('ventana_checkin_min');
  const hoy = hoyBogota();

  const reserva = await prisma.reserva.findFirst({
    where: {
      idUsuario: cedula,
      estado: 'activa',
      franja: { fecha: hoy },
    },
    include: {
      franja: { include: { plantilla: true } },
      asistencia: { select: { id: true } },
    },
  });

  if (reserva && !reserva.asistencia) {
    const inicioTurno = inicioFranjaBogota(reserva.franja.fecha, reserva.franja.plantilla.horaInicio);
    const aperturaVentana = new Date(inicioTurno.getTime() - ventanaCheckinMin * 60 * 1000);
    const cierreVentana = new Date(inicioTurno.getTime() + ventanaCheckinMin * 60 * 1000);
    const ahora = new Date();

    if (ahora >= aperturaVentana && ahora <= cierreVentana) {
      return {
        estado: 'RESERVA_ENCONTRADA',
        usuario: { id: usuario.idInstitucional, rol: usuario.rol, estado: usuario.estado },
        reserva: {
          id: reserva.id,
          franja: {
            id: reserva.franja.id,
            fecha: reserva.franja.fecha,
            horaInicio: reserva.franja.plantilla.horaInicio,
            horaFin: reserva.franja.plantilla.horaFin,
            diaSemana: reserva.franja.plantilla.diaSemana,
          },
        },
      };
    }
  }

  return {
    estado: 'SIN_RESERVA',
    usuario: { id: usuario.idInstitucional, rol: usuario.rol, estado: usuario.estado },
    mensaje: 'El estudiante no tiene reserva para la franja actual. Requiere ingreso manual/sobrecupo.',
  };
}

module.exports = { verificarEstudiante };
