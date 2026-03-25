const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const usuariosExistentes = await prisma.usuario.count();
  if (usuariosExistentes > 0) {
    console.log('Seed omitido: la base ya contiene datos iniciales.');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.usuario.createMany({
    data: [
      { idInstitucional: 'EST001', rol: 'estudiante', estado: 'activo', password: passwordHash },
      { idInstitucional: 'ADM001', rol: 'administrador', estado: 'activo', password: passwordHash },
    ],
  });

  await prisma.configuracion.createMany({
    data: [
      {
        clave: 'limite_reservas_activas',
        valor: '2',
        descripcion: 'Max reservas activas simultaneas por usuario',
      },
      {
        clave: 'max_reservas_por_dia',
        valor: '1',
        descripcion: 'Max reservas activas por usuario en un mismo dia',
      },
      {
        clave: 'anticipacion_reserva_min',
        valor: '30',
        descripcion: 'Minutos minimos de anticipacion para crear reserva',
      },
      {
        clave: 'anticipacion_cancelacion_min',
        valor: '15',
        descripcion: 'Minutos minimos de anticipacion para cancelar reserva',
      },
      {
        clave: 'umbral_noshow',
        valor: '3',
        descripcion: 'Inasistencias acumuladas que activan suspension',
      },
      {
        clave: 'ventana_checkin_min',
        valor: '15',
        descripcion: 'Minutos desde inicio del turno para hacer check-in',
      },
    ],
  });

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const horas = Array.from({ length: 15 }, (_, i) => i + 6);
  const plantillas = [];

  for (const dia of dias) {
    for (const hora of horas) {
      const p = await prisma.plantillaFranja.create({
        data: {
          diaSemana: dia,
          horaInicio: `${String(hora).padStart(2, '0')}:00`,
          horaFin: `${String(hora + 1).padStart(2, '0')}:00`,
          capacidadMaxima: 20,
          activa: true,
        },
      });

      plantillas.push(p);
    }
  }

  const hoy = new Date();
  const lunes = new Date(hoy);
  const dia = lunes.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  lunes.setDate(lunes.getDate() + ajuste);
  lunes.setHours(0, 0, 0, 0);

  const mapDia = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4 };

  for (const plantilla of plantillas) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + mapDia[plantilla.diaSemana]);

    await prisma.franja.create({
      data: {
        idPlantilla: plantilla.id,
        fecha,
        semestre: '2026-1',
        cuposDisponibles: plantilla.capacidadMaxima,
      },
    });
  }

  console.log('Seed completado.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
