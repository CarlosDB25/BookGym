const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./modules/auth/auth.routes');
const franjasRoutes = require('./modules/franjas/franjas.routes');
const reservasRoutes = require('./modules/reservas/reservas.routes');
const asistenciaRoutes = require('./modules/asistencia/asistencia.routes');
const metricasRoutes = require('./modules/metricas/metricas.routes');
const configuracionRoutes = require('./modules/configuracion/configuracion.routes');
const adminSuspensionesRoutes = require('./modules/admin/admin.suspensiones.routes');
const adminConfiguracionRoutes = require('./modules/admin/admin.configuracion.routes');
const adminScannerRoutes = require('./modules/admin/admin.scanner.routes');
const adminPlantillasRoutes = require('./modules/admin/admin.plantillas.routes');
const { setupSwagger } = require('./docs/swagger');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, servicio: 'bookgym-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/franjas', franjasRoutes);
app.use('/api/reservas', asistenciaRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/admin/suspensiones', adminSuspensionesRoutes);
app.use('/api/admin/configuracion', adminConfiguracionRoutes);
app.use('/api/admin/scanner', adminScannerRoutes);
app.use('/api/admin/plantillas', adminPlantillasRoutes);
setupSwagger(app);

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
  }
  const message = status < 500 ? err.message : 'Error interno del servidor';
  res.status(status).json({ error: message });
});

module.exports = app;
