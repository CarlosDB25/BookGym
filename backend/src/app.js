const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./modules/auth/auth.routes');
const franjasRoutes = require('./modules/franjas/franjas.routes');
const reservasRoutes = require('./modules/reservas/reservas.routes');
const metricasRoutes = require('./modules/metricas/metricas.routes');
const configuracionRoutes = require('./modules/configuracion/configuracion.routes');
const { setupSwagger } = require('./docs/swagger');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, servicio: 'bookgym-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/franjas', franjasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/configuracion', configuracionRoutes);
setupSwagger(app);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
