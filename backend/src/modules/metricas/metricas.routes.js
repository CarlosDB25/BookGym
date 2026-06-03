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
 *     summary: Recomendaciones personalizadas de horarios con menor saturacion
 *     description: |
 *       Endpoint para estudiantes. Analiza el historial de los últimos 90 días y calcula:
 *       - **mejoresMomentos**: franjas con baja saturación histórica y cupos disponibles esta semana
 *       - **evitando**: franjas con alta saturación que probablemente no tengan cupo
 *       - **conTendenciaAlza**: franjas actualmente valle pero con ocupación en aumento
 *       Si el estudiante tiene reservas previas, ajusta la afinidad según sus horarios frecuentes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 20
 *         description: Cantidad máxima de recomendaciones a retornar
 *     responses:
 *       200:
 *         description: Recomendaciones calculadas con datos históricos y disponibilidad actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecomendacionResponse'
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
 *     summary: Panel ejecutivo semanal con métricas de ocupación y tendencias
 *     description: |
 *       Endpoint exclusivo de administradores. Proporciona un análisis completo de la semana actual:
 *       - Ocupación y capacidad vs semana anterior (tendencia)
 *       - Distribución de saturación (alta/media/baja)
 *       - Tasa de no-show
 *       - Horas pico (>= 75%) y horas valle (< 25%)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-06-01
 *         description: Lunes de la semana en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Métricas semanales enriquecidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricasResumen'
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

/**
 * @openapi
 * /api/metricas/analisis:
 *   get:
 *     tags:
 *       - Metricas
 *     summary: Análisis detallado por día, semana o mes (exclusivo admin)
 *     description: |
 *       Endpoint de análisis profundo para administradores.
 *       Agrupa métricas según el tipo solicitado:
 *       - **dia**: desglose horario de un día específico
 *       - **semana**: desglose por día de la semana
 *       - **mes**: desglose diario del mes completo
 *       Incluye comparación con el periodo anterior, horas pico/valle, y tasa de no-show.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: false
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes]
 *           default: semana
 *         description: Nivel de agregación (dia, semana o mes)
 *       - in: query
 *         name: fecha
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-06-01
 *         description: |
 *           Fecha de referencia en formato YYYY-MM-DD.
 *           - Para `dia`: el día específico
 *           - Para `semana`: cualquier día de la semana (se calcula el lunes)
 *           - Para `mes`: cualquier día del mes
 *     responses:
 *       200:
 *         description: Análisis detallado del periodo solicitado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipo:
 *                   type: string
 *                   example: semana
 *                 periodo:
 *                   type: string
 *                   example: Semana
 *                 fechaConsulta:
 *                   type: string
 *                   format: date
 *                   example: 2026-06-01
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     capacidad:
 *                       type: integer
 *                     disponibles:
 *                       type: integer
 *                     reservadas:
 *                       type: integer
 *                     ocupacionPromedio:
 *                       type: integer
 *                     cambioPeriodoAnterior:
 *                       type: string
 *                     tasaNoShow:
 *                       type: integer
 *                 horasPico:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlotSaturacion'
 *                 horasValle:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlotSaturacion'
 *                 desglose:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       periodo:
 *                         type: string
 *                         example: "2026-06-01"
 *                       capacidad:
 *                         type: integer
 *                       reservadas:
 *                         type: integer
 *                       ocupacion:
 *                         type: integer
 *                       noShows:
 *                         type: integer
 *                       tasaNoShow:
 *                         type: integer
 *                       franjas:
 *                         type: integer
 *       400:
 *         description: Tipo de análisis inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       504:
 *         description: La consulta excedió el tiempo límite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/analisis', controller.analisis);

module.exports = router;
