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
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { login };
