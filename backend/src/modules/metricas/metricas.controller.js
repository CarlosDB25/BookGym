const service = require('./metricas.service');

function validarFecha(fecha) {
  if (!fecha) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

async function resumen(req, res) {
  try {
    if (!validarFecha(req.query.fecha)) {
      return res.status(400).json({ error: 'Formato de fecha invalido. Use YYYY-MM-DD' });
    }
    const data = await service.resumen(req.query.fecha);
    return res.json(data);
  } catch (error) {
    console.error('Error en resumen:', error.message);
    return res.status(500).json({ error: 'No fue posible generar metricas' });
  }
}

async function recomendaciones(req, res) {
  try {
    const limite = Math.min(parseInt(req.query.limite, 10) || 5, 20);
    const usuarioId = req.usuario?.id || null;
    const data = await service.recomendaciones(limite, usuarioId);
    return res.json(data);
  } catch (error) {
    console.error('Error en recomendaciones:', error.message);
    return res.status(500).json({ error: 'No fue posible generar recomendaciones' });
  }
}

async function analisis(req, res) {
  try {
    const tipo = req.query.tipo || 'semana';
    if (!['dia', 'semana', 'mes'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo invalido. Use: dia, semana o mes' });
    }
    if (!validarFecha(req.query.fecha)) {
      return res.status(400).json({ error: 'Formato de fecha invalido. Use YYYY-MM-DD' });
    }
    const data = await service.analisis(tipo, req.query.fecha);
    return res.json(data);
  } catch (error) {
    console.error('Error en analisis:', error.message);
    const isTimeout = error.message && error.message.includes('timed out');
    if (isTimeout) {
      return res.status(504).json({ error: 'La consulta excedio el tiempo limite. Intente con un rango menor' });
    }
    return res.status(500).json({ error: 'No fue posible generar el analisis' });
  }
}

module.exports = { resumen, recomendaciones, analisis };
