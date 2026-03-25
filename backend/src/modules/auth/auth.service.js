const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/prisma/client');

async function login(idInstitucional, password) {
  const usuario = await prisma.usuario.findUnique({ where: { idInstitucional } });

  if (!usuario) {
    throw new Error('Credenciales invalidas');
  }

  const valida = await bcrypt.compare(password, usuario.password);
  if (!valida) {
    throw new Error('Credenciales invalidas');
  }

  const token = jwt.sign(
    { id: usuario.idInstitucional, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { token, rol: usuario.rol, id: usuario.idInstitucional };
}

module.exports = { login };
