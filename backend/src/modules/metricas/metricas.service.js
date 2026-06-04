const prisma = require('../../shared/prisma/client');

const QUERY_TIMEOUT = 25000;

function withTimeout(promise, ms = QUERY_TIMEOUT) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Query timed out after ${ms}ms`)), ms);
  });
  promise.then(() => clearTimeout(timer), () => clearTimeout(timer));
  return Promise.race([promise, timeout]);
}

async function leerConfigConDefault(clave, valorDefecto, descripcionDefecto) {
  const config = await withTimeout(prisma.configuracion.upsert({
    where: { clave },
    update: {},
    create: { clave, valor: String(valorDefecto), descripcion: descripcionDefecto },
  }));
  return parseInt(config.valor, 10);
}

function parseMonday(fecha) {
  const base = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
  const day = base.getDay();
  base.setDate(base.getDate() + (day === 0 ? -6 : 1 - day));
  base.setHours(0, 0, 0, 0);
  return base;
}

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

function agruparSaturacion(franjas) {
  const grupos = {};
  for (const f of franjas) {
    const key = `${f.plantilla.diaSemana}_${f.plantilla.horaInicio}`;
    if (!grupos[key]) grupos[key] = { dia: f.plantilla.diaSemana, horaInicio: f.plantilla.horaInicio, totalCapacidad: 0, totalOcupadas: 0, ocurrencias: 0 };
    grupos[key].totalCapacidad += f.plantilla.capacidadMaxima;
    grupos[key].totalOcupadas += f.reservas.length;
    grupos[key].ocurrencias += 1;
  }
  return grupos;
}

function calcSaturacion(g) {
  if (g.totalCapacidad <= 0) return 0;
  return Math.round((g.totalOcupadas / g.totalCapacidad) * 100);
}

function calcOcupacion(cupoDisponible, capacidadMaxima) {
  if (!capacidadMaxima || capacidadMaxima <= 0) return 0;
  return Math.round((1 - cupoDisponible / capacidadMaxima) * 100);
}

async function recomendaciones(limite = 5, usuarioId = null) {
  const ahora = new Date();
  const inicioHistorial = new Date(ahora);
  inicioHistorial.setDate(inicioHistorial.getDate() - 90);
  const puntoMedio = new Date(ahora);
  puntoMedio.setDate(puntoMedio.getDate() - 45);

  const [franjas, franjasActuales] = await withTimeout(Promise.all([
    prisma.franja.findMany({
      where: { fecha: { gte: inicioHistorial, lt: ahora } },
      include: { plantilla: true, reservas: { where: { estado: { not: 'cancelada' } }, select: { id: true } } },
    }),
    prisma.franja.findMany({
      where: { fecha: { gte: parseMonday(), lt: (() => { const f = parseMonday(); f.setDate(f.getDate() + 5); return f; })() } },
      include: { plantilla: true, reservas: { where: { estado: { not: 'cancelada' } }, select: { id: true } } },
    }),
  ]));

  const gruposGlobales = agruparSaturacion(franjas);
  const gruposRecientes = agruparSaturacion(franjas.filter(f => f.fecha >= puntoMedio));
  const gruposAntiguos = agruparSaturacion(franjas.filter(f => f.fecha < puntoMedio));

  const disponibilidadActual = {};
  const inicioSemana = parseMonday();
  for (const f of franjasActuales) {
    const key = `${f.plantilla.diaSemana}_${f.plantilla.horaInicio}`;
    if (!disponibilidadActual[key]) disponibilidadActual[key] = { disponible: false, cuposRestantes: 0, fecha: null };
    const libres = f.plantilla.capacidadMaxima - f.reservas.length;
    if (libres > 0) {
      disponibilidadActual[key].disponible = true;
      disponibilidadActual[key].cuposRestantes += libres;
      if (!disponibilidadActual[key].fecha) disponibilidadActual[key].fecha = f.fecha.toISOString().slice(0, 10);
    }
  }

  let preferenciasUsuario = null;
  if (usuarioId) {
    const reservasUsuario = await withTimeout(prisma.reserva.findMany({
      where: { idUsuario: usuarioId, estado: { not: 'cancelada' } },
      include: { franja: { include: { plantilla: true } } },
      take: 20,
      orderBy: { fechaCreacion: 'desc' },
    }));
    if (reservasUsuario.length > 0) {
      const dias = {};
      const horas = {};
      for (const r of reservasUsuario) {
        dias[r.franja.plantilla.diaSemana] = (dias[r.franja.plantilla.diaSemana] || 0) + 1;
        horas[r.franja.plantilla.horaInicio] = (horas[r.franja.plantilla.horaInicio] || 0) + 1;
      }
      preferenciasUsuario = {
        diasFrecuentes: Object.entries(dias).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
        horaHabitual: Object.entries(horas).sort((a, b) => b[1] - a[1])[0]?.[0],
      };
    }
  }

  const slots = Object.values(gruposGlobales).map(g => {
    const key = `${g.dia}_${g.horaInicio}`;
    const gr = gruposRecientes[key];
    const ga = gruposAntiguos[key];
    const actual = disponibilidadActual[key];
    const saturacion = calcSaturacion(g);

    let tendencia = 'estable';
    if (gr && ga) {
      const sr = calcSaturacion(gr);
      const sa = calcSaturacion(ga);
      if (sr - sa > 10) tendencia = 'subiendo';
      else if (sa - sr > 10) tendencia = 'bajando';
    }

    let afinidad = 'neutra';
    if (preferenciasUsuario) {
      if (preferenciasUsuario.diasFrecuentes.includes(g.dia) && g.horaInicio === preferenciasUsuario.horaHabitual) {
        afinidad = 'alta';
      } else if (preferenciasUsuario.diasFrecuentes.includes(g.dia)) {
        afinidad = 'media';
      }
    }

    return {
      dia: g.dia, horaInicio: g.horaInicio, saturacionHistorica: saturacion,
      clasificacion: saturacion > 80 ? 'pico' : 'valle', tendencia,
      ocurrencias: g.ocurrencias, disponibleEstaSemana: actual ? actual.disponible : false,
      cuposRestantes: actual ? actual.cuposRestantes : 0, fechaProxima: actual?.fecha || null, afinidad,
    };
  });

  const mejoresMomentos = slots
    .filter(s => s.clasificacion === 'valle' && s.disponibleEstaSemana)
    .sort((a, b) => a.saturacionHistorica - b.saturacionHistorica)
    .slice(0, limite)
    .map(s => ({
      dia: s.dia, horaInicio: s.horaInicio, saturacionHistorica: s.saturacionHistorica,
      tendencia: s.tendencia, cuposRestantes: s.cuposRestantes, fechaProxima: s.fechaProxima,
      afinidad: s.afinidad,
      razon: s.afinidad === 'alta'
        ? 'Coincide con tus horarios habituales y tiene baja saturación histórica'
        : s.afinidad === 'media'
          ? 'Día que frecuentas y con buena disponibilidad actual'
          : 'Baja ocupación histórica con cupos disponibles esta semana',
    }));

  const evitando = slots
    .filter(s => s.clasificacion === 'pico')
    .sort((a, b) => b.saturacionHistorica - a.saturacionHistorica)
    .slice(0, 5)
    .map(s => ({
      dia: s.dia, horaInicio: s.horaInicio, saturacionHistorica: s.saturacionHistorica,
      tendencia: s.tendencia,
      razon: s.saturacionHistorica > 90
        ? 'Casi siempre al límite de capacidad, muy probable que no consigas cupo'
        : 'Alta demanda histórica, difícil encontrar disponibilidad',
    }));

  const alAlza = slots
    .filter(s => s.tendencia === 'subiendo' && s.clasificacion === 'valle')
    .sort((a, b) => b.saturacionHistorica - a.saturacionHistorica);

  const resultado = {
    semanaAnalizada: inicioSemana.toISOString().slice(0, 10),
    periodoHistorial: '90 dias',
    totalSlotsAnalizados: slots.length,
    mejoresMomentos,
    evitando,
  };
  if (preferenciasUsuario) resultado.perfilUsuario = preferenciasUsuario;
  if (alAlza.length > 0) {
    resultado.conTendenciaAlza = alAlza.slice(0, 3).map(s => ({
      dia: s.dia, horaInicio: s.horaInicio, saturacionHistorica: s.saturacionHistorica,
      sugerencia: 'Este horario aún tiene baja saturación pero está en aumento. Reserva con anticipación.',
    }));
  }
  return resultado;
}

async function resumen(fecha) {
  const minutosAnticipacionReserva = await leerConfigConDefault(
    'anticipacion_reserva_min',
    30,
    'Minutos minimos de anticipacion para crear reserva'
  );
  const inicio = parseMonday(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 5);
  const inicioAnterior = new Date(inicio);
  inicioAnterior.setDate(inicioAnterior.getDate() - 7);
  const finAnterior = new Date(inicioAnterior);
  finAnterior.setDate(inicioAnterior.getDate() + 5);

  const [franjas, franjasAnteriores] = await withTimeout(Promise.all([
    prisma.franja.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      include: { plantilla: true, reservas: { select: { estado: true } } },
    }),
    prisma.franja.findMany({
      where: { fecha: { gte: inicioAnterior, lt: finAnterior } },
      include: { plantilla: true, reservas: { select: { estado: true } } },
    }),
  ]));

   const ahora = new Date();
   function filtrarVigentes(lista, refAhora = ahora) {
     return lista.filter(f => {
       const inicioF = inicioFranjaBogota(f.fecha, f.plantilla.horaInicio);
       return refAhora < new Date(inicioF.getTime() - minutosAnticipacionReserva * 60000);
     });
   }

  function calcularMetricas(listaFranjas) {
    const capacidad = listaFranjas.reduce((acc, f) => acc + f.plantilla.capacidadMaxima, 0);
    const disponibles = listaFranjas.reduce((acc, f) => acc + f.cuposDisponibles, 0);
    let reservadas = 0, canceladas = 0, noShows = 0;
    for (const f of listaFranjas) {
      for (const r of f.reservas) {
        if (r.estado === 'activa') reservadas++;
        else if (r.estado === 'no_show') noShows++;
        else if (r.estado === 'cancelada') canceladas++;
      }
    }
    const alta = listaFranjas.filter(f => calcOcupacion(f.cuposDisponibles, f.plantilla.capacidadMaxima) >= 75).length;
    const media = listaFranjas.filter(f => { const o = calcOcupacion(f.cuposDisponibles, f.plantilla.capacidadMaxima); return o >= 40 && o < 75; }).length;
    const baja = listaFranjas.length - alta - media;
    const ocupacion = capacidad > 0 ? Math.round((reservadas / capacidad) * 100) : 0;
    const tasaNoShow = reservadas + noShows > 0 ? Math.round((noShows / (reservadas + noShows)) * 100) : 0;
    const horas = listaFranjas.map(f => ({ dia: f.plantilla.diaSemana, horaInicio: f.plantilla.horaInicio, saturacion: calcOcupacion(f.cuposDisponibles, f.plantilla.capacidadMaxima) }));
    const pico = horas.filter(h => h.saturacion >= 75).sort((a, b) => b.saturacion - a.saturacion).slice(0, 3);
    const valle = horas.filter(h => h.saturacion < 25).sort((a, b) => a.saturacion - b.saturacion).slice(0, 3);
    return { capacidad, disponibles, reservadas, canceladas, noShows, ocupacion, tasaNoShow, alta, media, baja, total: listaFranjas.length, pico, valle };
  }

  const vigentes = filtrarVigentes(franjas);
  const ahoraSemanaAnterior = new Date(ahora);
  ahoraSemanaAnterior.setDate(ahoraSemanaAnterior.getDate() - 7);
  const vigentesAnteriores = filtrarVigentes(franjasAnteriores, ahoraSemanaAnterior);
  const actual = calcularMetricas(vigentes);
  const anterior = calcularMetricas(vigentesAnteriores);
  const diffOcupacion = actual.ocupacion - anterior.ocupacion;
  const tendenciaOcupacion = diffOcupacion > 5 ? 'subiendo' : diffOcupacion < -5 ? 'bajando' : 'estable';
  const cambioOcupacion = anterior.ocupacion > 0 ? `${diffOcupacion > 0 ? '+' : ''}${diffOcupacion}%` : 'sin dato previo';
  const diffNoShow = actual.tasaNoShow - anterior.tasaNoShow;

  const suspendidos = await prisma.suspension.count({ where: { activa: true, fechaFin: { gte: new Date() } } });

  return {
    semana: inicio.toISOString().slice(0, 10), totalCapacidad: actual.capacidad,
    totalDisponibles: actual.disponibles, totalReservadas: actual.reservadas,
    totalCanceladas: actual.canceladas, totalNoShow: actual.noShows,
    ocupacionPromedio: actual.ocupacion, tendenciaOcupacion, cambioVsSemanaAnterior: cambioOcupacion,
    cambioOcupacion: diffOcupacion, cambioNoShow: diffNoShow,
    saturacionAlta: actual.alta, saturacionMedia: actual.media, saturacionBaja: actual.baja,
    totalFranjas: actual.total, tasaNoShow: actual.tasaNoShow, suspendidos,
    horasPico: actual.pico, horasValle: actual.valle,
  };
}

async function analisis(tipo, fecha) {
  const ahora = new Date();
  const fechaRef = fecha ? new Date(`${fecha}T00:00:00`) : ahora;

  let inicio, fin, finAnterior;
  if (tipo === 'dia') {
    inicio = new Date(fechaRef);
    inicio.setHours(0, 0, 0, 0);
    fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    finAnterior = new Date(inicio);
    finAnterior.setDate(finAnterior.getDate() - 1);
  } else if (tipo === 'mes') {
    inicio = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1);
    fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    finAnterior = new Date(inicio);
    finAnterior.setMonth(finAnterior.getMonth() - 1);
  } else {
    inicio = parseMonday(fecha);
    fin = new Date(inicio);
    fin.setDate(fin.getDate() + 5);
    finAnterior = new Date(inicio);
    finAnterior.setDate(finAnterior.getDate() - 7);
  }

  const inicioAnterior = new Date(finAnterior);
  const finAnteriorCalc = new Date(tipo === 'semana' ? inicioAnterior : inicio);
  if (tipo === 'semana') finAnteriorCalc.setDate(finAnteriorCalc.getDate() + 5);
  const [franjas, franjasAnteriores] = await withTimeout(Promise.all([
    prisma.franja.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      include: { plantilla: true, reservas: { select: { estado: true } } },
      orderBy: { fecha: 'asc' },
    }),
    prisma.franja.findMany({
      where: { fecha: { gte: inicioAnterior, lt: finAnteriorCalc } },
      include: { plantilla: true, reservas: { select: { estado: true } } },
      orderBy: { fecha: 'asc' },
    }),
  ]));

  function procesarGrupo(lista) {
    let totalCapacidad = 0, totalDisponibles = 0, reservadas = 0, noShows = 0;
    const horas = {};
    for (const f of lista) {
      totalCapacidad += f.plantilla.capacidadMaxima;
      totalDisponibles += f.cuposDisponibles;
      for (const r of f.reservas) {
        if (r.estado === 'activa') reservadas++;
        else if (r.estado === 'no_show') noShows++;
      }
      const key = `${f.plantilla.diaSemana}_${f.plantilla.horaInicio}`;
      if (!horas[key]) horas[key] = { dia: f.plantilla.diaSemana, horaInicio: f.plantilla.horaInicio, total: 0, count: 0 };
      horas[key].total += calcOcupacion(f.cuposDisponibles, f.plantilla.capacidadMaxima) / 100;
      horas[key].count += 1;
    }
    const ocupacion = totalCapacidad > 0 ? Math.round((reservadas / totalCapacidad) * 100) : 0;
    const tasaNoShow = reservadas + noShows > 0 ? Math.round((noShows / (reservadas + noShows)) * 100) : 0;
    const pico = Object.values(horas).map(h => ({ dia: h.dia, horaInicio: h.horaInicio, saturacion: Math.round((h.total / h.count) * 100) }))
      .filter(h => h.saturacion >= 75).sort((a, b) => b.saturacion - a.saturacion).slice(0, 5);
    const valle = Object.values(horas).map(h => ({ dia: h.dia, horaInicio: h.horaInicio, saturacion: Math.round((h.total / h.count) * 100) }))
      .filter(h => h.saturacion < 25).sort((a, b) => a.saturacion - b.saturacion).slice(0, 5);
    return { capacidad: totalCapacidad, disponibles: totalDisponibles, reservadas, noShows, ocupacion, tasaNoShow, pico, valle };
  }

  const actual = procesarGrupo(franjas);
  const anterior = procesarGrupo(franjasAnteriores);

  const diffOcupacion = actual.ocupacion - anterior.ocupacion;
  const cambioStr = anterior.capacidad > 0 ? `${diffOcupacion > 0 ? '+' : ''}${diffOcupacion}%` : 'sin dato previo';

  const desglose = {};
  for (const f of franjas) {
    const diaSem = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][f.fecha.getUTCDay()];
    const clave = tipo === 'mes' ? `${f.fecha.getUTCFullYear()}-${String(f.fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(f.fecha.getUTCDate()).padStart(2, '0')}` : diaSem;
    if (!desglose[clave]) desglose[clave] = { periodo: clave, capacidad: 0, reservadas: 0, noShows: 0, franjas: 0 };
    desglose[clave].capacidad += f.plantilla.capacidadMaxima;
    desglose[clave].franjas += 1;
    for (const r of f.reservas) {
      if (r.estado === 'activa') desglose[clave].reservadas++;
      else if (r.estado === 'no_show') desglose[clave].noShows++;
    }
  }

  const desgloseArr = Object.values(desglose).map(d => ({
    periodo: d.periodo,
    capacidad: d.capacidad,
    reservadas: d.reservadas,
    ocupacion: d.capacidad > 0 ? Math.round((d.reservadas / d.capacidad) * 100) : 0,
    noShows: d.noShows,
    tasaNoShow: d.reservadas + d.noShows > 0 ? Math.round((d.noShows / (d.reservadas + d.noShows)) * 100) : 0,
    franjas: d.franjas,
  }));

  const labels = { dia: 'Día', semana: 'Semana', mes: 'Mes' };

  return {
    tipo,
    periodo: labels[tipo] || 'Semana',
    fechaConsulta: inicio.toISOString().slice(0, 10),
    resumen: {
      capacidad: actual.capacidad,
      disponibles: actual.disponibles,
      reservadas: actual.reservadas,
      ocupacionPromedio: actual.ocupacion,
      cambioPeriodoAnterior: cambioStr,
      tasaNoShow: actual.tasaNoShow,
    },
    horasPico: actual.pico,
    horasValle: actual.valle,
    desglose: desgloseArr,
  };
}

module.exports = { resumen, recomendaciones, analisis };
