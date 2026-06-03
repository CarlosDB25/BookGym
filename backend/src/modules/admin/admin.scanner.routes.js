const router = require('express').Router();
const controller = require('./admin.scanner.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);

/**
 * @openapi
 * /api/admin/scanner/verificar/{cedula}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Verificar estado de estudiante por cedula
 *     description: >
 *       Endpoint para el escaner de codigo de barras.
 *       Recibe una cedula, busca al estudiante y retorna su estado operativo:
 *       SUSPENDIDO, RESERVA_ENCONTRADA o SIN_RESERVA.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cedula
 *         required: true
 *         schema:
 *           type: string
 *         description: Numero de identificacion (cedula) del estudiante
 *         example: EST001
 *     responses:
 *       200:
 *         description: Resultado de la verificacion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: string
 *                   enum: [SUSPENDIDO, RESERVA_ENCONTRADA, SIN_RESERVA]
 *                   description: Estado operativo del estudiante
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     rol:
 *                       type: string
 *                     estado:
 *                       type: string
 *                 suspension:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fechaInicio:
 *                       type: string
 *                       format: date-time
 *                     fechaFin:
 *                       type: string
 *                       format: date-time
 *                     motivo:
 *                       type: string
 *                   description: Solo presente cuando estado es SUSPENDIDO
 *                 reserva:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     franja:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         fecha:
 *                           type: string
 *                           format: date
 *                         horaInicio:
 *                           type: string
 *                         horaFin:
 *                           type: string
 *                         diaSemana:
 *                           type: string
 *                   description: Solo presente cuando estado es RESERVA_ENCONTRADA
 *                 mensaje:
 *                   type: string
 *                   description: Solo presente cuando estado es SIN_RESERVA
 *             examples:
 *               suspendido:
 *                 summary: Estudiante suspendido
 *                 value:
 *                   estado: SUSPENDIDO
 *                   usuario:
 *                     id: EST001
 *                     rol: estudiante
 *                     estado: activo
 *                   suspension:
 *                     id: uuid
 *                     fechaInicio: 2026-06-01T00:00:00.000Z
 *                     fechaFin: 2026-06-08T00:00:00.000Z
 *                     motivo: Inasistencias reiteradas
 *               reservaEncontrada:
 *                 summary: Reserva activa en ventana de check-in
 *                 value:
 *                   estado: RESERVA_ENCONTRADA
 *                   usuario:
 *                     id: EST001
 *                     rol: estudiante
 *                     estado: activo
 *                   reserva:
 *                     id: uuid
 *                     franja:
 *                       id: uuid
 *                       fecha: 2026-06-03
 *                       horaInicio: '08:00'
 *                       horaFin: '09:00'
 *                       diaSemana: miercoles
 *               sinReserva:
 *                 summary: Sin reserva activa para el horario actual
 *                 value:
 *                   estado: SIN_RESERVA
 *                   usuario:
 *                     id: EST001
 *                     rol: estudiante
 *                     estado: activo
 *                   mensaje: El estudiante no tiene reserva para la franja actual. Requiere ingreso manual/sobrecupo.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Estudiante no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verificar/:cedula', controller.verificar);

module.exports = router;
