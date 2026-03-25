const service = require('./configuracion.service');

async function reglasReserva(req, res) {
  try {
    const reglas = await service.obtenerReglasReserva();
    return res.json(reglas);
  } catch (error) {
    return res.status(500).json({ error: 'No fue posible obtener reglas de reserva' });
  }
}

module.exports = { reglasReserva };
