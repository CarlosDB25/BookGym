const prisma = require('../shared/prisma/client');
const { Prisma } = require('@prisma/client');

function inicioFranjaBogota(fechaDate, horaInicio) {
  const y = fechaDate.getUTCFullYear();
  const m = String(fechaDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fechaDate.getUTCDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${horaInicio}:00-05:00`);
}

async function leerConfig(clave, defecto) {
  const fila = await prisma.configuracion.findUnique({ where: { clave } });
  if (!fila) return defecto;
  const parsed = parseInt(fila.valor, 10);
  return Number.isFinite(parsed) ? parsed : defecto;
}

async function asegurarConfig(clave, valorDefecto, descripcion) {
  const existe = await prisma.configuracion.findUnique({ where: { clave } });
  if (!existe) {
    await prisma.configuracion.create({
      data: { clave, valor: String(valorDefecto), descripcion },
    });
  }
}

async function cancelarReservasActivasDeUsuario(tx, idUsuario) {
  const reservas = await tx.reserva.findMany({
    where: { idUsuario, estado: 'activa' },
    select: { id: true, idFranja: true },
  });

  let cuposLiberados = 0;
  for (const r of reservas) {
    await tx.reserva.update({
      where: { id: r.id },
      data: { estado: 'cancelada' },
    });
    await tx.franja.update({
      where: { id: r.idFranja },
      data: { cuposDisponibles: { increment: 1 } },
    });
    cuposLiberados += 1;
  }
  return { reservasCanceladas: reservas.length, cuposLiberados };
}

async function aplicarSuspension(tx, idUsuario, motivo) {
  const dias = await leerConfig('dias_suspension_por_noshow', 7);
  const fechaInicio = new Date();
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + dias);

  const suspension = await tx.suspension.create({
    data: {
      idUsuario,
      fechaInicio,
      fechaFin,
      motivo,
      activa: true,
    },
  });

  const cascada = await cancelarReservasActivasDeUsuario(tx, idUsuario);

  return { suspension, fechaFin, dias, ...cascada };
}

async function procesarNoShows() {
  await asegurarConfig('ventana_checkin_min', 15, 'Minutos desde inicio del turno para hacer check-in');
  await asegurarConfig('umbral_noshow', 3, 'No_shows acumulados que activan suspension automatica');
  await asegurarConfig('dias_suspension_por_noshow', 7, 'Dias de suspension automatica por alcanzar umbral de inasistencias');

  const ventanaMin = await leerConfig('ventana_checkin_min', 15);
  const umbral = await leerConfig('umbral_noshow', 3);
  const ahora = new Date();

  const candidatas = await prisma.reserva.findMany({
    where: { estado: 'activa', asistencia: null },
    include: { franja: { include: { plantilla: true } } },
  });

  const vencidas = candidatas.filter((r) => {
    const inicioTurno = inicioFranjaBogota(r.franja.fecha, r.franja.plantilla.horaInicio);
    const cierreVentana = new Date(inicioTurno.getTime() + ventanaMin * 60 * 1000);
    return ahora > cierreVentana;
  });

  if (vencidas.length === 0) {
    console.log(`[NoShow] Sin reservas vencidas sin check-in (ventana_checkin_min=${ventanaMin})`);
    return { procesadas: 0, suspendidos: [] };
  }

  console.log(`[NoShow] ${vencidas.length} reservas activas sin check-in fuera de ventana`);

  const usuariosAfectados = new Set();
  const noShowsAplicados = [];

  for (const r of vencidas) {
    try {
      const update = await prisma.reserva.updateMany({
        where: { id: r.id, estado: 'activa', asistencia: null },
        data: { estado: 'no_show' },
      });
      if (update.count === 1) {
        noShowsAplicados.push(r);
        usuariosAfectados.add(r.idUsuario);
        const fechaStr = r.franja.fecha.toISOString().slice(0, 10);
        console.log(
          `[NoShow] reserva=${r.id} usuario=${r.idUsuario} franja=${fechaStr} ${r.franja.plantilla.horaInicio}-${r.franja.plantilla.horaFin} -> estado=no_show`
        );
      }
    } catch (error) {
      console.error(`[NoShow] error procesando reserva ${r.id}: ${error.message}`);
    }
  }

  if (noShowsAplicados.length === 0) {
    return { procesadas: 0, suspendidos: [] };
  }

  const suspendidos = [];

  for (const idUsuario of usuariosAfectados) {
    const totalNoShows = await prisma.reserva.count({
      where: { idUsuario, estado: 'no_show' },
    });

    if (totalNoShows < umbral) {
      console.log(
        `[NoShow] usuario=${idUsuario} totalNoShows=${totalNoShows} (umbral=${umbral}) -> no suspende aun`
      );
      continue;
    }

    const suspensionActiva = await prisma.suspension.findFirst({
      where: {
        idUsuario,
        activa: true,
        fechaFin: { gte: new Date() },
      },
    });

    if (suspensionActiva) {
      console.log(
        `[NoShow] usuario=${idUsuario} ya tiene suspension activa (id=${suspensionActiva.id}) -> se omite`
      );
      continue;
    }

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        return aplicarSuspension(tx, idUsuario, `Suspension automatica por ${totalNoShows} inasistencias (umbral ${umbral})`);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      suspendidos.push({
        idUsuario,
        totalNoShows,
        dias: resultado.dias,
        fechaFin: resultado.fechaFin,
        reservasCanceladas: resultado.reservasCanceladas,
        cuposLiberados: resultado.cuposLiberados,
      });

      console.log(
        `[AUDIT][NoShow] SUSPENSION usuario=${idUsuario} totalNoShows=${totalNoShows} dias=${resultado.dias} fechaFin=${resultado.fechaFin.toISOString()} reservasCanceladas=${resultado.reservasCanceladas} cuposLiberados=${resultado.cuposLiberados}`
      );
    } catch (error) {
      console.error(`[NoShow] error suspendiendo usuario ${idUsuario}: ${error.message}`);
    }
  }

  return { procesadas: noShowsAplicados.length, suspendidos };
}

module.exports = { procesarNoShows };
