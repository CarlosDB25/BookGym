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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *         description: Fecha de lunes en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Lista de franjas con saturacion y cupos
 *       400:
 *         description: Error de validacion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/semana', controller.semana);

module.exports = router;
