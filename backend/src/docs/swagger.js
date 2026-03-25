const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookGym API',
      version: '1.0.0',
      description: 'API del prototipo de reservas del gimnasio universitario',
    },
    tags: [
      { name: 'Auth', description: 'Autenticacion y entrega de JWT' },
      { name: 'Franjas', description: 'Disponibilidad semanal de franjas' },
      { name: 'Reservas', description: 'Creacion, consulta y cancelacion de reservas' },
      { name: 'Metricas', description: 'Resumen operativo semanal (solo administrador)' },
      { name: 'Sistema', description: 'Salud y soporte del servicio' },
    ],
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['idInstitucional', 'password'],
          properties: {
            idInstitucional: { type: 'string', example: 'EST001' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            rol: { type: 'string', example: 'estudiante' },
            id: { type: 'string', example: 'EST001' },
          },
        },
        Franja: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'db7f392c-add9-47b9-8b99-261ecd6d360c' },
            fecha: { type: 'string', format: 'date-time', example: '2026-03-24T00:00:00.000Z' },
            diaSemana: { type: 'string', enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] },
            horaInicio: { type: 'string', example: '18:00' },
            horaFin: { type: 'string', example: '19:00' },
            capacidadMaxima: { type: 'integer', example: 20 },
            cuposDisponibles: { type: 'integer', example: 11 },
            saturacion: { type: 'string', enum: ['baja', 'media', 'alta'] },
          },
        },
        Reserva: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '867efc16-0b12-4b5a-ab5b-0390b4e14b3b' },
            idUsuario: { type: 'string', example: 'EST001' },
            idFranja: { type: 'string', example: 'db7f392c-add9-47b9-8b99-261ecd6d360c' },
            fechaCreacion: { type: 'string', format: 'date-time' },
            estado: { type: 'string', enum: ['activa', 'cancelada'] },
            franja: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                fecha: { type: 'string', format: 'date-time' },
                plantilla: {
                  type: 'object',
                  properties: {
                    diaSemana: { type: 'string' },
                    horaInicio: { type: 'string' },
                    horaFin: { type: 'string' },
                    capacidadMaxima: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        ReservaRequest: {
          type: 'object',
          required: ['idFranja'],
          properties: {
            idFranja: { type: 'string' },
          },
        },
        MensajeResponse: {
          type: 'object',
          properties: {
            mensaje: { type: 'string', example: 'Reserva cancelada exitosamente' },
          },
        },
        MetricasResumen: {
          type: 'object',
          properties: {
            semana: { type: 'string', example: '2026-03-23' },
            totalCapacidad: { type: 'integer', example: 1500 },
            totalDisponibles: { type: 'integer', example: 1320 },
            totalReservadas: { type: 'integer', example: 180 },
            ocupacionPromedio: { type: 'integer', example: 12 },
            saturacionAlta: { type: 'integer', example: 3 },
            saturacionMedia: { type: 'integer', example: 11 },
            saturacionBaja: { type: 'integer', example: 61 },
            totalFranjas: { type: 'integer', example: 75 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token ausente, invalido o expirado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                token: { value: { error: 'Token requerido' } },
              },
            },
          },
        },
        Forbidden: {
          description: 'Acceso restringido por rol',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                role: { value: { error: 'Acceso restringido a administradores' } },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Verificar salud del servicio',
          responses: {
            200: {
              description: 'Servicio disponible',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      servicio: { type: 'string', example: 'bookgym-backend' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => {
    res.json(swaggerSpec);
  });
}

module.exports = { setupSwagger };
