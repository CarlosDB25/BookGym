const service = require('./admin.suspensiones.service');

async function listar(req, res) {
  try {
    const suspensiones = await service.listarSuspensiones(req.query.activas);
    return res.json(suspensiones);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'No fue posible listar las suspensiones' });
  }
}

async function crear(req, res) {
  try {
    const { idUsuario, fechaInicio, fechaFin, motivo } = req.body;

    if (!idUsuario || !fechaInicio || !fechaFin || !motivo) {
      return res.status(400).json({
        error:
          'Campos requeridos: idUsuario, fechaInicio, fechaFin, motivo',
      });
    }

    if (typeof motivo !== 'string' || motivo.trim().length === 0) {
      return res.status(400).json({ error: 'motivo debe ser un texto no vacio' });
    }

    if (motivo.length > 500) {
      return res
        .status(400)
        .json({ error: 'motivo no puede exceder 500 caracteres' });
    }

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return res
        .status(400)
        .json({ error: 'Formato de fecha invalido. Use YYYY-MM-DD' });
    }

    if (fechaFinDate <= fechaInicioDate) {
      return res
        .status(400)
        .json({ error: 'fechaFin debe ser posterior a fechaInicio' });
    }

    const suspension = await service.crearSuspension({
      idUsuario,
      fechaInicio,
      fechaFin,
      motivo,
    });
    return res.status(201).json(suspension);
  } catch (error) {
    const status = error.status || 500;
    return res
      .status(status)
      .json({ error: error.message || 'No fue posible crear la suspension' });
  }
}

async function levantar(req, res) {
  try {
    const { id } = req.params;
    const idAdmin = req.usuario.id;

    const suspension = await service.levantarSuspension(id, idAdmin);
    return res.json(suspension);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      error: error.message || 'No fue posible levantar la suspension',
    });
  }
}

module.exports = { listar, crear, levantar };
