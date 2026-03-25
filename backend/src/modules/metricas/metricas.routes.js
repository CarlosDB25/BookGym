const router = require('express').Router();
const controller = require('./metricas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);
/**
 * @openapi
 * /api/metricas/resumen:
 *   get:
 *     tags:
 *       - Metricas
 *     summary: Obtener resumen semanal de capacidad y ocupacion
 *     description: Endpoint exclusivo de administradores para monitorear ocupacion y saturacion semanal.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-23
 *         description: Lunes de la semana en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Resumen calculado sobre franjas de la semana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metricas:
 *                   $ref: '#/components/schemas/MetricasResumen'
 *             examples:
 *               ok:
 *                 value:
 *                   metricas:
 *                     semana: 2026-03-23
 *                     totalCapacidad: 1500
 *                     totalDisponibles: 1320
 *                     totalReservadas: 180
 *                     ocupacionPromedio: 12
 *                     saturacionAlta: 3
 *                     saturacionMedia: 11
 *                     saturacionBaja: 61
 *                     totalFranjas: 75
 *       400:
 *         description: Parametro de fecha invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/resumen', controller.resumen);

module.exports = router;
