require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function getLunes() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dia = lunes.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  lunes.setDate(lunes.getDate() + ajuste);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function semanasOffset(base, offset) {
  const r = new Date(base);
  r.setDate(r.getDate() + offset * 7);
  return r;
}

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const MAP_DIA = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4 };

function capacidadPorHora(hora) {
  if (hora < 8) return 15;
  if (hora < 12) return 20;
  if (hora < 13) return 25;
  if (hora < 18) return 20;
  return 15;
}

function buildFranjaMap(plantillas, franjas) {
  const map = {};
  for (const f of franjas) {
    const p = plantillas.find((pl) => pl.id === f.idPlantilla);
    if (!p) continue;
    const key = `${p.diaSemana}|${p.horaInicio}`;
    map[key] = f;
  }
  return map;
}

function buscarFranja(map, dia, horaInicio) {
  return map[`${dia}|${horaInicio}`];
}

async function crearReservaYAsistencia(idUsuario, idFranja, estado, registradoPor) {
  const reserva = await prisma.reserva.create({
    data: { idUsuario, idFranja, estado },
  });
  if (estado === 'completada') {
    await prisma.asistencia.create({
      data: {
        idReserva: reserva.id,
        registradoPor: registradoPor || 'ADM001',
        resultado: 'presente',
      },
    });
  }
  return reserva;
}

async function main() {
  const usuariosExistentes = await prisma.usuario.count();
  if (usuariosExistentes > 0) {
    console.log('[Seed] Limpiando datos existentes...');
    await prisma.asistencia.deleteMany();
    await prisma.reserva.deleteMany();
    await prisma.suspension.deleteMany();
    await prisma.franja.deleteMany();
    await prisma.plantillaFranja.deleteMany();
    await prisma.configuracion.deleteMany();
    await prisma.usuario.deleteMany();
    console.log('[Seed] Datos anteriores eliminados ✓');
  }

  const hash = await bcrypt.hash('password123', 10);

  // ──────────────────────────────────────────────
  // 1. USUARIOS — perfiles con personalidad
  // ──────────────────────────────────────────────
  await prisma.usuario.createMany({
    data: [
      { idInstitucional: 'EST001', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST002', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST003', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST004', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST005', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST006', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: 'EST007', rol: 'estudiante',    estado: 'activo', password: hash },
      { idInstitucional: '1103100844', rol: 'estudiante', estado: 'activo', password: hash },
      { idInstitucional: 'ADM001', rol: 'administrador', estado: 'activo', password: hash },
    ],
  });

  const EST = {
    CUMPLIDO: 'EST001',
    INFRACTOR: 'EST002',
    SUSPENDIDO: 'EST003',
    PUNTUAL: 'EST004',
    INDECISO: 'EST005',
    FRECUENTE: 'EST006',
    NUEVO: 'EST007',
    TEST: '1103100844',
  };

  console.log('[Seed] 9 usuarios creados ✓');

  // ──────────────────────────────────────────────
  // 2. CONFIGURACION
  // ──────────────────────────────────────────────
  const REGLAS = [
    { clave: 'limite_reservas_activas',     valor: '2',  descripcion: 'Max reservas activas simultaneas por usuario' },
    { clave: 'max_reservas_por_dia',         valor: '1',  descripcion: 'Max reservas activas por usuario en un mismo dia' },
    { clave: 'anticipacion_reserva_min',     valor: '30', descripcion: 'Minutos minimos de anticipacion para crear reserva' },
    { clave: 'anticipacion_cancelacion_min', valor: '15', descripcion: 'Minutos minimos de anticipacion para cancelar reserva' },
    { clave: 'umbral_noshow',                valor: '3',  descripcion: 'Inasistencias acumuladas que activan suspension' },
    { clave: 'ventana_checkin_min',          valor: '15', descripcion: 'Minutos desde inicio del turno para hacer check-in' },
    { clave: 'dias_suspension_por_noshow',   valor: '7',  descripcion: 'Dias de suspension automatica por alcanzar umbral de no_shows' },
  ];
  for (const r of REGLAS) {
    await prisma.configuracion.create({ data: r });
  }

  console.log('[Seed] 7 reglas de configuracion ✓');

  // ──────────────────────────────────────────────
  // 3. PLANTILLAS (capacidad variable)
  // ──────────────────────────────────────────────
  const plantillas = [];
  for (const dia of DIAS) {
    for (let hora = 6; hora <= 20; hora++) {
      plantillas.push(
        await prisma.plantillaFranja.create({
          data: {
            diaSemana: dia,
            horaInicio: `${String(hora).padStart(2, '0')}:00`,
            horaFin: `${String(hora + 1).padStart(2, '0')}:00`,
            capacidadMaxima: capacidadPorHora(hora),
            activa: true,
          },
        })
      );
    }
  }

  console.log(`[Seed] ${plantillas.length} plantillas (capacidad 15/20/25 segun horario) ✓`);

  // ──────────────────────────────────────────────
  // 4. FRANJAS (5 semanas: -3, -2, -1, 0, +1)
  // ──────────────────────────────────────────────
  const lunesBase = getLunes();
  const SEMANAS = [-3, -2, -1, 0, 1];
  const franjasMap = {};

  for (const offset of SEMANAS) {
    const lunesSemana = semanasOffset(lunesBase, offset);
    const lista = [];
    for (const p of plantillas) {
      const fecha = new Date(lunesSemana);
      fecha.setDate(lunesSemana.getDate() + MAP_DIA[p.diaSemana]);
      lista.push(
        await prisma.franja.create({
          data: {
            idPlantilla: p.id,
            fecha,
            semestre: '2026-1',
            cuposDisponibles: p.capacidadMaxima,
          },
        })
      );
    }
    franjasMap[offset] = buildFranjaMap(plantillas, lista);
  }

  console.log('[Seed] 5 semanas de franjas (pasado + actual + futuro) ✓');

  // ──────────────────────────────────────────────
  // 5. RESERVAS + ASISTENCIAS
  // ──────────────────────────────────────────────
  const F = franjasMap;

  // --- Semana -3 (tres semanas atras) ---
  await crearReservaYAsistencia(EST.CUMPLIDO,   buscarFranja(F[-3], 'lunes',    '08:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.CUMPLIDO,   buscarFranja(F[-3], 'miercoles','10:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-3], 'martes',   '14:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-3], 'jueves',   '07:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-3], 'lunes',    '09:00').id, 'cancelada');
  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-3], 'viernes',  '12:00').id, 'cancelada');

  // --- Semana -2 (dos semanas atras) ---
  await crearReservaYAsistencia(EST.CUMPLIDO,   buscarFranja(F[-2], 'martes',   '08:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.CUMPLIDO,   buscarFranja(F[-2], 'viernes',  '07:00').id, 'completada', 'ADM001');

  const noshow1 = await prisma.reserva.create({ data: { idUsuario: EST.INFRACTOR, idFranja: buscarFranja(F[-2], 'lunes', '07:00').id, estado: 'no_show' } });
  await prisma.asistencia.create({ data: { idReserva: noshow1.id, registradoPor: 'ADM001', resultado: 'no_show' } });
  const noshow2 = await prisma.reserva.create({ data: { idUsuario: EST.INFRACTOR, idFranja: buscarFranja(F[-2], 'miercoles', '10:00').id, estado: 'no_show' } });
  await prisma.asistencia.create({ data: { idReserva: noshow2.id, registradoPor: 'ADM001', resultado: 'no_show' } });

  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-2], 'lunes',    '14:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-2], 'miercoles','16:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-2], 'viernes',  '08:00').id, 'completada', 'ADM001');

  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-2], 'martes',   '10:00').id, 'cancelada');
  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-2], 'jueves',   '11:00').id, 'cancelada');

  for (const dia of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']) {
    await crearReservaYAsistencia(EST.FRECUENTE, buscarFranja(F[-2], dia, '08:00').id, 'completada', 'ADM001');
  }

  // --- Semana -1 (semana pasada) ---
  await crearReservaYAsistencia(EST.CUMPLIDO,   buscarFranja(F[-1], 'lunes',    '10:00').id, 'completada', 'ADM001');

  const noshow3 = await prisma.reserva.create({ data: { idUsuario: EST.INFRACTOR, idFranja: buscarFranja(F[-1], 'viernes', '14:00').id, estado: 'no_show' } });
  await prisma.asistencia.create({ data: { idReserva: noshow3.id, registradoPor: 'ADM001', resultado: 'no_show' } });

  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-1], 'martes',   '10:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.PUNTUAL,    buscarFranja(F[-1], 'miercoles','14:00').id, 'completada', 'ADM001');

  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-1], 'lunes',    '14:00').id, 'completada', 'ADM001');
  await crearReservaYAsistencia(EST.INDECISO,   buscarFranja(F[-1], 'miercoles','09:00').id, 'cancelada');

  for (const dia of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']) {
    await crearReservaYAsistencia(EST.FRECUENTE, buscarFranja(F[-1], dia, '10:00').id, 'completada', 'ADM001');
  }

  // --- Semana -2 — historico para EST008 (test) ---
  await crearReservaYAsistencia(EST.TEST, buscarFranja(F[-2], 'martes', '10:00').id, 'completada', 'ADM001');

  // --- Semana 0 (actual) — activas (si la franja aun no paso) ---
  for (const dia of ['martes', 'jueves']) {
    await prisma.reserva.create({
      data: { idUsuario: EST.CUMPLIDO, idFranja: buscarFranja(F[0], dia, '08:00').id, estado: 'activa' },
    });
  }
  await prisma.reserva.create({
    data: { idUsuario: EST.NUEVO, idFranja: buscarFranja(F[0], 'miercoles', '10:00').id, estado: 'activa' },
  });
  await prisma.reserva.create({
    data: { idUsuario: EST.TEST, idFranja: buscarFranja(F[0], 'jueves', '14:00').id, estado: 'activa' },
  });

  // --- Semana +1 (proxima) — activas futuras ---
  await prisma.reserva.create({
    data: { idUsuario: EST.CUMPLIDO,  idFranja: buscarFranja(F[1], 'lunes', '09:00').id, estado: 'activa' },
  });
  await prisma.reserva.create({
    data: { idUsuario: EST.FRECUENTE, idFranja: buscarFranja(F[1], 'miercoles', '11:00').id, estado: 'activa' },
  });
  await prisma.reserva.create({
    data: { idUsuario: EST.NUEVO,     idFranja: buscarFranja(F[1], 'viernes', '08:00').id, estado: 'activa' },
  });

  console.log('[Seed] Reservas historicas + activas creadas ✓');

  // ──────────────────────────────────────────────
  // 6. SUSPENSIONES
  // ──────────────────────────────────────────────
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);

  const enUnMes = new Date();
  enUnMes.setMonth(enUnMes.getMonth() + 1);

  const finSuspensionNoShow = new Date();
  finSuspensionNoShow.setDate(finSuspensionNoShow.getDate() + 7);

  // EST002 — suspension automatica por 3 no-shows
  await prisma.suspension.create({
    data: {
      idUsuario: EST.INFRACTOR,
      fechaInicio: ayer,
      fechaFin: finSuspensionNoShow,
      motivo: 'Suspension automatica por alcanzar 3 inasistencias (no-show)',
      activa: true,
    },
  });

  // EST003 — suspension manual por administrador
  await prisma.suspension.create({
    data: {
      idUsuario: EST.SUSPENDIDO,
      fechaInicio: semanasOffset(lunesBase, -1),
      fechaFin: enUnMes,
      motivo: 'Suspension manual por incumplimiento reiterado de normas del gimnasio',
      activa: true,
      levantadaPor: 'ADM001',
    },
  });

  console.log('[Seed] Suspensiones: EST002 (no-shows) + EST003 (manual) ✓');

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  Seed completado exitosamente');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('  Usuarios creados:');
  console.log('    EST001  El cumplido   — historial limpio, asiste siempre');
  console.log('    EST002  El infractor  — 3 no-shows → suspendido');
  console.log('    EST003  El suspendido — suspension manual activa');
  console.log('    EST004  El puntual    — 8 check-ins historicos');
  console.log('    EST005  El indeciso   — 4 cancelaciones, 1 asistencia');
  console.log('    EST006  El frecuente  — 10 check-ins, reserva futura');
    console.log('    EST007  El nuevo      — sin historial, 2 activas futuras');
    console.log('    1103100844  Dev         — 1 check-in historico + 1 activa semanal');
    console.log('    ADM001  Administrador');
    console.log('');
    console.log('  Todos los estudiantes usan password: password123');
    console.log('  (1103100844 tambien usa password123)');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((error) => {
    console.error('Seed fallo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
