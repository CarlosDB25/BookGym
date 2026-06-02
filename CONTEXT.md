# CONTEXT BookGym

Este archivo resume la arquitectura exacta del proyecto para que otra IA entienda rapido como esta organizado, que tecnologias usa y como se conectan sus rutas, hooks y servicios.

## 1) Proposito del sistema

BookGym es un prototipo funcional de reservas para gimnasio universitario. El sistema permite:

- autenticacion de estudiante y administrador
- consulta de disponibilidad semanal
- creacion y cancelacion de reservas
- separacion entre reservas activas e historial
- panel administrativo con metricas semanales
- sincronizacion automatica de franjas por scheduler
- reglas operativas guardadas en base de datos

## 2) Arquitectura general

El proyecto tiene dos aplicaciones principales:

- backend: API REST + reglas de negocio + Prisma + Swagger
- frontend: interfaz web React + Vite + TanStack Query + Tailwind

Flujo general:

- el frontend consume la API del backend por Axios
- el backend expone rutas REST por modulo
- las rutas llaman controllers
- los controllers llaman services
- los services consultan Prisma y PostgreSQL
- React Query maneja cache, polling e invalidaciones
- Swagger documenta las rutas desde el propio backend

## 3) Stack real usado

### Backend

- Express 4.22
- Prisma 5.22
- PostgreSQL
- jsonwebtoken 9
- bcrypt 6
- node-cron 4.2
- cors 2.8
- dotenv 17
- swagger-jsdoc 6.2
- swagger-ui-express 5

### Frontend

- React 19.2
- Vite 8
- Axios 1.13
- @tanstack/react-query 5.95
- Tailwind CSS 3.4
- eslint y plugins de React/Vite

## 4) Estructura exacta del backend

Punto de entrada:

- backend/src/server.js
- backend/src/app.js

Cadena de inicializacion:

- server.js arranca la app Express
- app.js registra cors, json, salud, rutas y Swagger
- las rutas viven bajo backend/src/modules

Modulos del backend:

- auth: login y JWT
- franjas: disponibilidad semanal
- reservas: crear, cancelar, listar activas e historial
- metricas: panel semanal admin
- configuracion: reglas operativas leidas desde BD
- scheduler: sincronizacion automatica de franjas
- docs: Swagger/OpenAPI
- shared: cliente Prisma, auth middleware, roles, config comun

### Flujo de capas

Cada modulo sigue el patron:

- routes
- controller
- service
- prisma

Ejemplo:

- backend/src/modules/reservas/reservas.routes.js
- backend/src/modules/reservas/reservas.controller.js
- backend/src/modules/reservas/reservas.service.js

## 5) Mapa de rutas y conexiones

### Auth

Ruta:

- POST /api/auth/login

Conecta asi:

- auth.routes.js -> auth.controller.js -> auth.service.js -> prisma.usuario

Uso:

- valida credenciales
- retorna JWT
- guarda rol e id institucional en el token

### Franjas

Ruta:

- GET /api/franjas/semana?fecha=YYYY-MM-DD

Conecta asi:

- franjas.routes.js -> franjas.controller.js -> franjas.service.js -> prisma.franja + plantilla_franja

Uso:

- devuelve disponibilidad semanal
- filtra franjas ya no reservables
- calcula saturacion
- usa la regla de anticipacion desde configuracion

### Reservas

Rutas:

- GET /api/reservas
- GET /api/reservas/historial
- POST /api/reservas
- DELETE /api/reservas/:id

Conecta asi:

- reservas.routes.js -> reservas.controller.js -> reservas.service.js -> prisma.reserva + franja + suspension + configuracion

Uso:

- listar activas
- listar historial
- crear reserva con validaciones y transaccion
- cancelar con validacion de ventana de tiempo

Reglas criticas:

- limite de reservas activas por usuario
- maximo de reservas por dia
- reserva solo si faltan suficientes minutos antes del inicio
- cancelacion solo si faltan suficientes minutos antes del inicio
- evitar sobreventa por concurrencia con transaccion serializable y actualizacion atomica

### Metricas

Ruta:

- GET /api/metricas/resumen?fecha=YYYY-MM-DD

Conecta asi:

- metricas.routes.js -> metricas.controller.js -> metricas.service.js -> prisma.franja + reserva + configuracion

Uso:

- panel del administrador
- calcula capacidad, disponibles, reservadas y saturacion
- excluye franjas no vigentes
- excluye reservas canceladas

### Configuracion

Ruta:

- GET /api/configuracion/reglas-reserva

Conecta asi:

- configuracion.routes.js -> configuracion.controller.js -> configuracion.service.js -> prisma.configuracion

Uso:

- expone reglas operativas reales del sistema
- alimenta frontend para no usar valores hardcodeados

### Salud

Ruta:

- GET /health

Uso:

- confirma que el backend esta arriba

### Swagger

Documentacion:

- backend/src/docs/swagger.js
- backend/src/app.js llama setupSwagger(app)
- las anotaciones OpenAPI estan en los archivos .routes.js

Rutas publicas de Swagger:

- /api/docs
- /api/docs.json

## 6) Estructura exacta del frontend

Punto de entrada:

- frontend/src/main.jsx

Cadena:

- main.jsx monta QueryClientProvider
- App.jsx decide vista segun usuario y rol
- pages consumen hooks
- hooks usan Axios + React Query
- components renderizan tarjetas, modales, badges y toast

### Piezas principales del frontend

#### App

- frontend/src/App.jsx
- controla login, tabs y layout general

#### Pages

- frontend/src/pages/Login.jsx
- frontend/src/pages/Disponibilidad.jsx
- frontend/src/pages/MisReservas.jsx
- frontend/src/pages/AdminDashboard.jsx

#### Hooks

- frontend/src/hooks/useAuth.js
- frontend/src/hooks/useFranjas.js
- frontend/src/hooks/useReservas.js
- frontend/src/hooks/useMetricas.js
- frontend/src/hooks/useReglasReserva.js

#### Components

- frontend/src/components/ActionModal.jsx
- frontend/src/components/ReservaItem.jsx
- frontend/src/components/SaturacionBadge.jsx
- frontend/src/components/Toast.jsx

#### Utils

- frontend/src/utils/time.js

## 7) Lectura rapida del PDF de requerimientos

El PDF de "Entregable BooKGym" organiza el alcance en cuatro bloques:

- autenticacion y roles
- reservas, cancelaciones, check-in y no-show
- metricas historicas, saturacion y recomendaciones
- suspensiones, panel admin y despliegue cloud

La base tecnica actual ya cubre autenticacion, reservas, cancelaciones, metricas base, saturacion actual, reglas en BD, panel admin de lectura y motor de No-Show automatico con suspensiones y cancelacion en cascada. Lo que sigue pendiente o incompleto es el flujo completo de check-in, la recomendacion historica de franjas, la gestion admin de suspensiones y la validacion de esos casos con pruebas formales.

## 7) Como se conecta el frontend con el backend

### Login

- Login.jsx llama useAuth/login
- Axios pega a POST /api/auth/login
- el token se guarda en localStorage

### Disponibilidad

- Disponibilidad.jsx usa useFranjas y useReservas
- también usa useReglasReserva para no depender de constantes fijas
- React Query refresca por intervalo y al volver al foco
- el modal de confirmacion muestra condiciones de tiempo y cupos

### Mis reservas

- MisReservas.jsx usa useReservas y useHistorialReservas
- para cancelar primero abre confirmacion
- muestra activas por separado del historial
- si la ventana de cancelacion ya paso, el boton desaparece o queda inhabilitado segun el estado

### Admin

- AdminDashboard.jsx usa useMetricas
- disponibilidad en modo lectura solo muestra lo relevante del monitoreo

## 8) Base de datos y modelo

Archivo maestro:

- backend/prisma/schema.prisma

Modelos principales:

- Usuario
- PlantillaFranja
- Franja
- Reserva
- Asistencia
- Suspension
- Configuracion

Idea del modelo:

- PlantillaFranja define el patron semanal
- Franja representa la instancia concreta por fecha
- Reserva cuelga de una Franja y de un Usuario
- Configuracion guarda reglas operativas
- Suspension bloquea nuevas reservas

## 9) Reglas operativas reales

Las reglas que no deben quedar como arbitrarias estan centralizadas en BD:

- limite_reservas_activas
- max_reservas_por_dia
- anticipacion_reserva_min
- anticipacion_cancelacion_min
- ventana_checkin_min (usada por el motor de No-Show)
- umbral_noshow (cantidad de no_shows que activa la suspension)
- dias_suspension_por_noshow (duracion de la suspension aplicada al alcanzar el umbral)

Estas claves se leen en backend y el frontend consulta el endpoint de reglas para mostrar mensajes coherentes.

## 10) Scheduler

Archivos:

- backend/src/scheduler/noshow.scheduler.js
- backend/src/scheduler/noshow.processor.js

Responsabilidades:

- sincroniza franjas actuales segun plantillas
- crea lo que falta para la semana vigente
- elimina franjas fuera de ventana cuando es seguro hacerlo
- ejecuta el motor de No-Show cada 15 minutos (`*/15 * * * *`)

Motor de No-Show:

- lee `ventana_checkin_min`, `umbral_noshow` y `dias_suspension_por_noshow` desde `configuracion`
- busca reservas activas cuya franja ya vencio y que nunca recibieron asistencia
- cambia su `estado` a `no_show` (valor agregado al enum `EstadoReserva` por la migracion `20260602161100_add_no_show_estado_reserva`)
- cuando un usuario acumula `umbral_noshow` no_shows, crea una `Suspension` con `fechaFin = hoy + dias_suspension_por_noshow`
- en la misma transaccion Serializable cancela en cascada todas las reservas activas del usuario (libera cupos)
- es idempotente: usa `updateMany` con re-check de `estado` y `asistencia IS NULL` para no reprocesar
- registra logs `[NoShow]` por reserva y `[AUDIT][NoShow] SUSPENSION ...` por suspension aplicada
- tests: `npm run test:noshow` (6 tests en `tests/unit/noshow.test.js`)

## 11) Flujo end-to-end resumido

1. El usuario entra al frontend.
2. Se autentica contra el backend.
3. El frontend consulta reglas, franjas y reservas.
4. El usuario reserva o cancela.
5. El backend valida tiempo, cupos, limites, dia y suspension.
6. Prisma hace la escritura en PostgreSQL.
7. React Query refresca la UI.
8. El admin consulta metricas ya filtradas por vigencia real.

## 12) Lo que otra IA debe recordar

- no hardcodear ventanas ni limites de negocio en frontend
- no calcular cupos sin transaccion atomica
- respetar la zona horaria America/Bogota en decisiones de tiempo
- mantener separacion entre activas, historial y canceladas
- Swagger vive dentro del backend, no es un proyecto aparte
- el modulo configuracion es la fuente operativa real de reglas
- el no_show se modela como estado de la reserva (enum `EstadoReserva`), no como valor en `Asistencia.resultado`
- al suspender por no_show se cancelan en cascada las reservas activas del usuario (transaccion Serializable)
- la suspension automatica se considera ya cubierta por M2; no rehacerla
