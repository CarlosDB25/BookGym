const service = require('./franjas.service');

async function semana(req, res) {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'La fecha (lunes) es obligatoria. Use ?fecha=YYYY-MM-DD' });
    }

    const resultado = await service.obtenerDisponibilidadSemana(fecha);
    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { semana };
