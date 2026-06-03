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
- `asistencia`: registro de check-in en ventana configurable
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
- `ventana_checkin_min`
- `umbral_noshow`

Comportamientos:

- creación de reserva solo antes de la ventana de anticipación
- cancelación solo antes de la ventana de cancelación
- check-in dentro de ventana configurable (antes/después del inicio)
- máximo de reservas activas por usuario
- máximo de reservas activas por día
- historial separado (canceladas, completadas o ya pasadas)

## 7) Endpoints principales

- `POST /api/auth/login`
- `GET /api/franjas/semana?fecha=YYYY-MM-DD`
- `GET /api/reservas`
- `GET /api/reservas/historial`
- `POST /api/reservas`
- `DELETE /api/reservas/:id`
- `POST /api/reservas/:id/check-in`
- `GET /api/metricas/recomendaciones?limite=N`
- `GET /api/metricas/resumen?fecha=YYYY-MM-DD`
- `GET /api/metricas/analisis?tipo=semana|dia|mes&fecha=YYYY-MM-DD`
- `GET /api/configuracion/reglas-reserva`

## 8) Flujo end-to-end backend

### Flujo de reserva

1. Usuario autenticado solicita crear reserva.
2. Backend carga reglas de `configuracion`.
3. Valida suspensión, cupo, límites, día y ventana de tiempo.
4. Ejecuta transacción: decrementa cupo y crea reserva activa.
5. Frontend invalida cachés y actualiza vistas.

### Flujo de check-in

1. Usuario (o admin) solicita check-in sobre una reserva activa.
2. Backend valida existencia, propiedad (o rol admin), estado activa y ventana de tiempo.
3. Lee `ventana_checkin_min` de `configuracion`.
4. Transacción: crea registro en `Asistencia` con `resultado: presente` y marca reserva como `completada`.
5. Si ya hay check-in registrado o la reserva no está activa, retorna error 400.

### Flujo de cancelación

1. Usuario solicita cancelar reserva activa.
2. Backend valida propiedad de reserva y ventana de cancelación.
3. Transacción: estado cancelada + incremento de cupo.
4. Reserva se mueve a historial en lecturas posteriores.

### Flujo de recomendaciones

1. Estudiante autenticado solicita recomendaciones.
2. Backend consulta franjas pasadas (últimos 90 días) con reservas no canceladas.
3. Agrupa por día de semana y hora de inicio.
4. Divide en periodo reciente y antiguo para calcular tendencia (subiendo/estable/bajando).
5. Cruza con disponibilidad de la semana actual (cupos restantes).
6. Si el estudiante tiene historial, personaliza afinidad (alta/media/neutra) según sus horarios frecuentes.
7. Clasifica como `pico` (>80%) o `valle` (≤80%).
8. Retorna: mejoresMomentos (ordenados por saturación), evitando (alta saturación), conTendenciaAlza.
9. Timeout de 25s por consulta; si se excede, retorna error 500.

### Flujo de métricas admin

1. Admin solicita resumen o análisis.
2. Backend toma franjas reservables vigentes (descarta pasadas/no reservables).
3. Calcula capacidad/disponibilidad/ocupación/saturación + tasa no-show.
4. Compara contra semana anterior (cambio porcentual y tendencia).
5. Detecta horas pico (≥75%) y valle (<25%).
6. Para análisis, agrupa por día/semana/mes con desglose detallado.
7. Excluye canceladas por definición de conteo activo.
8. Timeout de 25s; análisis retorna 504 si excede (para rangos grandes).

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

## 10) Timeouts y Railway

Las consultas a métricas (recomendaciones, resumen, analisis) operan sobre grandes volúmenes de datos históricos (hasta 90 días). El backend usa `withTimeout()` con límite de 25s por consulta.

Comportamiento en timeout:
- `/api/metricas/recomendaciones` y `/api/metricas/resumen`: retornan 500
- `/api/metricas/analisis`: retorna 504 (Gateway Timeout) para que el frontend lo maneje sin confundirlo con error interno

Los logs `SSL error: unexpected eof while reading` en Railway son normales. Railway usa un proxy entre la app y PostgreSQL que ocasionalmente cierra conexiones inactivas. No afectan la funcionalidad. Para deploy en Railway, usar connection string interna para evitar el proxy.

Configuración de pool en DATABASE_URL:
- `connection_limit=5`: máximo de conexiones concurrentes
- `pool_timeout=15`: tiempo de espera por conexión del pool

## 11) Salud y operación

- `GET /health`: validación de disponibilidad del servicio
- `GET /api/configuracion/reglas-reserva`: diagnóstico rápido de reglas activas
