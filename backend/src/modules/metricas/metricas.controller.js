const service = require('./metricas.service');

async function resumen(req, res) {
  const data = await service.resumen();
  return res.status(501).json(data);
}

module.exports = { resumen };
