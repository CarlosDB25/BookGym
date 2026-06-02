# Estado de Implementacion BookGym

Este documento resume lo que ya esta cubierto por la implementacion actual y lo que sigue faltando o quedo debil. Esta version ya esta alineada con el PDF de requerimientos de "Entregable BooKGym".

## 0) Matriz resumida contra el PDF

### Cubierto

- RF1 autenticacion con credenciales institucionales consumidas por el sistema
- RF2 control de acceso por roles estudiante y administrador
- RF3 consulta de franjas disponibles con cupos restantes
- RF4 creacion de reserva con autenticacion, suspension, limite activo y cupos
- RF5 bloqueo de reservas cuando la capacidad ya se lleno
- RF6 limite de reservas activas configurable desde base de datos
- RF7 cancelacion antes del inicio del turno con liberacion de cupo
- RF8 actualizacion cercana al real y prevencion de sobre-reservas por concurrencia
- RF9 historial persistente de reservas, cancelaciones y no_shows
- RF11 registro automatico de no-show: cron */15 * * * * marca estado `no_show` y, al acumular umbral_noshow, crea Suspension y cancela en cascada las reservas activas del usuario
- RF10 registro de asistencia dentro de ventana configurable con control por rol
- RF13 consulta de metricas desde panel administrativo
- RF16 suspensiones temporales como regla operativa persistida en base de datos
- RF17 registro persistente de suspensiones como entidad de negocio
- RF18 almacenamiento solo de datos operativos necesarios
- HU1, HU2, HU4, HU7, HU9 en la parte que corresponde a reservas, metricas y suspensiones persistidas

### Parcial

- (sin pendientes: RF11 movido a Cubierto por el motor de No-Show)
- RF12 calculo integral de tasa de ocupacion, tasa de no-asistencia y clasificacion pico/valle: cubierto (incluye analisis historico 6 semanas)
- RF14 promedio historico por dia y franja para estimar saturacion: cubierto (endpoint GET /api/recomendaciones)
- RF15 sugerencia de franjas alternativas ordenadas por menor saturacion: cubierto (GET /api/recomendaciones)
- HU5 recomendaciones de menor saturacion: falta la vista o algoritmo de recomendacion completo
- HU6 consulta de estado de cuenta y suspensiones activas en perfil: la suspension existe como regla, pero no el flujo de perfil completo

### Falta

- motor historico de saturacion con promedios por dia y franja
- recomendaciones de horarios alternativos para el estudiante
- panel administrativo para gestionar suspensiones activas y levantarlas manualmente
- CRUD visual de plantillas, franjas y configuracion operativa
- pruebas automaticas formales para reservas, check-in, metricas y control de comportamiento

## 1) Cubierto actualmente

### Autenticacion

- login con JWT
- roles estudiante y administrador
- usuario demo para pruebas
- middleware de autenticacion en rutas protegidas

### Reservas

- consultar disponibilidad semanal
- crear reserva
- cancelar reserva
- listar reservas activas
- listar historial de reservas
- validacion de suspension activa
- validacion de cupo disponible
- validacion de anticipacion para reservar
- validacion de anticipacion para cancelar
- validacion de maximo de reservas activas
- validacion de maximo de reservas por dia
- transaccion para evitar sobreventa
- actualizacion automatica de cupos

### Franjas

- plantillas semanales
- instancias por fecha
- filtrado de franjas ya no reservables
- saturacion por baja / media / alta
- scheduler para sincronizacion semanal

### Administrador

- panel de metricas
- vista de agenda en modo lectura
- valores de metricas filtrados por vigencia real
- exclusion de reservas canceladas
- exclusion de franjas vencidas o fuera de ventana

### Configuracion

- reglas operativas en base de datos
- lectura dinamica desde backend
- reglas expuestas al frontend por endpoint propio

### Documentacion

- Swagger/OpenAPI integrado
- README raiz
- README backend
- README frontend

### Asistencia / Check-in

- endpoint POST /api/reservas/:id/check-in
- validacion de existencia y estado activo de la reserva
- control de propiedad (usuario dueno o admin)
- ventana configurable de check-in desde configuracion
- transaccion atomica para crear asistencia y marcar reserva como completada
- registro de quien realizo el check-in

### UX

- modal de confirmacion para reservar
- modal de confirmacion para cancelar
- toast de retroalimentacion
- historial separado de activas
- polling automatico para no recargar la pagina

## 2) Cubierto parcialmente

### Administracion avanzada

- existe panel de lectura
- CRUD completo de plantillas/franjas desde UI ?
- CRUD visual de suspensiones ?
- UI para editar configuracion operativa ?

### Observabilidad

- hay logs por consola
- no hay auditoria persistente
- no hay sistema de trazabilidad historica de cambios administrativos

## 3) Falta o quedo debil

### Funcionalidad faltante

- registro de asistencia desde admin
- gestion de plantillas de franjas desde frontend (en construccion en M4)
- edicion visual de reglas en configuracion (en construccion en M4)
- notificaciones por correo o mensajeria

### No-Show

- ✅ Motor de No-Show en `src/scheduler/noshow.processor.js` ejecutado por cron `*/15 * * * *`
- ✅ Cambia estado de la reserva a `no_show` (nuevo valor en enum `EstadoReserva` via migración `20260602161100_add_no_show_estado_reserva`)
- ✅ Lee `ventana_checkin_min`, `umbral_noshow` y `dias_suspension_por_noshow` desde `configuracion`
- ✅ Crea `Suspension` con `fechaFin = hoy + dias_suspension_por_noshow` al alcanzar el umbral
- ✅ Cancela en cascada las reservas activas del usuario suspendido (transaccional, libera cupos)
- ✅ Logs de auditoría: `[NoShow]` por reserva y `[AUDIT][NoShow] SUSPENSION ...` por suspensión aplicada
- ✅ Tests unitarios: `npm run test:noshow` (6 tests pasan: cambio de estado, idempotencia, franjas no vencidas, suspensión con cancelación en cascada, no duplicar suspensión)


### Seguridad y operacion

- rate limiting en login ? (5 intentos/15min)
- auditoria de cambios administrativos
- mayor cobertura de pruebas automaticas
- manejo formal de errores por tipo HTTP en algunos endpoints
- monitoreo externo o APM

### Calidad tecnica

- varias reglas importantes ya se centralizaron en BD, pero aun conviene reducir duplicacion de validaciones entre servicios
- pruebas unitarias e integracion ? (10 tests)
- pruebas de concurrencia especificas para reservas simultaneas ?

## 4) Riesgos actuales

- credenciales demo visibles para evaluacion
- concurrencia extrema siempre debe validarse con pruebas reales de carga
- si se cambian las reglas en BD, el frontend depende del endpoint de configuracion para reflejarlas correctamente
- la logica de tiempo depende de America/Bogota, por lo que cualquier cambio de zona horaria debe revisarse con cuidado

## 5) Plan de desarrollo por módulos iterativos

El desarrollo pendiente se organiza en 5 módulos entregables en orden de prioridad:

| Módulo | Enfoque | Prioridad |
|--------|---------|-----------|
| **M1 — Check-in** | Completar flujo de asistencia (endpoint existe, falta robustez) | Alta |
| **M2 — Automatización** ✅ | No-show automático (cron */15) + suspensiones con cancelación en cascada | Alta |
| **M3 — Métricas históricas** | Promedios por día/franja + recomendaciones | Media |
| **M4 — CRUDs administrativos** | Suspensiones, plantillas, configuración desde UI | Media |
| **M5 — Calidad y seguridad** | Rate limiting, pruebas unitarias y de concurrencia | Alta |

Cada módulo es autocontenido y puede desarrollarse sin esperar a los anteriores, aunque M2 depende del flujo de M1 para cerrar el ciclo de no-show.

## 6) Criterio de lectura para la IA

Si esta IA va a seguir el proyecto, debe asumir que:

- las reglas no se deben hardcodear en la UI
- el backend es la unica fuente de verdad para cupos y ventanas de tiempo
- el historial existe para no mezclar reservas ya vencidas o canceladas con las activas
- el admin solo debe ver datos vigentes para calcular metricas
