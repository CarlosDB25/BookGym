const router = require('express').Router();
const controller = require('./metricas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

/**
 * @openapi
 * /api/metricas/recomendaciones:
 *   get:
 *     tags:
 *       - Metricas
 *     summary: Obtener recomendaciones de franjas con menor saturacion historica
 *     description: Endpoint para estudiantes. Retorna franjas ordenadas de menor a mayor saturacion historica, calculada sobre los ultimos 90 dias, excluyendo reservas canceladas. Cada franja se clasifica como 'pico' (>80% ocupacion) o 'valle' (<=80%).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de franjas recomendadas ordenadas por saturacion ascendente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dia:
 *                     type: string
 *                     enum: [lunes, martes, miercoles, jueves, viernes]
 *                     example: martes
 *                   horaInicio:
 *                     type: string
 *                     example: "14:00"
 *                   saturacion:
 *                     type: integer
 *                     example: 12
 *                   clasificacion:
 *                     type: string
 *                     enum: [pico, valle]
 *                     example: valle
 *                   ocurrencias:
 *                     type: integer
 *                     example: 10
 *             examples:
 *               ok:
 *                 value:
 *                   - dia: martes
 *                     horaInicio: "14:00"
 *                     saturacion: 12
 *                     clasificacion: valle
 *                     ocurrencias: 10
 *                   - dia: jueves
 *                     horaInicio: "09:00"
 *                     saturacion: 25
 *                     clasificacion: valle
 *                     ocurrencias: 8
 *                   - dia: lunes
 *                     horaInicio: "18:00"
 *                     saturacion: 85
 *                     clasificacion: pico
 *                     ocurrencias: 12
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/recomendaciones', verificarToken, controller.recomendaciones);

router.use(verificarToken, soloAdmin);
/**
 * @openapi
 * /api/metricas/resumen:
 *   get:
 *     tags:
 *       - Metricas
 *     summary: Obtener resumen semanal de capacidad y ocupacion
 *     description: Endpoint exclusivo de administradores para monitorear ocupacion y saturacion semanal sobre franjas vigentes (excluye franjas pasadas y reservas canceladas).
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
