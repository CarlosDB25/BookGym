const router = require('express').Router();
const controller = require('./asistencia.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);

/**
 * @openapi
 * /api/reservas/{id}/check-in:
 *   post:
 *     tags:
 *       - Asistencia
 *     summary: Registrar check-in de una reserva
 *     description: >
 *       Registra la asistencia del usuario a una reserva activa.
 *       Valida que la reserva exista, pertenezca al usuario autenticado (o el usuario sea admin),
 *       este en estado activa y que la hora actual este dentro de la ventana de check-in configurada.
 *       Crea el registro en Asistencia y marca la reserva como completada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 867efc16-0b12-4b5a-ab5b-0390b4e14b3b
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Check-in registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 asistencia:
 *                   $ref: '#/components/schemas/Asistencia'
 *             examples:
 *               ok:
 *                 summary: Check-in exitoso
 *                 value:
 *                   mensaje: Check-in registrado exitosamente
 *                   asistencia:
 *                     id: b7f1a2c3-4d5e-6f7g-8h9i-0j1k2l3m4n5o
 *                     idReserva: 867efc16-0b12-4b5a-ab5b-0390b4e14b3b
 *                     registradoPor: EST001
 *                     resultado: presente
 *                     registradoEn: '2026-03-20T11:10:00.000Z'
 *       400:
 *         description: Error de validacion de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               estado:
 *                 summary: Reserva no activa
 *                 value:
 *                   error: La reserva no esta activa
 *               ventana:
 *                 summary: Fuera de ventana de check-in
 *                 value:
 *                   error: Check-in fuera de la ventana permitida
 *               duplicado:
 *                 summary: Check-in ya registrado
 *                 value:
 *                   error: Check-in ya fue registrado
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noAuth:
 *                 summary: Sin permisos
 *                 value:
 *                   error: No autorizado para registrar check-in de esta reserva
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noFound:
 *                 summary: Reserva inexistente
 *                 value:
 *                   error: Reserva no encontrada
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/check-in', controller.checkIn);

module.exports = router;
