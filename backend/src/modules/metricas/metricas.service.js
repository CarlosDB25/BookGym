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
  const hace30 = new Date(ahora);
  hace30.setDate(hace30.getDate() - 30);
  const hace60 = new Date(ahora);
  hace60.setDate(hace60.getDate() - 60);

  const proximasFechas = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (proximasFechas.length < 5) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      proximasFechas.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const minProxima = proximasFechas[0];
  const maxProxima = new Date(proximasFechas[proximasFechas.length - 1]);
  maxProxima.setDate(maxProxima.getDate() + 1);

  const [franjasHistoricas, franjasFuturas, reservasUsuario] = await withTimeout(Promise.all([
    prisma.franja.findMany({
      where: { fecha: { gte: inicioHistorial, lt: ahora } },
      include: {
        plantilla: true,
        reservas: {
          where: { estado: { not: 'cancelada' } },
          select: { id: true, estado: true, idUsuario: true, asistencia: { select: { resultado: true } } },
        },
      },
    }),
    prisma.franja.findMany({
      where: {
        fecha: { gte: minProxima, lt: maxProxima },
        plantilla: { activa: true },
      },
      include: {
        plantilla: true,
        reservas: { where: { estado: { not: 'cancelada' } }, select: { id: true } },
      },
      orderBy: [{ fecha: 'asc' }, { plantilla: { horaInicio: 'asc' } }],
    }),
    usuarioId
      ? prisma.reserva.findMany({
          where: { idUsuario: usuarioId },
          include: {
            franja: { include: { plantilla: true } },
            asistencia: { select: { resultado: true } },
          },
          orderBy: { fechaCreacion: 'desc' },
        })
      : Promise.resolve([]),
  ]));

  const slotStats = {};
  for (const f of franjasHistoricas) {
    const key = `${f.plantilla.diaSemana}_${f.plantilla.horaInicio}`;
    if (!slotStats[key]) {
      slotStats[key] = {
        key,
        dia: f.plantilla.diaSemana,
        horaInicio: f.plantilla.horaInicio,
        capacidad: f.plantilla.capacidadMaxima,
        ocurrencias: 0,
        totalReservas: 0,
        completadas: 0,
        noShows: 0,
        capacidadHistorica: 0,
        reservadasHistoricas: 0,
        ultimas30_ocurrencias: 0,
        ultimas30_reservadas: 0,
      };
    }
    const s = slotStats[key];
    s.ocurrencias += 1;
    s.capacidadHistorica += f.plantilla.capacidadMaxima;
    s.reservadasHistoricas += f.reservas.length;
    for (const r of f.reservas) {
      s.totalReservas += 1;
      if (r.estado === 'completada' || r.asistencia?.resultado === 'presente') s.completadas += 1;
      else if (r.estado === 'no_show' || r.asistencia?.resultado === 'no_show') s.noShows += 1;
    }
    if (f.fecha >= hace30) {
      s.ultimas30_ocurrencias += 1;
      s.ultimas30_reservadas += f.reservas.length;
    }
  }

  let perfilUsuario = null;
  if (usuarioId && reservasUsuario.length > 0) {
    const total = reservasUsuario.length;
    const completadas = reservasUsuario.filter((r) => r.estado === 'completada' || r.asistencia?.resultado === 'presente').length;
    const noShows = reservasUsuario.filter((r) => r.estado === 'no_show' || r.asistencia?.resultado === 'no_show').length;
    const canceladas = reservasUsuario.filter((r) => r.estado === 'cancelada').length;

    const diaFreq = {};
    const horaFreq = {};
    const slotFreq = {};
    for (const r of reservasUsuario) {
      if (r.estado === 'cancelada') continue;
      const dia = r.franja.plantilla.diaSemana;
      const hora = r.franja.plantilla.horaInicio;
      const slot = `${dia}_${hora}`;
      diaFreq[dia] = (diaFreq[dia] || 0) + 1;
      horaFreq[hora] = (horaFreq[hora] || 0) + 1;
      slotFreq[slot] = (slotFreq[slot] || 0) + 1;
    }

    const diasOrdenados = Object.entries(diaFreq).sort((a, b) => b[1] - a[1]);
    const horasOrdenadas = Object.entries(horaFreq).sort((a, b) => b[1] - a[1]);
    const slotsOrdenados = Object.entries(slotFreq).sort((a, b) => b[1] - a[1]);

    const noShowPorHora = {};
    for (const r of reservasUsuario) {
      if (r.estado === 'no_show' || r.asistencia?.resultado === 'no_show') {
        const h = r.franja.plantilla.horaInicio;
        noShowPorHora[h] = (noShowPorHora[h] || 0) + 1;
      }
    }

    perfilUsuario = {
      totalReservas: total,
      completadas,
      noShows,
      canceladas,
      tasaAsistencia: total > 0 ? Math.round((completadas / total) * 100) : 0,
      tasaNoShow: total > 0 ? Math.round((noShows / total) * 100) : 0,
      diaFavorito: diasOrdenados[0]?.[0] || null,
      diaFavoritoPct: diasOrdenados[0] ? Math.round((diasOrdenados[0][1] / total) * 100) : 0,
      horaFavorita: horasOrdenadas[0]?.[0] || null,
      horaFavoritaPct: horasOrdenadas[0] ? Math.round((horasOrdenadas[0][1] / total) * 100) : 0,
      slotFavorito: slotsOrdenados[0]?.[0] || null,
      slotFavoritoVeces: slotsOrdenados[0]?.[1] || 0,
      diasFrecuentes: diasOrdenados.slice(0, 3).map(([d, c]) => ({ dia: d, count: c, pct: Math.round((c / total) * 100) })),
      horasFrecuentes: horasOrdenadas.slice(0, 3).map(([h, c]) => ({ hora: h, count: c, pct: Math.round((c / total) * 100) })),
      slotsFrecuentes: slotsOrdenados.slice(0, 5).map(([s, c]) => ({ slot: s, count: c })),
      horasConNoShow: Object.entries(noShowPorHora).map(([h, c]) => ({ hora: h, noShows: c })),
      historialRelevante: total,
    };
  }

  function scoreFranja(franja) {
    const key = `${franja.plantilla.diaSemana}_${franja.plantilla.horaInicio}`;
    const stat = slotStats[key];
    const libres = franja.plantilla.capacidadMaxima - franja.reservas.length;

    let score = 0;
    let razones = [];
    let penalizaciones = [];

    if (perfilUsuario) {
      const diaCount = (perfilUsuario.diasFrecuentes.find((d) => d.dia === franja.plantilla.diaSemana)?.count) || 0;
      const diaPct = perfilUsuario.totalReservas > 0 ? diaCount / perfilUsuario.totalReservas : 0;
      const diaPuntos = Math.round(diaPct * 30);
      score += diaPuntos;
      if (diaPuntos >= 15) razones.push(`Sueles reservar los ${franja.plantilla.diaSemana} (${Math.round(diaPct * 100)}% de tu historial)`);

      const horaCount = (perfilUsuario.horasFrecuentes.find((h) => h.hora === franja.plantilla.horaInicio)?.count) || 0;
      const horaPct = perfilUsuario.totalReservas > 0 ? horaCount / perfilUsuario.totalReservas : 0;
      const horaPuntos = Math.round(horaPct * 30);
      score += horaPuntos;
      if (horaPuntos >= 15) razones.push(`Las ${franja.plantilla.horaInicio} es tu hora habitual (${Math.round(horaPct * 100)}% de tus reservas)`);

      const slotCount = (perfilUsuario.slotsFrecuentes.find((s) => s.slot === key)?.count) || 0;
      if (slotCount >= 2) {
        const bonus = Math.min(20, slotCount * 7);
        score += bonus;
        razones.push(`Has reservado este horario ${slotCount} veces antes`);
      } else if (slotCount === 1) {
        score += 5;
        razones.push(`Ya probaste este horario antes`);
      }

      const noShowEnHora = perfilUsuario.horasConNoShow.find((h) => h.hora === franja.plantilla.horaInicio);
      if (noShowEnHora) {
        const penal = noShowEnHora.noShows * 5;
        score -= penal;
        penalizaciones.push(`Tienes ${noShowEnHora.noShows} no-show(s) a esta hora`);
      }
    }

    if (stat) {
      const ocupacionHistorica = stat.capacidadHistorica > 0
        ? stat.reservadasHistoricas / stat.capacidadHistorica
        : 0;
      const ocupacionPct = Math.round(ocupacionHistorica * 100);
      const ocupacionPuntos = Math.round((1 - ocupacionHistorica) * 15);
      score += ocupacionPuntos;
      if (ocupacionHistorica < 0.4) razones.push(`Ocupación histórica baja: ${ocupacionPct}%`);
      else if (ocupacionHistorica >= 0.85) penalizaciones.push(`Casi siempre lleno: ${ocupacionPct}% de ocupación`);

      if (stat.totalReservas > 0) {
        const tasaAsistenciaSlot = stat.completadas / stat.totalReservas;
        if (tasaAsistenciaSlot >= 0.9) {
          score += 3;
          razones.push(`Alta tasa de asistencia: ${Math.round(tasaAsistenciaSlot * 100)}%`);
        }
      }

      if (stat.ultimas30_ocurrencias > 0) {
        const ocupacionReciente = stat.ultimas30_reservadas / (stat.ultimas30_ocurrencias * stat.capacidad);
        if (ocupacionReciente < ocupacionHistorica - 0.15) {
          razones.push('Tendencia a bajar: cada vez hay más espacio');
          score += 4;
        } else if (ocupacionReciente > ocupacionHistorica + 0.15) {
          penalizaciones.push('Tendencia a subir: reserva pronto');
          score -= 3;
        }
      }
    }

    if (libres <= 0) {
      score = -100;
      penalizaciones.push('Sin cupos disponibles');
    } else {
      const capacidadFrac = libres / franja.plantilla.capacidadMaxima;
      const capPuntos = Math.round(capacidadFrac * 10);
      score += capPuntos;
      if (capPuntos >= 7) razones.push(`${libres} cupos disponibles de ${franja.plantilla.capacidadMaxima}`);
    }

    let afinidad = 'nueva';
    if (perfilUsuario) {
      const slotCount = (perfilUsuario.slotsFrecuentes.find((s) => s.slot === key)?.count) || 0;
      const diaCount = (perfilUsuario.diasFrecuentes.find((d) => d.dia === franja.plantilla.diaSemana)?.count) || 0;
      const horaCount = (perfilUsuario.horasFrecuentes.find((h) => h.hora === franja.plantilla.horaInicio)?.count) || 0;
      if (slotCount >= 2 || (diaCount >= 2 && horaCount >= 2)) afinidad = 'alta';
      else if (diaCount >= 1 || horaCount >= 1) afinidad = 'media';
    }

    return { score, razones, penalizaciones, afinidad, ocupacionHistorica: stat ? Math.round((stat.reservadasHistoricas / Math.max(1, stat.capacidadHistorica)) * 100) : null };
  }

  const franjasEvaluadas = franjasFuturas
    .filter((f) => {
      const inicioTurno = inicioFranjaBogota(f.fecha, f.plantilla.horaInicio);
      const limiteReserva = new Date(inicioTurno.getTime() - 30 * 60 * 1000);
      return ahora < limiteReserva;
    })
    .map((f) => {
      const { score, razones, penalizaciones, afinidad, ocupacionHistorica } = scoreFranja(f);
      return {
        id: f.id,
        fecha: f.fecha.toISOString().slice(0, 10),
        dia: f.plantilla.diaSemana,
        horaInicio: f.plantilla.horaInicio,
        horaFin: f.plantilla.horaFin,
        cuposRestantes: f.plantilla.capacidadMaxima - f.reservas.length,
        capacidadMaxima: f.plantilla.capacidadMaxima,
        score,
        afinidad,
        ocupacionHistorica,
        razones,
        penalizaciones,
      };
    });

  const mejoresMomentos = franjasEvaluadas
    .filter((f) => f.cuposRestantes > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((f) => {
      const razonPrincipal = f.razones[0] || `${f.cuposRestantes} cupos disponibles`;
      return {
        id: f.id,
        fecha: f.fecha,
        dia: f.dia,
        horaInicio: f.horaInicio,
        horaFin: f.horaFin,
        cuposRestantes: f.cuposRestantes,
        capacidadMaxima: f.capacidadMaxima,
        afinidad: f.afinidad,
        score: f.score,
        ocupacionHistorica: f.ocupacionHistorica,
        razon: razonPrincipal,
        todasRazones: f.razones,
        penalizaciones: f.penalizaciones,
      };
    });

  const slotKeysTop = new Set(mejoresMomentos.map((m) => `${m.dia}_${m.horaInicio}`));

  const evitando = Object.values(slotStats)
    .map((s) => {
      const libresPromedio = s.capacidad > 0
        ? Math.max(0, s.capacidad - (s.reservadasHistoricas / Math.max(1, s.ocurrencias)))
        : 0;
      return {
        dia: s.dia,
        horaInicio: s.horaInicio,
        ocupacionHistorica: Math.round((s.reservadasHistoricas / Math.max(1, s.capacidadHistorica)) * 100),
        tasaAsistencia: s.totalReservas > 0 ? Math.round((s.completadas / s.totalReservas) * 100) : null,
        razon: s.reservadasHistoricas / Math.max(1, s.capacidadHistorica) > 0.9
          ? `Ocupación histórica del ${Math.round((s.reservadasHistoricas / Math.max(1, s.capacidadHistorica)) * 100)}% — casi siempre lleno`
          : `Demanda alta y consistente: ${Math.round((s.reservadasHistoricas / Math.max(1, s.capacidadHistorica)) * 100)}% de ocupación`,
      };
    })
    .filter((s) => !slotKeysTop.has(`${s.dia}_${s.horaInicio}`))
    .sort((a, b) => b.ocupacionHistorica - a.ocupacionHistorica)
    .slice(0, 5);

  const resultado = {
    periodoAnalizado: {
      desde: minProxima.toISOString().slice(0, 10),
      hasta: maxProxima.toISOString().slice(0, 10),
      dias: 5,
    },
    periodoHistorial: 'ultimos 90 dias',
    totalFranjasAnalizadas: franjasEvaluadas.length,
    mejoresMomentos,
    evitando,
  };

  if (perfilUsuario) resultado.perfilUsuario = perfilUsuario;
  if (mejoresMomentos.length === 0) {
    resultado.mensaje = perfilUsuario
      ? 'No encontramos horarios que coincidan con tu perfil esta semana. Intenta explorar todas las franjas disponibles.'
      : 'Reserva algunas sesiones para recibir recomendaciones personalizadas basadas en tu historial.';
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
