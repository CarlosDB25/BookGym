const service = require('./reservas.service');

async function crear(req, res) {
  try {
    const { idFranja } = req.body;

    if (!idFranja) {
      return res.status(400).json({ error: 'idFranja es obligatorio' });
    }

    const reserva = await service.crearReserva(req.usuario.id, idFranja);
    return res.status(201).json(reserva);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function cancelar(req, res) {
  try {
    const resultado = await service.cancelarReserva(req.params.id, req.usuario.id);
    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function misReservas(req, res) {
  try {
    const reservas = await service.obtenerReservasActivas(req.usuario.id);
    return res.json(reservas);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function historial(req, res) {
  try {
    const reservas = await service.obtenerHistorialReservas(req.usuario.id);
    return res.json(reservas);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { crear, cancelar, misReservas, historial };
