const authService = require('./auth.service');

async function login(req, res) {
  try {
    const { idInstitucional, password } = req.body;

    if (!idInstitucional || !password) {
      return res.status(400).json({ error: 'idInstitucional y password son obligatorios' });
    }

    const data = await authService.login(idInstitucional, password);
    return res.json(data);
  } catch (error) {
    const msg = error?.message || '';
    if (msg === 'Credenciales invalidas') {
      return res.status(401).json({ error: msg });
    }
    console.error('Error en login:', msg);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { login };
