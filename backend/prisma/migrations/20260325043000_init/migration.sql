-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('estudiante', 'administrador');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('activo', 'suspendido');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('activa', 'cancelada');

-- CreateEnum
CREATE TYPE "Resultado" AS ENUM ('presente', 'no_show');

-- CreateTable
CREATE TABLE "usuario" (
    "id_institucional" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'activo',
    "password" TEXT NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_institucional")
);

-- CreateTable
CREATE TABLE "plantilla_franja" (
    "id" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "capacidadMaxima" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plantilla_franja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franja" (
    "id" TEXT NOT NULL,
    "idPlantilla" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "semestre" TEXT NOT NULL,
    "cuposDisponibles" INTEGER NOT NULL,

    CONSTRAINT "franja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "idFranja" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'activa',

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencia" (
    "id" TEXT NOT NULL,
    "idReserva" TEXT NOT NULL,
    "registradoPor" TEXT NOT NULL,
    "resultado" "Resultado" NOT NULL,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspension" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "levantadaPor" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "suspension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_idReserva_key" ON "asistencia"("idReserva");

-- AddForeignKey
ALTER TABLE "franja" ADD CONSTRAINT "franja_idPlantilla_fkey" FOREIGN KEY ("idPlantilla") REFERENCES "plantilla_franja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuario"("id_institucional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_idFranja_fkey" FOREIGN KEY ("idFranja") REFERENCES "franja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_idReserva_fkey" FOREIGN KEY ("idReserva") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_registradoPor_fkey" FOREIGN KEY ("registradoPor") REFERENCES "usuario"("id_institucional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspension" ADD CONSTRAINT "suspension_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuario"("id_institucional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspension" ADD CONSTRAINT "suspension_levantadaPor_fkey" FOREIGN KEY ("levantadaPor") REFERENCES "usuario"("id_institucional") ON DELETE SET NULL ON UPDATE CASCADE;

