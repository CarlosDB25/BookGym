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
 *     description: Devuelve solo reservas en estado activa para el estudiante autenticado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reservas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reserva'
 *             examples:
 *               ok:
 *                 value:
 *                   reservas:
 *                     - id: 867efc16-0b12-4b5a-ab5b-0390b4e14b3b
 *                       idUsuario: EST001
 *                       idFranja: db7f392c-add9-47b9-8b99-261ecd6d360c
 *                       fechaCreacion: '2026-03-20T11:10:00.000Z'
 *                       estado: activa
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', controller.misReservas);

/**
 * @openapi
 * /api/reservas/historial:
 *   get:
 *     tags:
 *       - Reservas
 *     summary: Listar historial de reservas del usuario autenticado
 *     description: Devuelve reservas canceladas o reservas cuyo horario ya paso.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reserva'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/historial', controller.historial);

/**
 * @openapi
 * /api/reservas:
 *   post:
 *     tags:
 *       - Reservas
 *     summary: Crear reserva
 *     description: Crea una reserva activa descontando cupo de forma atomica para evitar sobre-reserva concurrente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservaRequest'
 *           examples:
 *             crear:
 *               value:
 *                 idFranja: db7f392c-add9-47b9-8b99-261ecd6d360c
 *     responses:
 *       201:
 *         description: Reserva creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 reserva:
 *                   $ref: '#/components/schemas/Reserva'
 *             examples:
 *               ok:
 *                 value:
 *                   mensaje: Reserva creada exitosamente
 *                   reserva:
 *                     id: 867efc16-0b12-4b5a-ab5b-0390b4e14b3b
 *                     estado: activa
 *       400:
 *         description: Error de validacion de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               cupos:
 *                 value:
 *                   error: No hay cupos disponibles para esta franja
 *               limite:
 *                 value:
 *                   error: Ya alcanzaste el limite de reservas activas
 *               porDia:
 *                 value:
 *                   error: Solo puedes tener una reserva activa por dia
 *               corte:
 *                 value:
 *                   error: La reserva solo esta permitida hasta 30 minutos antes del inicio del turno
 *               suspendido:
 *                 value:
 *                   error: Usuario suspendido temporalmente por inasistencia
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
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
 *     description: Cancela una reserva activa si faltan al menos 15 minutos para la hora de inicio.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 867efc16-0b12-4b5a-ab5b-0390b4e14b3b
 *     responses:
 *       200:
 *         description: Reserva cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MensajeResponse'
 *             examples:
 *               ok:
 *                 value:
 *                   mensaje: Reserva cancelada exitosamente
 *       400:
 *         description: Error de validacion de negocio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tiempo:
 *                 value:
 *                   error: Solo puedes cancelar hasta 15 minutos antes de iniciar la franja
 *               estado:
 *                 value:
 *                   error: La reserva ya no esta activa
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', controller.cancelar);

module.exports = router;
