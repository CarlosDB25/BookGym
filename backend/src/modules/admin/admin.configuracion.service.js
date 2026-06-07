const prisma = require('../../shared/prisma/client');

const DEFAULT_REGLAS = {
  limite_reservas_activas: {
    valor: 2,
    descripcion: 'Max reservas activas simultaneas por usuario',
  },
  max_reservas_por_dia: {
    valor: 1,
    descripcion: 'Max reservas activas por usuario en un mismo dia',
  },
  anticipacion_reserva_min: {
    valor: 30,
    descripcion: 'Minutos minimos de anticipacion para crear reserva',
  },
  anticipacion_cancelacion_min: {
    valor: 15,
    descripcion: 'Minutos minimos de anticipacion para cancelar reserva',
  },
  umbral_noshow: {
    valor: 3,
    descripcion: 'Inasistencias acumuladas que activan suspension',
  },
  ventana_checkin_min: {
    valor: 15,
    descripcion: 'Minutos desde inicio del turno para hacer check-in',
  },
  dias_suspension_por_noshow: {
    valor: 7,
    descripcion:
      'Dias de suspension automatica por alcanzar umbral de no_shows',
  },
};

async function actualizarReglas(datos, idAdmin) {
  const claves = Object.keys(datos);

  if (claves.length === 0) {
    throw Object.assign(
      new Error('Debe proporcionar al menos una regla para actualizar'),
      { status: 400 }
    );
  }

  const cambios = [];

  for (const clave of claves) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_REGLAS, clave)) {
      throw Object.assign(
        new Error(`Clave de configuracion no valida: ${clave}`),
        { status: 400 }
      );
    }

    const valor = Number(datos[clave]);
    if (!Number.isInteger(valor) || valor <= 0) {
      throw Object.assign(
        new Error(`El valor de ${clave} debe ser un entero positivo`),
        { status: 400 }
      );
    }

    const antes = await prisma.configuracion.findUnique({ where: { clave } });
    cambios.push({ clave, valorAnterior: antes?.valor || null, valorNuevo: String(valor) });

    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: String(valor) },
      create: {
        clave,
        valor: String(valor),
        descripcion: DEFAULT_REGLAS[clave].descripcion,
      },
    });
  }

  if (idAdmin && cambios.length > 0) {
    try {
      await prisma.auditLog.create({
        data: {
          accion: 'actualizar_config',
          entidad: 'configuracion',
          detalle: JSON.stringify(cambios),
          idUsuario: idAdmin,
        },
      });
    } catch (e) {
      console.error('No se pudo registrar audit log:', e.message);
    }
  }

  const filas = await prisma.configuracion.findMany({
    where: { clave: { in: Object.keys(DEFAULT_REGLAS) } },
    select: { clave: true, valor: true },
  });

  const valores = Object.fromEntries(
    filas.map((f) => [f.clave, parseInt(f.valor, 10)])
  );

  return {
    limiteReservasActivas: valores.limite_reservas_activas,
    maxReservasPorDia: valores.max_reservas_por_dia,
    anticipacionReservaMin: valores.anticipacion_reserva_min,
    anticipacionCancelacionMin: valores.anticipacion_cancelacion_min,
    umbralNoshow: valores.umbral_noshow,
    ventanaCheckinMin: valores.ventana_checkin_min,
    diasSuspensionPorNoshow: valores.dias_suspension_por_noshow,
  };
}

async function obtenerAuditLog(limite = 100, entidad = null) {
  try {
    const where = {};
    if (entidad) where.entidad = entidad;
    return await prisma.auditLog.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: limite,
    });
  } catch (e) {
    console.error('Error leyendo audit log:', e.message);
    return [];
  }
}

module.exports = { actualizarReglas, obtenerAuditLog };
