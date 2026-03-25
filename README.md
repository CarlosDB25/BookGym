# BookGym

BookGym es un prototipo funcional de reservas para gimnasio universitario, con backend REST y frontend web, diseñado para demostrar reglas de negocio reales de cupos, tiempos y control por rol.

## 1) Arquitectura general

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite + TanStack Query + Tailwind
- Documentacion API: Swagger/OpenAPI integrado en el backend

Estructura del repositorio:

- `backend/`: API, reglas de negocio, acceso a datos, scheduler
- `frontend/`: interfaz de estudiante y administrador
- `README.md`: visión integral y operación
- `backend/README.md`: detalle técnico de API
- `frontend/README.md`: detalle técnico de interfaz

## 2) Reglas de negocio clave

Todas las reglas críticas están en backend y sus parámetros operativos viven en la tabla `configuracion` de la base de datos.

Reglas activas:

- límite de reservas activas por usuario
- máximo de reservas activas por día
- anticipación mínima para reservar
- anticipación mínima para cancelar
- bloqueo por suspensión activa
- control transaccional de cupos (sin sobreventa)

Claves de configuración usadas:

- `limite_reservas_activas`
- `max_reservas_por_dia`
- `anticipacion_reserva_min`
- `anticipacion_cancelacion_min`

## 3) Flujo end-to-end

### Estudiante

1. Inicia sesión (`/api/auth/login`).
2. Consulta agenda semanal (`/api/franjas/semana`).
3. Elige una franja y confirma en modal con condiciones de tiempo y cupo.
4. Backend valida reglas y crea reserva de forma atómica.
5. La reserva aparece en `Mis reservas activas`.
6. Si se cancela dentro de ventana permitida, se libera cupo.
7. Si la franja ya pasó o la reserva fue cancelada, se mueve a historial.

### Administrador

1. Inicia sesión con rol admin.
2. Consulta métricas semanales (`/api/metricas/resumen`).
3. Visualiza agenda en modo lectura (solo cupos y saturación).
4. Métricas excluyen franjas no vigentes y reservas canceladas.

## 4) Arranque local

Requisitos:

- Node.js 20+
- PostgreSQL

### Backend

1. `cd backend`
2. `npm install`
3. Copiar `.env.example` a `.env`
4. Completar `DATABASE_URL`, `JWT_SECRET`, `PORT`
5. `npx prisma migrate dev --name init`
6. `node prisma/seed.js`
7. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. Copiar `.env.example` a `.env`
4. Configurar `VITE_API_URL` (por ejemplo `http://localhost:3000/api`)
5. `npm run dev`

Usuarios demo:

- `EST001 / password123`
- `ADM001 / password123`

## 5) Swagger y ubicación exacta

Swagger está alojado dentro del backend Express (no en servicio aparte).

- Configuración OpenAPI: `backend/src/docs/swagger.js`
- Montaje en app: `backend/src/app.js`
- Anotaciones de rutas:
  - `backend/src/modules/auth/auth.routes.js`
  - `backend/src/modules/franjas/franjas.routes.js`
  - `backend/src/modules/reservas/reservas.routes.js`
  - `backend/src/modules/metricas/metricas.routes.js`
  - `backend/src/modules/configuracion/configuracion.routes.js`

Rutas:

- Local UI: `http://localhost:3000/api/docs`
- Local JSON: `http://localhost:3000/api/docs.json`
- Producción UI: `https://bookgym-production.up.railway.app/api/docs`
- Producción JSON: `https://bookgym-production.up.railway.app/api/docs.json`

## 6) Despliegue Railway

### Backend (servicio API)

- Root Directory: `backend`
- Build: `npm install && npx prisma generate`
- Start normal: `node src/server.js`

Primera inicialización sin shell (si aplica):

- Start temporal:
`npx prisma migrate resolve --rolled-back 20260325043000_init && npx prisma migrate deploy && node prisma/seed.js && node src/server.js`

Luego volver a start normal y redeploy.

### Frontend (servicio web)

- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Start: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Variable: `VITE_API_URL=https://bookgym-production.up.railway.app/api`

## 7) Operación y diagnóstico rápido

- Salud backend: `GET /health`
- Reglas activas en runtime: `GET /api/configuracion/reglas-reserva`
- Si no se reflejan cambios en UI: verificar token, `VITE_API_URL`, y polling de React Query
