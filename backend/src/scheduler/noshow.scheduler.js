const cron = require('node-cron');
const prisma = require('../shared/prisma/client');
const { procesarNoShows } = require('./noshow.processor');

const DIA_SEMANA_FROM_JS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function getNextNWeekdays(n = 5) {
  const dates = [];
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  while (dates.length < n) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function semesterFromDate(date) {
  const y = date.getFullYear();
  const term = date.getMonth() < 6 ? 1 : 2;
  return `${y}-${term}`;
}

function ymd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function sincronizarFranjasVisibles() {
  const fechasVisibles = getNextNWeekdays(5);
  const fechasAdelantadas = getNextNWeekdays(10);
  const todasFechas = [...new Set([
    ...fechasVisibles.map(ymd),
    ...fechasAdelantadas.map(ymd),
  ])].map((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  });

  const minFecha = todasFechas[0];
  const maxFecha = todasFechas[todasFechas.length - 1];

  const plantillas = await prisma.plantillaFranja.findMany({ where: { activa: true } });

  const actuales = await prisma.franja.findMany({
    where: {
      fecha: { gte: minFecha, lte: maxFecha },
    },
  });

  const existentes = new Set(actuales.map((f) => `${f.idPlantilla}|${ymd(f.fecha)}`));

  const crear = [];
  for (const fecha of todasFechas) {
    const diaSemana = DIA_SEMANA_FROM_JS[fecha.getUTCDay()];
    for (const p of plantillas) {
      if (p.diaSemana !== diaSemana) continue;
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
  }

  if (crear.length > 0) {
    await prisma.franja.createMany({ data: crear });
  }

  const haceUnaSemana = new Date(minFecha);
  haceUnaSemana.setUTCDate(haceUnaSemana.getUTCDate() - 7);

  await prisma.franja.deleteMany({
    where: {
      AND: [
        { fecha: { lt: haceUnaSemana } },
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
  sincronizarFranjasVisibles().catch((error) =>
    console.error('Error sincronizando franjas iniciales:', error)
  );

  cron.schedule('5 0 * * *', () => {
    sincronizarFranjasVisibles().catch((error) =>
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

module.exports = { iniciarNoShowScheduler, sincronizarFranjasVisibles, procesarNoShows };
