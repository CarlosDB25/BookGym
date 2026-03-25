const router = require('express').Router();
const controller = require('./auth.controller');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesion
 *     description: Valida credenciales institucionales y retorna JWT para consumir la API protegida.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             estudiante:
 *               value:
 *                 idInstitucional: EST001
 *                 password: est12345
 *             admin:
 *               value:
 *                 idInstitucional: ADM001
 *                 password: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               ok:
 *                 value:
 *                   token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   rol: estudiante
 *                   id: EST001
 *       400:
 *         description: Error de credenciales o validacion de entrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               credenciales:
 *                 value:
 *                   error: Credenciales invalidas
 *       500:
 *         description: Error inesperado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', controller.login);

module.exports = router;
