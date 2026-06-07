const prisma = require('../../shared/prisma/client');

async function registrarAuditoria(accion, entidad, idEntidad, detalle, idUsuario) {
  try {
    await prisma.auditLog.create({
      data: { accion, entidad, idEntidad, detalle: JSON.stringify(detalle), idUsuario },
    });
  } catch (e) {
    console.error('Error registrando auditoria:', e.message);
  }
}

async function listarPlantillas() {
  return prisma.plantillaFranja.findMany({
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  });
}

async function actualizarPlantilla(id, data, idAdmin) {
  const existente = await prisma.plantillaFranja.findUnique({ where: { id } });
  if (!existente) {
    throw Object.assign(new Error('Plantilla no encontrada'), { status: 404 });
  }

  const payload = {};
  const cambios = [];
  if (data.horaInicio !== undefined && data.horaInicio !== existente.horaInicio) {
    payload.horaInicio = data.horaInicio;
    cambios.push({ campo: 'horaInicio', anterior: existente.horaInicio, nuevo: data.horaInicio });
  }
  if (data.horaFin !== undefined && data.horaFin !== existente.horaFin) {
    payload.horaFin = data.horaFin;
    cambios.push({ campo: 'horaFin', anterior: existente.horaFin, nuevo: data.horaFin });
  }
  if (data.capacidadMaxima !== undefined && Number(data.capacidadMaxima) !== existente.capacidadMaxima) {
    payload.capacidadMaxima = data.capacidadMaxima;
    cambios.push({ campo: 'capacidadMaxima', anterior: existente.capacidadMaxima, nuevo: data.capacidadMaxima });
  }
  if (data.activa !== undefined && data.activa !== existente.activa) {
    payload.activa = data.activa;
    cambios.push({ campo: 'activa', anterior: existente.activa, nuevo: data.activa });
  }

  const resultado = await prisma.plantillaFranja.update({
    where: { id },
    data: payload,
  });

  if (cambios.length > 0) {
    await registrarAuditoria('actualizar_plantilla', 'plantilla_franja', id, {
      diaSemana: existente.diaSemana,
      cambios,
    }, idAdmin || 'admin');
  }

  return resultado;
}

module.exports = { listarPlantillas, actualizarPlantilla };
