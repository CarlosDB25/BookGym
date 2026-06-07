# CONTEXT BookGym

Este archivo resume la arquitectura exacta del proyecto para que otra IA entienda rapido como esta organizado, que tecnologias usa y como se conectan sus rutas, hooks y servicios.

## 1) Proposito del sistema

BookGym es un prototipo funcional de reservas para gimnasio universitario. El sistema permite:

- autenticacion de estudiante y administrador
- consulta de disponibilidad semanal
- creacion y cancelacion de reservas
- separacion entre reservas activas e historial
- panel administrativo con metricas semanales y mapa de calor
- sincronizacion automatica de franjas por scheduler
- reglas operativas guardadas en base de datos
- check-in con escaner QR/codigo de barras
- no-show automatico con suspensiones en cascada
- auditoria de cambios en configuracion, suspensiones y plantillas

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
- recharts (graficas)
- framer-motion (animaciones)
- @tanstack/react-table (tablas)
- html5-qrcode (escaner)
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
- asistencia: check-in con validacion de ventana
- metricas: resumen semanal, analisis (dia/semana/mes/todo), recomendaciones personalizadas, heatmap
- configuracion: reglas operativas leidas desde BD
- admin/suspensiones: CRUD suspensiones + listar usuarios
- admin/configuracion: actualizar reglas + audit log
- admin/scanner: verificar estado estudiante + check-in
- admin/plantillas: activar/desactivar/editar plantillas de franja
- scheduler: sincronizacion automatica de franjas + no-show
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

Ruta: POST /api/auth/login
Flujo: auth.routes.js -> auth.controller.js -> auth.service.js -> prisma.usuario
Uso: valida credenciales, retorna JWT, guarda rol e id institucional en el token

### Franjas

Ruta: GET /api/franjas/semana?fecha=YYYY-MM-DD
Flujo: franjas.routes.js -> franjas.controller.js -> franjas.service.js -> prisma.franja + plantilla_franja
Uso: devuelve disponibilidad semanal, filtra franjas ya no reservables, calcula saturacion, usa regla de anticipacion

### Reservas

Rutas:
- GET /api/reservas (activas)
- GET /api/reservas/historial
- POST /api/reservas (crear)
- DELETE /api/reservas/:id (cancelar)

Flujo: reservas.routes.js -> reservas.controller.js -> reservas.service.js -> prisma.reserva + franja + suspension + configuracion
Reglas criticas: limite activas, maximo por dia, ventana de tiempo, transaccion serializable, mutex por franja

### Asistencia / Check-in

Ruta: POST /api/reservas/:id/check-in
Flujo: asistencia.routes.js -> asistencia.controller.js -> asistencia.service.js -> prisma.asistencia + reserva

### Metricas

Rutas:
- GET /api/metricas/resumen (panel semanal admin)
- GET /api/metricas/analisis?tipo=semana|dia|mes|todo (analisis granular)
- GET /api/metricas/recomendaciones (recomendaciones personalizadas estudiante)
- GET /api/metricas/heatmap?tipo=semana|dia|mes|todo (mapa de calor)

Flujo: metricas.routes.js -> metricas.controller.js -> metricas.service.js -> prisma.franja + reserva + configuracion

### Configuracion

Ruta: GET /api/configuracion/reglas-reserva
Flujo: configuracion.routes.js -> configuracion.controller.js -> configuracion.service.js -> prisma.configuracion

### Admin / Suspensiones

Rutas:
- GET /api/admin/suspensiones (listar)
- POST /api/admin/suspensiones (crear manual)
- DELETE /api/admin/suspensiones/:id (levantar)
- GET /api/admin/suspensiones/usuarios (listar con estado)

Audita en audit_log: crear_suspension, levantar_suspension

### Admin / Configuracion

Rutas:
- PUT /api/admin/configuracion/reglas-reserva (actualizar reglas)
- GET /api/admin/configuracion/audit-log (historial de cambios, filtro por entidad)

### Admin / Plantillas

Rutas:
- GET /api/admin/plantillas (listar)
- PUT /api/admin/plantillas/:id (actualizar hora/capacidad/activa)

Audita en audit_log: actualizar_plantilla

### Admin / Scanner

Rutas:
- GET /api/admin/scanner/verificar/:cedula (estado en tiempo real)
- POST /api/admin/scanner/checkin/:idReserva (check-in admin)

### Salud

Ruta: GET /health
Uso: confirma que el backend esta arriba

### Swagger

Documentacion en backend/src/docs/swagger.js, montado en app.js
Rutas: /api/docs, /api/docs.json

## 6) Estructura exacta del frontend

Punto de entrada: frontend/src/main.jsx
Cadena: main.jsx monta QueryClientProvider -> App.jsx decide vista segun usuario y rol -> pages consumen hooks -> hooks usan Axios + React Query -> components renderizan UI

### Pages

- Login.jsx
- TerminosCondiciones.jsx
- PoliticaPrivacidad.jsx
- Student: HomeRecomendaciones.jsx, ExploradorFranjas.jsx, MisCupos.jsx, Perfil.jsx
- Admin: DashboardAnalitico.jsx, ScannerHub.jsx, AdminUsuarios.jsx, AdminConfig.jsx

### Hooks

- useAuth.js
- useFranjas.js
- useReservas.js (incluye useRecomendaciones, useCrearReserva, useCancelarReserva, useCheckinReserva)
- useMetricas.js (incluye useMetricasResumen, useMetricasAnalisis, useMetricasHeatmap)
- useReglasReserva.js
- useAdmin.js (incluye useAdminSuspensiones, useCrearSuspension, useLevantarSuspension, useActualizarReglas, useAuditLog, usePlantillas, useActualizarPlantilla, useSuspensionHistorial)
- useDarkMode.js

### Components

- shared: Logo.jsx, Icons.jsx
- ui: ActionModal.jsx, EmptyState.jsx, ErrorBoundary.jsx, SaturacionBadge.jsx, SkeletonLoader.jsx, Toast.jsx

### Layouts

- StudentMobileLayout.jsx (bottom nav mobile + sidebar desktop)
- AdminDesktopLayout.jsx (sidebar fijo + topbar)

### Utils

- time.js (dayjs con timezone America/Bogota)

### Config

- axios.js (instancia Axios con base URL y token)

## 7) Como se conecta el frontend con el backend

### Login
Login.jsx llama useAuth/login -> POST /api/auth/login -> token en localStorage

### Disponibilidad
ExploradorFranjas.jsx usa useFranjas y useReservas -> GET /api/franjas/semana + GET /api/reservas

### Home (estudiante)
HomeRecomendaciones.jsx usa useRecomendaciones, useReservas, useHistorialReservas, useReglasReserva
Muestra recomendaciones personalizadas, proxima reserva y contador de inasistencias

### Mis reservas
MisCupos.jsx usa useReservas y useHistorialReservas -> tabs activas/historial

### Perfil
Perfil.jsx usa useHistorialReservas, useReservas, useRecomendaciones -> estadisticas de uso, inasistencias, tema

### Admin Dashboard
DashboardAnalitico.jsx usa useMetricasResumen, useMetricasAnalisis, useMetricasHeatmap
KPIs con sparklines, grafico de barras, donut, mapa de calor, tendencia

### Admin Usuarios
AdminUsuarios.jsx usa useAdminSuspensiones, useLevantarSuspension, useSuspensionHistorial
Tabla con paginacion, drawer con detalle, historial de suspensiones

### Admin Config
AdminConfig.jsx tabs: Reglas de Reserva, Tiempos de Check-in, Gestion de Plantillas, Historial de Cambios

### Scanner
ScannerHub.jsx usa html5-qrcode + API admin/scanner -> camara y modo manual

## 8) Base de datos y modelo

Archivo maestro: backend/prisma/schema.prisma

Modelos principales:
- Usuario (idInstitucional, rol, estado, password)
- PlantillaFranja (diaSemana, horaInicio, horaFin, capacidadMaxima, activa)
- Franja (idPlantilla, fecha, semestre, cuposDisponibles)
- Reserva (idUsuario, idFranja, estado: activa|cancelada|completada|no_show)
- Asistencia (idReserva, registradoPor, resultado: presente|no_show)
- Suspension (idUsuario, fechaInicio, fechaFin, motivo, activa, levantadaPor)
- Configuracion (clave, valor, descripcion)
- AuditLog (accion, entidad, idEntidad, detalle, idUsuario)

## 9) Reglas operativas reales

Centralizadas en BD (tabla configuracion):
- limite_reservas_activas
- max_reservas_por_dia
- anticipacion_reserva_min
- anticipacion_cancelacion_min
- umbral_noshow
- ventana_checkin_min
- dias_suspension_por_noshow

## 10) Scheduler

Archivo: backend/src/scheduler/noshow.scheduler.js
- Sincroniza franjas actuales segun plantillas
- Crea lo que falta para la semana vigente
- Elimina franjas fuera de ventana cuando es seguro
- Cron cada 15 minutos: marca no-show y aplica suspensiones automaticas

## 11) Audit Trail

El sistema audita en la tabla audit_log:
- actualizar_config: cambios en reglas operativas (desde admin.configuracion.service)
- crear_suspension: suspension manual creada (desde admin.suspensiones.service)
- levantar_suspension: suspension levantada manualmente (desde admin.suspensiones.service)
- actualizar_plantilla: cambios en plantillas de franja (desde admin.plantillas.service)

## 12) Lo que otra IA debe recordar

- no hardcodear ventanas ni limites de negocio en frontend
- no calcular cupos sin transaccion atomica
- respetar la zona horaria America/Bogota en decisiones de tiempo
- mantener separacion entre activas, historial y canceladas
- Swagger vive dentro del backend, no es un proyecto aparte
- el modulo configuracion es la fuente operativa real de reglas
- los estilos son consistentes entre admin y estudiante (misma paleta, mismos componentes UI)
- el layout admin es desktop-first con sidebar fijo, el de estudiante es mobile-first con bottom nav
- todas las graficas usan recharts
- el heatmap usa grid CSS con colores de ocupacion
- el audit log permite filtrar por entidad (?entidad=)
