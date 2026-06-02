# Backend BookGym

API REST sistema de reservas de gimnasio universitario.

## 1) Stack técnico

- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT para autenticación
- Swagger/OpenAPI para documentación

## 2) Módulos funcionales

- `auth`: login y generación de token
- `franjas`: disponibilidad semanal
- `reservas`: crear, listar activas, listar historial, cancelar
- `metricas`: panel semanal de administración
- `configuracion`: reglas operativas obtenidas desde BD

## 3) Variables de entorno

Crear `.env` con base en `.env.example`:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `SWAGGER_SERVER_URL` (opcional)

## 4) Scripts

- `npm run dev`: desarrollo
- `npm run start`: producción
- `npm run seed`: datos iniciales

## 5) Inicialización de base de datos

1. `npx prisma migrate deploy`
2. `node prisma/seed.js`

## 6) Reglas de negocio (source of truth en BD)

La tabla `configuracion` define reglas operativas sin hardcode en frontend ni backend.

Claves relevantes:

- `limite_reservas_activas`
- `max_reservas_por_dia`
- `anticipacion_reserva_min`
- `anticipacion_cancelacion_min`

Comportamientos:

- creación de reserva solo antes de la ventana de anticipación
- cancelación solo antes de la ventana de cancelación
- máximo de reservas activas por usuario
- máximo de reservas activas por día
- historial separado (canceladas o ya pasadas)

## 7) Endpoints principales

- `POST /api/auth/login`
- `GET /api/franjas/semana?fecha=YYYY-MM-DD`
- `GET /api/reservas`
- `GET /api/reservas/historial`
- `POST /api/reservas`
- `DELETE /api/reservas/:id`
- `GET /api/metricas/recomendaciones`
- `GET /api/metricas/resumen?fecha=YYYY-MM-DD`
- `GET /api/configuracion/reglas-reserva`

## 8) Flujo end-to-end backend

### Flujo de reserva

1. Usuario autenticado solicita crear reserva.
2. Backend carga reglas de `configuracion`.
3. Valida suspensión, cupo, límites, día y ventana de tiempo.
4. Ejecuta transacción: decrementa cupo y crea reserva activa.
5. Frontend invalida cachés y actualiza vistas.

### Flujo de cancelación

1. Usuario solicita cancelar reserva activa.
2. Backend valida propiedad de reserva y ventana de cancelación.
3. Transacción: estado cancelada + incremento de cupo.
4. Reserva se mueve a historial en lecturas posteriores.

### Flujo de recomendaciones

1. Estudiante autenticado solicita recomendaciones.
2. Backend consulta franjas pasadas (últimos 90 días) con reservas no canceladas.
3. Agrupa por día de semana y hora de inicio.
4. Calcula porcentaje de ocupación histórica por grupo.
5. Clasifica como `pico` (>80%) o `valle` (≤80%).
6. Retorna lista ordenada de menor a mayor saturación.

### Flujo de métricas admin

1. Admin solicita resumen semanal.
2. Backend toma franjas reservables vigentes (descarta pasadas/no reservables).
3. Calcula capacidad/disponibilidad/ocupación/saturación.
4. Excluye canceladas por definición de conteo activo.

## 9) Swagger

Swagger está integrado en Express.

- Configuración: `src/docs/swagger.js`
- Montaje: `src/app.js`
- Anotaciones: `src/modules/**/**.routes.js`

URLs:

- UI local: `http://localhost:3000/api/docs`
- JSON local: `http://localhost:3000/api/docs.json`
- UI Railway: `https://bookgym-production.up.railway.app/api/docs`
- JSON Railway: `https://bookgym-production.up.railway.app/api/docs.json`

## 10) Salud y operación

- `GET /health`: validación de disponibilidad del servicio
- `GET /api/configuracion/reglas-reserva`: diagnóstico rápido de reglas activas
