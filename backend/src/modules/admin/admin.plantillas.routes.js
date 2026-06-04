const router = require('express').Router();
const controller = require('./admin.plantillas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);

router.get('/', controller.listar);
router.put('/:id', controller.actualizar);

module.exports = router;
