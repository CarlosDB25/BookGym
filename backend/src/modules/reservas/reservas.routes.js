const router = require('express').Router();
const controller = require('./reservas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);
/**
 * @openapi
 * /api/reservas:
 *   get:
 *     tags:
 *       - Reservas
 *     summary: Listar reservas activas del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas activas
 */
router.get('/', controller.misReservas);

/**
 * @openapi
 * /api/reservas:
 *   post:
 *     tags:
 *       - Reservas
 *     summary: Crear reserva
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaRequest'
 *     responses:
 *       201:
 *         description: Reserva creada
 *       400:
 *         description: Error de validacion de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', controller.crear);

/**
 * @openapi
 * /api/reservas/{id}:
 *   delete:
 *     tags:
 *       - Reservas
 *     summary: Cancelar reserva
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *       400:
 *         description: Error de validacion de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', controller.cancelar);

module.exports = router;
