const prisma = require('../../shared/prisma/client');

async function listarPlantillas() {
  return prisma.plantillaFranja.findMany({
    orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
  });
}

async function actualizarPlantilla(id, data) {
  const existente = await prisma.plantillaFranja.findUnique({ where: { id } });
  if (!existente) {
    throw Object.assign(new Error('Plantilla no encontrada'), { status: 404 });
  }

  const payload = {};
  if (data.horaInicio !== undefined) payload.horaInicio = data.horaInicio;
  if (data.horaFin !== undefined) payload.horaFin = data.horaFin;
  if (data.capacidadMaxima !== undefined) payload.capacidadMaxima = data.capacidadMaxima;
  if (data.activa !== undefined) payload.activa = data.activa;

  return prisma.plantillaFranja.update({
    where: { id },
    data: payload,
  });
}

module.exports = { listarPlantillas, actualizarPlantilla };
