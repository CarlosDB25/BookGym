const service = require('./admin.configuracion.service');

async function actualizarReglas(req, res) {
  try {
    const datos = req.body;

    if (!datos || Object.keys(datos).length === 0) {
      return res.status(400).json({
        error:
          'Debe proporcionar al menos una regla para actualizar',
      });
    }

    const reglas = await service.actualizarReglas(datos, req.usuario?.id);
    return res.json(reglas);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      error:
        error.message || 'No fue posible actualizar la configuracion',
    });
  }
}

async function obtenerAuditLog(req, res) {
  try {
    const logs = await service.obtenerAuditLog();
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible obtener el historial' });
  }
}

module.exports = { actualizarReglas, obtenerAuditLog };
