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
- `admin`: gestion de suspensiones y configuracion operativa (solo administradores)

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
- `npm run test`: ejecutar suite completa de tests

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
- `dias_suspension_por_noshow`

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
- `GET /api/admin/suspensiones`
- `POST /api/admin/suspensiones`
- `DELETE /api/admin/suspensiones/:id`
- `PUT /api/admin/configuracion/reglas-reserva`

## 8) Flujo end-to-end backend

### Flujo de reserva

1. Usuario autenticado solicita crear reserva.
2. Backend carga reglas de `configuracion`.
3. Valida suspensión, límites activas/día, duplicado y ventana de tiempo.
4. Sección crítica protegida por mutex por franja (Node.js).
5. Decremento atómico vía `UPDATE ... WHERE cuposDisponibles > 0` (PostgreSQL nativo, sin intermediación de Prisma engine).
6. Si el decremento falla (cupo agotado), se descarta sin restaurar.
7. Si la creación de la reserva falla inesperadamente, se restaura el cupo.
8. Frontend invalida cachés y actualiza vistas.

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

### Flujo de suspensiones admin

1. Admin autenticado solicita listar, crear o levantar suspensiones.
2. Backend valida token JWT y rol `administrador`.
3. **Listar**: retorna todas las suspensiones (filtro opcional por activas).
4. **Crear**: valida existencia de usuario, ausencia de suspension activa duplicada y coherencia de fechas.
5. **Levantar**: marca suspension como inactiva y registra el admin que ejecuto la accion.

### Flujo de configuracion admin

1. Admin autenticado envia PUT con una o mas claves a actualizar.
2. Backend valida token JWT y rol `administrador`.
3. Valida que las claves sean validas y los valores enteros positivos.
4. Upsert en tabla `configuracion` para cada clave.
5. Retorna la configuracion completa actualizada (las 7 claves).

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

## 12) Motor de No-Show

- Entry point: `src/scheduler/noshow.scheduler.js` registra el cron */15 * * * *.
- Procesador: `src/scheduler/noshow.processor.js` contiene `procesarNoShows()` (idempotente, exportable para tests).
- Cambia estado de `Reserva` de `activa` a `no_show` (nuevo valor en enum `EstadoReserva`).
- Crea `Suspension` con `dias_suspension_por_noshow` desde `configuracion` cuando se acumula `umbral_noshow`.
- Cancela en cascada las reservas activas del usuario suspendido (transaccional, libera cupos).
- Logs en consola con prefijo `[NoShow]` (cambios de estado) y `[AUDIT][NoShow]` (suspensiones aplicadas).
- Pruebas: `npm run test:noshow` (6 tests: cambio de estado, idempotencia, franjas no vencidas, cascada de suspensión, no duplicar suspensión, etc).

## 13) Testing y Calidad

El backend cuenta con 113 tests automáticos que se ejecutan contra PostgreSQL real (sin mocks), divididos en 12 suites:

| Suite | Archivo | Tests | Cobertura funcional |
|-------|---------|-------|---------------------|
| Auth | `01-auth.test.js` | 12 | Login, JWT, SQL injection, XSS |
| Franjas | `02-franjas.test.js` | 10 | Disponibilidad semanal, cupos, formato fecha |
| Reservas | `03-reservas.test.js` | 19 | CRUD reservas, validaciones, límites, concurrencia simple |
| Asistencia | `04-asistencia.test.js` | 5 | Check-in, permisos, estados |
| Métricas | `05-metricas.test.js` | 15 | Resumen, recomendaciones, análisis admin |
| Configuración | `06-configuracion.test.js` | 3 | Reglas operativas |
| Admin Suspensiones | `07-admin-suspensiones.test.js` | 11 | CRUD suspensiones, permisos |
| Admin Config | `08-admin-configuracion.test.js` | 12 | Actualizar reglas, validaciones, permisos |
| Integración | `09-integracion.test.js` | 3 | Flujos completos login→reserva→cancelar→historial |
| Vulnerabilidades | `10-vulnerabilidades.test.js` | 15 | SQL injection, XSS, control acceso, CORS, edge cases |
| Concurrencia | `reservas.concurrency.test.js` | 2 | Race condition sobre cupos, consistencia transaccional |
| Helpers | `helpers.js` | — | Utilidades compartidas (crear usuario, login, franja futura, limpieza) |

### Bug fixes aplicados

| Archivo | Bug | Fix |
|---------|-----|-----|
| `metricas.service.js` | Variable `inicio` no definida en `resumen()` | Se agregó `const inicio = parseMonday(fecha)` |
| `app.js` | JSON parse error devolvía 500 | Se cambió a `err.status` con mensaje `< 500` |
| `franjas.service.js` | Fecha inválida exponía errores Prisma | Se agregó validación con regex y `isNaN` |
| `helpers.js` | Orden de cleanup incorrecto (reserva antes que asistencia, FK violation) | Se invirtió orden: asistencia → reserva → usuario |

### Concurrencia y condición de carrera

**Problema original**: `Prisma.$transaction` con `Serializable` + `updateMany` evaluaba el `WHERE cuposDisponibles > 0` sobre el snapshot de la transacción, y el reintento automático de Prisma en caso de serialization error permitía que dos requests concurrentes decrementaran el mismo cupo.

**Solución**: Se reemplazó la transacción interactiva por un patrón de dos fases:

1. **Mutex por franja** (`Map<idFranja, Promise>`): serializa los requests concurrentes sobre la misma franja a nivel de Node.js.
2. **Decremento atómico nativo** (`$executeRawUnsafe`): `UPDATE franja SET cuposDisponibles = cuposDisponibles - 1 WHERE id = $1 AND cuposDisponibles > 0`. PostgreSQL serializa los `UPDATE` concurrentes mediante row-level locks y re-evalúa el `WHERE` sobre el valor commitado más reciente (Read Committed).
3. **Recuperación granular**: solo se restaura el cupo si `reserva.create` falla, no cuando el cupo ya estaba agotado.

Esto elimina la dependencia del batching del Prisma Engine, que demostró no ejecutar `$executeRawUnsafe` dentro del contexto transaccional interactivo correctamente en escenarios de alta concurrencia.