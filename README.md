# BookGym

Prototipo funcional para gestion de reservas de un gimnasio universitario.

## Estructura

- backend: API REST, logica de negocio, Prisma y Swagger
- frontend: interfaz web de estudiante y administrador

## Requisitos

- Node.js 20+
- PostgreSQL

## Arranque local

### Backend

1. cd backend
2. npm install
3. copiar .env.example a .env
4. completar DATABASE_URL, JWT_SECRET y PORT
5. npx prisma migrate dev --name init
6. node prisma/seed.js
7. npm run dev

### Frontend

1. cd frontend
2. npm install
3. copiar .env.example a .env
4. configurar VITE_API_URL
5. npm run dev

## Usuarios de prueba

- EST001 / password123
- ADM001 / password123

## Documentacion API

- Swagger UI: /api/docs
- OpenAPI JSON: /api/docs.json

## Despliegue en Railway

### Backend

- Root Directory: backend
- Build Command: npm install && npx prisma generate
- Start normal: node src/server.js

Si no hay shell y es primera inicializacion:

- Start temporal:
	npx prisma migrate resolve --rolled-back 20260325043000_init && npx prisma migrate deploy && node prisma/seed.js && node src/server.js

Luego volver a Start normal y redeployar.

### Frontend

- Root Directory: frontend
- Build Command: npm install && npm run build
- Start Command: npm run preview -- --host 0.0.0.0 --port $PORT
- Variable: VITE_API_URL=https://bookgym-production.up.railway.app/api
