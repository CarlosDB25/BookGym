const service = require('./admin.scanner.service');

async function verificar(req, res) {
  try {
    const { cedula } = req.params;
    const resultado = await service.verificarEstudiante(cedula);
    return res.json(resultado);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const mensaje = error.message || 'Error interno del servidor';
    return res.status(statusCode).json({ error: mensaje });
  }
}

async function checkin(req, res) {
  try {
    const { idReserva } = req.params;
    const registradoPor = req.usuario.id;
    const resultado = await service.registrarCheckin(idReserva, registradoPor);
    return res.json(resultado);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const mensaje = error.message || 'Error interno del servidor';
    return res.status(statusCode).json({ error: mensaje });
  }
}

module.exports = { verificar, checkin };
