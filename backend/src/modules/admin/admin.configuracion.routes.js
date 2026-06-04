const router = require('express').Router();
const controller = require('./admin.configuracion.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);

/**
 * @openapi
 * /api/admin/configuracion/reglas-reserva:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Actualizar reglas operativas de configuracion
 *     description: |
 *       Actualiza una o mas claves de configuracion del sistema.
 *       Retorna la configuracion completa actualizada.
 *       Claves validas:
 *       - `limite_reservas_activas`
 *       - `max_reservas_por_dia`
 *       - `anticipacion_reserva_min`
 *       - `anticipacion_cancelacion_min`
 *       - `umbral_noshow`
 *       - `ventana_checkin_min`
 *       - `dias_suspension_por_noshow`
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               limite_reservas_activas:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               max_reservas_por_dia:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               anticipacion_reserva_min:
 *                 type: integer
 *                 minimum: 1
 *                 example: 45
 *               anticipacion_cancelacion_min:
 *                 type: integer
 *                 minimum: 1
 *                 example: 20
 *               umbral_noshow:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *               ventana_checkin_min:
 *                 type: integer
 *                 minimum: 1
 *                 example: 20
 *               dias_suspension_por_noshow:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *     responses:
 *       200:
 *         description: Configuracion actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limiteReservasActivas:
 *                   type: integer
 *                   example: 3
 *                 maxReservasPorDia:
 *                   type: integer
 *                   example: 2
 *                 anticipacionReservaMin:
 *                   type: integer
 *                   example: 45
 *                 anticipacionCancelacionMin:
 *                   type: integer
 *                   example: 20
 *                 umbralNoshow:
 *                   type: integer
 *                   example: 5
 *                 ventanaCheckinMin:
 *                   type: integer
 *                   example: 20
 *                 diasSuspensionPorNoshow:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: Campos vacios, claves no validas o valores no enteros positivos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Error interno del servidor
 */
router.put('/reglas-reserva', controller.actualizarReglas);
router.get('/audit-log', controller.obtenerAuditLog);

module.exports = router;
