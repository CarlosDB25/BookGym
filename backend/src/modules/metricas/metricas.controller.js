const service = require('./metricas.service');

async function resumen(req, res) {
  try {
    const data = await service.resumen(req.query.fecha);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible generar metricas' });
  }
}

async function recomendaciones(req, res) {
  try {
    const data = await service.recomendaciones();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible generar recomendaciones' });
  }
}

module.exports = { resumen, recomendaciones };
