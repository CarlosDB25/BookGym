const prisma = require('../../shared/prisma/client');

function parseMonday(fecha) {
  const base = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  const day = base.getDay();
  const adjust = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + adjust);
  base.setHours(0, 0, 0, 0);
  return base;
}

async function resumen(fecha) {
  const inicio = parseMonday(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 5);

  const franjas = await prisma.franja.findMany({
    where: { fecha: { gte: inicio, lt: fin } },
    include: { plantilla: true },
  });

  const totalCapacidad = franjas.reduce((acc, f) => acc + f.plantilla.capacidadMaxima, 0);
  const totalDisponibles = franjas.reduce((acc, f) => acc + f.cuposDisponibles, 0);
  const totalReservadas = totalCapacidad - totalDisponibles;

  const saturacionAlta = franjas.filter((f) => {
    const ocupacion = 1 - f.cuposDisponibles / f.plantilla.capacidadMaxima;
    return ocupacion >= 0.75;
  }).length;
  const saturacionMedia = franjas.filter((f) => {
    const ocupacion = 1 - f.cuposDisponibles / f.plantilla.capacidadMaxima;
    return ocupacion >= 0.4 && ocupacion < 0.75;
  }).length;
  const saturacionBaja = franjas.length - saturacionAlta - saturacionMedia;

  return {
    semana: inicio.toISOString().slice(0, 10),
    totalCapacidad,
    totalDisponibles,
    totalReservadas,
    ocupacionPromedio: totalCapacidad > 0 ? Math.round((totalReservadas / totalCapacidad) * 100) : 0,
    saturacionAlta,
    saturacionMedia,
    saturacionBaja,
    totalFranjas: franjas.length,
  };
}

module.exports = { resumen };
