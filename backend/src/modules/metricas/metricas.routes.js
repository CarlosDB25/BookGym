const router = require('express').Router();
const controller = require('./metricas.controller');
const { verificarToken } = require('../../shared/middlewares/auth.middleware');
const { soloAdmin } = require('../../shared/middlewares/roles.middleware');

router.use(verificarToken, soloAdmin);
router.get('/resumen', controller.resumen);

module.exports = router;
