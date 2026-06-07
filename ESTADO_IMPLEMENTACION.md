# Estado de Implementación BookGym - VERSIÓN INTEGRAL

Este documento resume lo que ya está cubierto por la implementación actual y lo que sigue faltando o quedó débil. Esta versión está alineada con el PDF de requerimientos de "Entregable BooKGym" y unifica los avances de los módulos de Check-in y Automatización.

## 0) Matriz de cumplimiento contra el PDF (RF/HU)

### Cubierto
- **RF1**: Autenticación con credenciales institucionales consumidas por el sistema.
- **RF2**: Control de acceso por roles estudiante y administrador.
- **RF3**: Consulta de franjas disponibles con cupos restantes.
- **RF4**: Creación de reserva con autenticación, validación de suspensión, límite activo y cupos.
- **RF5**: Bloqueo de reservas cuando la capacidad ya se llenó.
- **RF6**: Límite de reservas activas configurable desde base de datos.
- **RF7**: Cancelación antes del inicio del turno con liberación de cupo.
- **RF8**: Actualización cercana al tiempo real y prevención de sobre-reservas por concurrencia (mutex por franja + UPDATE atómico PostgreSQL).
- **RF9**: Historial persistente de reservas, cancelaciones y no_shows.
- **RF10**: Registro de asistencia dentro de ventana configurable con control por rol.
- **RF11**: Registro automático de no-show: cron `*/15 * * * *` marca estado `no_show` y, al acumular `umbral_noshow`, crea Suspension y cancela en cascada las reservas activas del usuario.
- **RF12**: Cálculo integral de tasa de ocupación, tasa de no-asistencia y clasificación pico/valle con análisis histórico.
- **RF13**: Consulta de métricas desde panel administrativo con heatmap y analisis granular.
- **RF14**: Promedio histórico por día y franja para estimar saturación, implementado vía `GET /api/metricas/recomendaciones` con personalización por usuario.
- **RF15**: Sugerencia de franjas alternativas ordenadas por menor saturación con afinidad personalizada (alta/media/neutra).
- **RF16**: Suspensiones temporales como regla operativa persistida en base de datos.
- **RF17**: Registro persistente de suspensiones como entidad de negocio.
- **RF18**: Almacenamiento solo de datos operativos necesarios.
- **Gestión admin de suspensiones**: Listar, crear manualmente y levantar suspensiones vía `GET/POST/DELETE /api/admin/suspensiones`.
- **Audit Trail**: Registro de auditoría para cambios en configuracion, creacion/levantamiento de suspensiones, y modificaciones de plantillas.
- **Historial de suspensiones**: Sección dedicada en AdminUsuarios para seguimiento de suspensiones manuales.
- **Mapa de calor (heatmap)**: Visualización de ocupación por día y franja horaria en el dashboard admin.
- **Análisis granular**: Por día/semana/mes/todo con desglose, comparación inter-periodo y detección de horas pico/valle.
- **Recomendaciones**: Botón de reserva directa desde recomendaciones en el home del estudiante.
- **Perfil de estudiante**: Estadísticas de uso completas en vista de perfil, con contador minimalista de inasistencias en home.

### Parcial
- **HU3**: Check-in al inicio del turno: el flujo de backend está listo, el frontend permite check-in desde MisCupos.
- **HU6**: Consulta de estado de cuenta y suspensiones activas en perfil: implementado en Perfil.jsx.

### Falta
- CRUD visual completo de franjas individuales desde admin (actualmente se gestionan plantillas).

---

## 1) Funcionalidades Cubiertas en Detalle

### Autenticación
- Login con JWT.
- Roles estudiante y administrador.
- Usuario demo para pruebas.
- Middleware de autenticación en rutas protegidas.

### Reservas
- Consultar disponibilidad semanal.
- Crear reserva con transacción para evitar sobreventa.
- Cancelar reserva con validación de anticipación.
- Listar reservas activas y historial por separado.
- Validación de suspensión activa, cupo, y máximos diarios.

### Asistencia / Check-in
- Endpoint `POST /api/reservas/:id/check-in`.
- Validación de estado activo de la reserva y control de propiedad (dueño o admin).
- Ventana configurable de check-in desde tabla de configuración.
- Transacción atómica para crear asistencia y marcar reserva como completada.
- Registro de autoría de quién realizó el check-in.

### Motor de No-Show (Automatización)
- Ubicación: `src/scheduler/noshow.processor.js` ejecutado por cron `*/15 * * * *`.
- Cambio de estado a `no_show` (vía migración).
- Aplicación de suspensiones automáticas al alcanzar el `umbral_noshow`.
- Cancelación en cascada de reservas activas del usuario suspendido con liberación de cupos.
- Auditoría: Logs `[NoShow]` y `[AUDIT][NoShow] SUSPENSION`.

### Análisis de Métricas (Admin)
- Endpoint `GET /api/metricas/resumen` con panel semanal.
- Endpoint `GET /api/metricas/analisis` con modos: día, semana, mes, todo.
- Comparación con periodo anterior (cambio porcentual).
- Detección de horas pico (>=75%) y valle (<25%).
- Tasa de no-show semanal y distribución de saturación.
- **Heatmap**: `GET /api/metricas/heatmap` con matriz días × franjas.

### Gestión Admin (Suspensiones y Configuración)
- Endpoints protegidos con `verificarToken` + `soloAdmin`.
- `GET /api/admin/suspensiones`: listar suspensiones con filtro opcional por activas.
- `POST /api/admin/suspensiones`: crear suspensión manual con validación de duplicados.
- `DELETE /api/admin/suspensiones/:id`: levantar suspensión y registrar admin ejecutor.
- `PUT /api/admin/configuracion/reglas-reserva`: actualizar las 7 claves de configuración con upsert.
- Retorna configuración completa actualizada tras cada PUT.
- `GET /api/admin/plantillas`: listar plantillas.
- `PUT /api/admin/plantillas/:id`: editar plantilla.

### Recomendaciones (Estudiante)
- Endpoint `GET /api/metricas/recomendaciones` con scoring personalizado.
- Afinidad alta/media basada en historial del usuario.
- Sección "Recomendados para ti" en home del estudiante.
- Botón de reserva directa desde cada recomendación.

### Perfil de Estudiante
- Estadísticas de uso (completadas, no-shows, activas).
- Anillo de progreso de asistencia.
- Distribución semanal con gráfico de barras.
- Contador de inasistencias con indicador de riesgo.
- Historial de suspensiones y modo oscuro.

### Auditoría
- Registro automático en `audit_log` para:
  - Cambios en configuración (`actualizar_config`)
  - Creación de suspensiones manuales (`crear_suspension`)
  - Levantamiento de suspensiones (`levantar_suspension`)
  - Modificaciones de plantillas (`actualizar_plantilla`)
- Filtro por entidad vía query param `?entidad=`

---

## 2) Calidad Técnica y Riesgos

### Pruebas Realizadas
- ✅ **Suite completa**: 113+ tests, 12 suites, 0 fallos.
- ✅ **Módulos cubiertos**: auth, franjas, reservas, asistencia, métricas, configuración, admin (suspensiones + configuración), integración, vulnerabilidades, concurrencia.
- ✅ **Base de datos real**: todos los tests se ejecutan contra PostgreSQL (sin mocks).
- ✅ **Aislamiento**: usuarios prefijo `TST_`, cleanup en `afterEach`, orden FK correcto.
- ✅ **Pruebas de seguridad**: SQL injection, XSS, control de acceso, tokens inválidos/expirados, CORS, edge cases.
- ✅ **Pruebas de concurrencia**: 5 usuarios concurrentes contra 3 cupos, verificando consistencia.
- ✅ **Bug fixes**: metricas.service.js, app.js, franjas.service.js, helpers.js.

### Riesgos Actuales
- Credenciales demo visibles para evaluación.
- La lógica de tiempo depende estrictamente de `America/Bogota`.
- Si se cambian las reglas en BD, el frontend debe consultar el endpoint de configuración para reflejarlas.
- El mutex por franja es intra-proceso (no funciona con múltiples instancias del backend). Para escalar horizontalmente se necesita un lock distribuido (Redis).
- Rate limiting básico (5 intentos/15min en auth).

## 3) Plan de Desarrollo por Módulos

| Módulo | Enfoque | Prioridad | Estado |
|--------|---------|-----------|--------|
| **M1 — Check-in** | Flujo de asistencia completo | Alta | Cubierto (Backend + Frontend) |
| **M2 — Auto** | No-show + Suspensiones en cascada | Alta | Completado ✅ |
| **M3 — Métricas** | Heatmap, analisis granular, recomendaciones | Media | Completado ✅ |
| **M4 — CRUDs** | Gestión visual de plantillas y auditoría | Media | Completado ✅ |
| **M5 — Calidad** | Pruebas formales y seguridad avanzada | Alta | Completado ✅ (113+ tests, 12 suites, 0 fallos. Concurrencia, vulnerabilidades, integración) |

## 4) Criterio de lectura para la IA
- El backend es la única fuente de verdad para cupos y ventanas de tiempo.
- No hardcodear límites en la UI; usar `GET /api/configuracion/reglas-reserva`.
- Mantener separación estricta entre reservas activas, historial y canceladas.
- El sistema audita en `audit_log` para config, suspensiones y plantillas.
- El heatmap se sirve desde `GET /api/metricas/heatmap`.
