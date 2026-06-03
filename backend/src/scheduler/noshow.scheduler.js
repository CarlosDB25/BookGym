const cron = require('node-cron');
const prisma = require('../shared/prisma/client');
const { procesarNoShows } = require('./noshow.processor');

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const adjust = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + adjust);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 5);

  return { start, end };
}

function semesterFromDate(date) {
  const y = date.getFullYear();
  const term = date.getMonth() < 6 ? 1 : 2;
  return `${y}-${term}`;
}

function dayOffset(diaSemana) {
  const map = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4 };
  return map[diaSemana] ?? 0;
}

function ymd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function sincronizarFranjasSemanaActual() {
  const { start, end } = getWeekRange();

  const plantillas = await prisma.plantillaFranja.findMany({ where: { activa: true } });
  const actuales = await prisma.franja.findMany({ where: { fecha: { gte: start, lt: end } } });

  const existentes = new Set(actuales.map((f) => `${f.idPlantilla}|${ymd(f.fecha)}`));

  const crear = [];
  for (const p of plantillas) {
    const fecha = new Date(start);
    fecha.setDate(start.getDate() + dayOffset(p.diaSemana));

    const key = `${p.id}|${ymd(fecha)}`;
    if (!existentes.has(key)) {
      crear.push({
        idPlantilla: p.id,
        fecha,
        semestre: semesterFromDate(fecha),
        cuposDisponibles: p.capacidadMaxima,
      });
    }
  }

  if (crear.length > 0) {
    await prisma.franja.createMany({ data: crear });
  }

  await prisma.franja.deleteMany({
    where: {
      AND: [
        { OR: [{ fecha: { lt: start } }, { fecha: { gte: end } }] },
        { reservas: { none: {} } },
      ],
    },
  });
}

async function ejecutarNoShow() {
  try {
    const resultado = await procesarNoShows();
    console.log(
      `[NoShow scheduler] procesadas=${resultado.procesadas} suspendidos=${resultado.suspendidos.length}`
    );
  } catch (error) {
    console.error('[NoShow scheduler] error:', error.message);
  }
}

function iniciarNoShowScheduler() {
  sincronizarFranjasSemanaActual().catch((error) =>
    console.error('Error sincronizando franjas iniciales:', error)
  );

  cron.schedule('5 0 * * *', () => {
    sincronizarFranjasSemanaActual().catch((error) =>
      console.error('Error en sincronizacion diaria de franjas:', error)
    );
  });

  cron.schedule('*/15 * * * *', () => {
    ejecutarNoShow().catch((error) =>
      console.error('[NoShow scheduler] error en ejecucion:', error.message)
    );
  });

  console.log('[NoShow scheduler] iniciado: cron "*/15 * * * *" (cada 15 minutos)');
}

module.exports = { iniciarNoShowScheduler, sincronizarFranjasSemanaActual, procesarNoShows };
