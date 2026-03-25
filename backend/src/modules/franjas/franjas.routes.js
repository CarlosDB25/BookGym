const router = require('express').Router();
const controller = require('./franjas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);
/**
 * @openapi
 * /api/franjas/semana:
 *   get:
 *     tags:
 *       - Franjas
 *     summary: Obtener disponibilidad semanal
 *     description: Retorna franjas de la semana solicitada, excluyendo las franjas de fecha/hora ya vencidas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-23
 *         description: Fecha de lunes en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Lista de franjas con saturacion y cupos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 semana:
 *                   type: string
 *                   format: date
 *                 franjas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Franja'
 *             examples:
 *               ok:
 *                 value:
 *                   semana: 2026-03-23
 *                   franjas:
 *                     - id: db7f392c-add9-47b9-8b99-261ecd6d360c
 *                       fecha: '2026-03-24T00:00:00.000Z'
 *                       diaSemana: martes
 *                       horaInicio: '18:00'
 *                       horaFin: '19:00'
 *                       capacidadMaxima: 20
 *                       cuposDisponibles: 11
 *                       saturacion: media
 *       400:
 *         description: Error de validacion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               fecha:
 *                 value:
 *                   error: La fecha debe ser un lunes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/semana', controller.semana);

module.exports = router;
