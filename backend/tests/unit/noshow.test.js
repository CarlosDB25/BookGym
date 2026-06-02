const prisma = require('../../src/shared/prisma/client');
const { procesarNoShows } = require('../../src/scheduler/noshow.processor');

const TZ_OFFSET = '-05:00';
function makeFechaYMD(diasOffset, hora = '08:00') {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + diasOffset);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return {
    ymdDate: new Date(`${y}-${m}-${day}T00:00:00.000Z`),
    ymd: `${y}-${m}-${day}`,
    bogotaDate: new Date(`${y}-${m}-${day}T${hora}:00${TZ_OFFSET}`),
  };
}

async function crearUsuarioTest(id) {
  await prisma.usuario.upsert({
    where: { idInstitucional: id },
    update: {},
    create: { idInstitucional: id, rol: 'estudiante', estado: 'activo', password: 'test' },
  });
}

async function crearFranjaEnFecha(ymdDate, capacidadInicial = 5) {
  const plantilla = await prisma.plantillaFranja.findFirst({ where: { activa: true } });
  if (!plantilla) throw new Error('No hay plantillas en la BD');

  const ymdStr = ymdDate.toISOString().slice(0, 10);
  const existente = await prisma.franja.findFirst({
    where: { idPlantilla: plantilla.id, fecha: new Date(`${ymdStr}T00:00:00.000Z`) },
  });
  if (existente) {
    return await prisma.franja.update({
      where: { id: existente.id },
      data: { cuposDisponibles: capacidadInicial },
    });
  }
  return await prisma.franja.create({
    data: {
      idPlantilla: plantilla.id,
      fecha: new Date(`${ymdStr}T00:00:00.000Z`),
      semestre: 'test',
      cuposDisponibles: capacidadInicial,
    },
  });
}

async function crearReservaActiva(idUsuario, idFranja) {
  return prisma.reserva.create({
    data: { idUsuario, idFranja, estado: 'activa' },
  });
}

async function limpiarEstado(usuarios, franjasIds) {
  await prisma.suspension.deleteMany({ where: { idUsuario: { in: usuarios } } });
  await prisma.reserva.deleteMany({ where: { idUsuario: { in: usuarios } } });
  for (const fid of franjasIds) {
    await prisma.franja.deleteMany({ where: { id: fid, reservas: { none: {} } } });
  }
  for (const uid of usuarios) {
    await prisma.usuario.delete({ where: { idInstitucional: uid } }).catch(() => {});
  }
}

describe('No-Show Processor', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('carga el modulo y la funcion principal existe', () => {
    expect(typeof procesarNoShows).toBe('function');
  });

  test(
    'marca como no_show una reserva activa sin check-in en franja ya vencida',
    async () => {
      const uid = `NST${Date.now()}A`;
      const { ymdDate } = makeFechaYMD(-2, '08:00');
      const franja = await crearFranjaEnFecha(ymdDate, 5);
      await crearUsuarioTest(uid);
      const reserva = await crearReservaActiva(uid, franja.id);

      await procesarNoShows();

      const final = await prisma.reserva.findUnique({ where: { id: reserva.id } });
      expect(final.estado).toBe('no_show');

      await limpiarEstado([uid], [franja.id]);
    },
    30000
  );

  test(
    'idempotente: ejecutar dos veces no duplica el cambio de estado',
    async () => {
      const uid = `NST${Date.now()}B`;
      const { ymdDate } = makeFechaYMD(-3, '09:00');
      const franja = await crearFranjaEnFecha(ymdDate, 5);
      await crearUsuarioTest(uid);
      const reserva = await crearReservaActiva(uid, franja.id);

      await procesarNoShows();
      const primera = await prisma.reserva.findUnique({ where: { id: reserva.id } });
      expect(primera.estado).toBe('no_show');

      await procesarNoShows();
      const segunda = await prisma.reserva.findUnique({ where: { id: reserva.id } });
      expect(segunda.estado).toBe('no_show');

      const count = await prisma.reserva.count({
        where: { idUsuario: uid, estado: 'no_show' },
      });
      expect(count).toBe(1);

      await limpiarEstado([uid], [franja.id]);
    },
    30000
  );

  test(
    'no procesa reservas en franjas cuya ventana aun no cerro',
    async () => {
      const uid = `NST${Date.now()}C`;
      const { ymdDate } = makeFechaYMD(+5, '08:00');
      const franja = await crearFranjaEnFecha(ymdDate, 5);
      await crearUsuarioTest(uid);
      const reserva = await crearReservaActiva(uid, franja.id);

      await procesarNoShows();

      const final = await prisma.reserva.findUnique({ where: { id: reserva.id } });
      expect(final.estado).toBe('activa');

      await limpiarEstado([uid], [franja.id]);
    },
    30000
  );

  test(
    'al acumular no_shows >= umbral crea suspension y cancela reservas activas del usuario',
    async () => {
      const uid = `NST${Date.now()}D`;

      const { ymdDate: ymdPasado1 } = makeFechaYMD(-2, '10:00');
      const { ymdDate: ymdPasado2 } = makeFechaYMD(-2, '11:00');
      const { ymdDate: ymdPasado3 } = makeFechaYMD(-2, '12:00');
      const { ymdDate: ymdFuturo } = makeFechaYMD(+5, '08:00');

      const f1 = await crearFranjaEnFecha(ymdPasado1, 5);
      const f2 = await crearFranjaEnFecha(ymdPasado2, 5);
      const f3 = await crearFranjaEnFecha(ymdPasado3, 5);
      const fFuturo = await crearFranjaEnFecha(ymdFuturo, 5);

      await crearUsuarioTest(uid);
      const r1 = await crearReservaActiva(uid, f1.id);
      const r2 = await crearReservaActiva(uid, f2.id);
      const r3 = await crearReservaActiva(uid, f3.id);
      const r4 = await crearReservaActiva(uid, fFuturo.id);

      const cupoAntes = fFuturo.cuposDisponibles;

      await procesarNoShows();

      const [r1f, r2f, r3f, r4f] = await Promise.all([
        prisma.reserva.findUnique({ where: { id: r1.id } }),
        prisma.reserva.findUnique({ where: { id: r2.id } }),
        prisma.reserva.findUnique({ where: { id: r3.id } }),
        prisma.reserva.findUnique({ where: { id: r4.id } }),
      ]);

      expect(r1f.estado).toBe('no_show');
      expect(r2f.estado).toBe('no_show');
      expect(r3f.estado).toBe('no_show');
      expect(r4f.estado).toBe('cancelada');

      const suspension = await prisma.suspension.findFirst({
        where: { idUsuario: uid, activa: true },
      });
      expect(suspension).not.toBeNull();
      expect(suspension.motivo).toMatch(/3 inasistencias/);
      expect(suspension.fechaFin.getTime()).toBeGreaterThan(Date.now());

      const fFuturoFinal = await prisma.franja.findUnique({ where: { id: fFuturo.id } });
      expect(fFuturoFinal.cuposDisponibles).toBe(cupoAntes + 1);

      await limpiarEstado([uid], [f1.id, f2.id, f3.id, fFuturo.id]);
    },
    60000
  );

  test(
    'no suspende dos veces al mismo usuario si ya tiene suspension activa',
    async () => {
      const uid = `NST${Date.now()}E`;
      const { ymdDate: y1 } = makeFechaYMD(-2, '13:00');
      const { ymdDate: y2 } = makeFechaYMD(-2, '14:00');
      const { ymdDate: y3 } = makeFechaYMD(-2, '15:00');

      const f1 = await crearFranjaEnFecha(y1, 5);
      const f2 = await crearFranjaEnFecha(y2, 5);
      const f3 = await crearFranjaEnFecha(y3, 5);

      await crearUsuarioTest(uid);

      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 5);
      await prisma.suspension.create({
        data: {
          idUsuario: uid,
          fechaInicio,
          fechaFin,
          motivo: 'pre-existente',
          activa: true,
        },
      });

      await crearReservaActiva(uid, f1.id);
      await crearReservaActiva(uid, f2.id);
      await crearReservaActiva(uid, f3.id);

      await procesarNoShows();

      const suspensiones = await prisma.suspension.findMany({
        where: { idUsuario: uid, activa: true },
      });
      expect(suspensiones).toHaveLength(1);

      await limpiarEstado([uid], [f1.id, f2.id, f3.id]);
    },
    60000
  );
});
