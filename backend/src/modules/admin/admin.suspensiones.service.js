const prisma = require('../../shared/prisma/client');

async function listarSuspensiones(activas) {
  const where = {};
  if (activas === 'true') {
    where.activa = true;
    where.fechaFin = { gte: new Date() };
  } else if (activas === 'false') {
    where.activa = false;
  }

   const suspensiones = await prisma.suspension.findMany({
     where,
     include: { usuario: { select: { idInstitucional: true } } },
     orderBy: { fechaInicio: 'desc' },
   });

    return suspensiones.map((s) => ({
      id: s.id,
      idUsuario: s.idUsuario,
      nombreUsuario: s.usuario?.idInstitucional || s.idUsuario,
      fechaInicio: s.fechaInicio,
      fechaFin: s.fechaFin,
      motivo: s.motivo,
      activa: s.activa,
      levantadaPor: s.levantadaPor,
    }));
}

async function crearSuspension({ idUsuario, fechaInicio, fechaFin, motivo }) {
  const usuario = await prisma.usuario.findUnique({
    where: { idInstitucional: idUsuario },
  });
  if (!usuario) {
    throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
  }

  const suspensionActiva = await prisma.suspension.findFirst({
    where: { idUsuario, activa: true, fechaFin: { gte: new Date() } },
  });
  if (suspensionActiva) {
    throw Object.assign(
      new Error('El usuario ya tiene una suspension activa'),
      { status: 409 }
    );
  }

  const suspension = await prisma.suspension.create({
    data: {
      idUsuario,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      motivo,
      activa: true,
    },
    include: { usuario: { select: { idInstitucional: true } } },
  });

  return {
    id: suspension.id,
    idUsuario: suspension.idUsuario,
    nombreUsuario: suspension.usuario?.idInstitucional || suspension.idUsuario,
    fechaInicio: suspension.fechaInicio,
    fechaFin: suspension.fechaFin,
    motivo: suspension.motivo,
    activa: suspension.activa,
  };
}

async function levantarSuspension(id, idAdmin) {
  const suspension = await prisma.suspension.findUnique({ where: { id } });
  if (!suspension) {
    throw Object.assign(new Error('Suspension no encontrada'), { status: 404 });
  }
  if (!suspension.activa) {
    throw Object.assign(
      new Error('La suspension ya fue levantada anteriormente'),
      { status: 400 }
    );
  }

  const actualizada = await prisma.suspension.update({
    where: { id },
    data: { activa: false, levantadaPor: idAdmin },
    include: { usuario: { select: { idInstitucional: true } } },
  });

   return {
     id: actualizada.id,
     idUsuario: actualizada.idUsuario,
     nombreUsuario: actualizada.usuario?.idInstitucional || actualizada.idUsuario,
     fechaInicio: actualizada.fechaInicio,
     fechaFin: actualizada.fechaFin,
     motivo: actualizada.motivo,
     activa: actualizada.activa,
     levantadaPor: actualizada.levantadaPor
   };
 }
 
 async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: 'estudiante' },
    include: {
      suspensiones: {
        where: { activa: true, fechaFin: { gte: new Date() } },
        select: { id: true, fechaInicio: true, fechaFin: true, motivo: true, activa: true },
        take: 1,
      },
      reservas: {
        where: { estado: { in: ['activa', 'no_show', 'completada'] } },
        select: { estado: true, asistencia: { select: { resultado: true } } },
      },
    },
    orderBy: { idInstitucional: 'asc' },
  });

  return usuarios.map((u) => {
    const total = u.reservas.length;
    const noShows = u.reservas.filter((r) => r.estado === 'no_show' || (r.estado === 'activa' && !r.asistencia)).length;
    const suspensionActiva = u.suspensiones.length > 0 ? u.suspensiones[0] : null;

    return {
      usuarioId: u.idInstitucional,
      usuarioNombre: u.idInstitucional,
      programa: '—',
      noshowCount: total > 0 ? Math.round((noShows / total) * 10) : 0,
      activa: suspensionActiva?.activa || false,
      suspension: suspensionActiva
        ? { id: suspensionActiva.id, fechaInicio: suspensionActiva.fechaInicio, fechaFin: suspensionActiva.fechaFin, motivo: suspensionActiva.motivo }
        : null,
    };
  });
}

module.exports = { listarSuspensiones, crearSuspension, levantarSuspension, listarUsuarios };