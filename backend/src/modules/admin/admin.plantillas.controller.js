const service = require('./admin.plantillas.service');

async function listar(req, res) {
  try {
    const plantillas = await service.listarPlantillas();
    return res.json(plantillas);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible listar las plantillas' });
  }
}

async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { horaInicio, horaFin, capacidadMaxima, activa } = req.body;
    const idAdmin = req.usuario?.id || 'admin';
    const plantilla = await service.actualizarPlantilla(id, { horaInicio, horaFin, capacidadMaxima, activa }, idAdmin);
    return res.json(plantilla);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No fue posible actualizar la plantilla' });
  }
}

module.exports = { listar, actualizar };
