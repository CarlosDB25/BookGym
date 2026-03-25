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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: false
 *         schema:
 *           type: string
 *         description: Lunes de la semana en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Resumen calculado sobre franjas de la semana
 */
router.get('/resumen', controller.resumen);

module.exports = router;
