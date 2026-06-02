const service = require('./asistencia.service');

async function checkIn(req, res) {
  try {
    const { id } = req.params;
    const resultado = await service.registrarCheckIn(id, req.usuario.id, req.usuario.rol);
    return res.json(resultado);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const mensaje = error.message || 'Error interno del servidor';
    return res.status(statusCode).json({ error: mensaje });
  }
}

module.exports = { checkIn };
