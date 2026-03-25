# Backend BookGym

API REST del prototipo de reservas del gimnasio universitario.

## Stack

- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT para autenticacion
- Swagger (OpenAPI)

## Variables de entorno

Crear archivo .env basado en .env.example:

- DATABASE_URL
- JWT_SECRET
- PORT
- SWAGGER_SERVER_URL (opcional)

## Scripts

- npm run dev
- npm run start
- npm run seed

## Inicializacion de base de datos

1. npx prisma migrate deploy
2. node prisma/seed.js

## Endpoints principales

- POST /api/auth/login
- GET /api/franjas/semana?fecha=YYYY-MM-DD
- GET /api/reservas
- POST /api/reservas
- DELETE /api/reservas/:id

## Documentacion Swagger

- UI: /api/docs
- JSON: /api/docs.json

## Reglas de negocio implementadas

- Bloqueo por suspension activa
- Limite de reservas activas por usuario
- Validacion de cupos disponibles
- Transaccion atomica para crear reserva + descontar cupo
- Cancelacion solo antes del inicio de la franja
