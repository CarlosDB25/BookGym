const router = require('express').Router();
const controller = require('./configuracion.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);

/**
 * @openapi
 * /api/configuracion/reglas-reserva:
 *   get:
 *     tags:
 *       - Sistema
 *     summary: Obtener reglas operativas de reservas
 *     description: Entrega limites y ventanas de tiempo configuradas en base de datos para reservas/cancelaciones.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reglas de negocio vigentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limiteReservasActivas:
 *                   type: integer
 *                   example: 2
 *                 maxReservasPorDia:
 *                   type: integer
 *                   example: 1
 *                 anticipacionReservaMin:
 *                   type: integer
 *                   example: 30
 *                 anticipacionCancelacionMin:
 *                   type: integer
 *                   example: 15
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error interno
 */
router.get('/reglas-reserva', controller.reglasReserva);

module.exports = router;
