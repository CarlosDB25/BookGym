const router = require('express').Router();
const controller = require('./franjas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);
router.get('/semana', controller.semana);

module.exports = router;
