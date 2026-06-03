const router = require('express').Router();
const controller = require('./admin.suspensiones.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);

/**
 * @openapi
 * /api/admin/suspensiones:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Listar suspensiones
 *     description: Retorna todas las suspensiones registradas. Filtra por activas con query param.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activas
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Si es 'true', retorna solo suspensiones activas
 *     responses:
 *       200:
 *         description: Lista de suspensiones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   idUsuario:
 *                     type: string
 *                   nombreUsuario:
 *                     type: string
 *                   fechaInicio:
 *                     type: string
 *                     format: date-time
 *                   fechaFin:
 *                     type: string
 *                     format: date-time
 *                   motivo:
 *                     type: string
 *                   activa:
 *                     type: boolean
 *                   levantadaPor:
 *                     type: string
 *                     nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', controller.listar);
router.get('/usuarios', controller.listarUsuarios);

/**
 * @openapi
 * /api/admin/suspensiones:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Crear suspension manual
 *     description: Crea una suspension para un usuario especifico. No permite duplicar suspension activa.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idUsuario
 *               - fechaInicio
 *               - fechaFin
 *               - motivo
 *             properties:
 *               idUsuario:
 *                 type: string
 *                 example: EST001
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-01
 *               fechaFin:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-08
 *               motivo:
 *                 type: string
 *                 example: Incumplimiento reiterado de normas
 *     responses:
 *       201:
 *         description: Suspension creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 idUsuario:
 *                   type: string
 *                 nombreUsuario:
 *                   type: string
 *                 fechaInicio:
 *                   type: string
 *                   format: date-time
 *                 fechaFin:
 *                   type: string
 *                   format: date-time
 *                 motivo:
 *                   type: string
 *                 activa:
 *                   type: boolean
 *       400:
 *         description: Campos requeridos faltantes o fechas invalidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El usuario ya tiene una suspension activa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', controller.crear);

/**
 * @openapi
 * /api/admin/suspensiones/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Levantar suspension manualmente
 *     description: Marca una suspension activa como inactiva y registra quien la levanto.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la suspension a levantar
 *     responses:
 *       200:
 *         description: Suspension levantada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 idUsuario:
 *                   type: string
 *                 nombreUsuario:
 *                   type: string
 *                 fechaInicio:
 *                   type: string
 *                   format: date-time
 *                 fechaFin:
 *                   type: string
 *                   format: date-time
 *                 motivo:
 *                   type: string
 *                 activa:
 *                   type: boolean
 *                 levantadaPor:
 *                   type: string
 *       400:
 *         description: La suspension ya fue levantada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Suspension no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', controller.levantar);

module.exports = router;
