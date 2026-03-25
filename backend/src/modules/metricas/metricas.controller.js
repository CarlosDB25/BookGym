const service = require('./metricas.service');

async function resumen(req, res) {
  try {
    const data = await service.resumen(req.query.fecha);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible generar metricas' });
  }
}

module.exports = { resumen };
