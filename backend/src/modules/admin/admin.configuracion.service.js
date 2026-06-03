const prisma = require('../../shared/prisma/client');
const configuracionService = require('../configuracion/configuracion.service');

async function actualizarReglas(datos) {
  const claves = Object.keys(datos);

  if (claves.length === 0) {
    throw Object.assign(
      new Error('Debe proporcionar al menos una regla para actualizar'),
      { status: 400 }
    );
  }

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

  return configuracionService.obtenerReglasReserva();
}

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

module.exports = { actualizarReglas };
