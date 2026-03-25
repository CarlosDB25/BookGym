const router = require('express').Router();
const controller = require('./reservas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');

router.use(verificarToken);
router.get('/', controller.misReservas);
router.post('/', controller.crear);
router.delete('/:id', controller.cancelar);

module.exports = router;
