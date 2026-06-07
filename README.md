# BookGym

BookGym es un prototipo funcional de reservas para gimnasio universitario, con backend REST y frontend web, diseñado para demostrar reglas de negocio reales de cupos, tiempos y control por rol.

## 1) Arquitectura general

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite + TanStack Query + Tailwind
- Documentacion API: Swagger/OpenAPI integrado en el backend

Estructura del repositorio:

- `backend/`: API, reglas de negocio, acceso a datos, scheduler
- `frontend/`: interfaz de estudiante y administrador
- `CONTEXT.md`: Arquitectura detallada para agentes de IA
- `ESTADO_IMPLEMENTACION.md`: Matriz de cumplimiento y estado por modulo

## 2) Funcionalidades principales

### Estudiante
- Inicio de sesión con credenciales institucionales
- Exploración de franjas disponibles con cupos en tiempo real
- Creación y cancelación de reservas
- Check-in con ventana configurable
- Recomendaciones personalizadas por horario
- Perfil con estadísticas de uso, inasistencias y suspensiones
- Soporte para modo oscuro

### Administrador
- Dashboard analítico con KPIs y tendencias
- Mapa de calor de ocupación por día y franja
- Análisis granular por día/semana/mes/todo
- Gestión de suspensiones (crear, listar, levantar)
- Configuración de reglas operativas (límites, ventanas, umbrales)
- Gestión de plantillas de franja (activar/desactivar, editar)
- Escáner QR/código de barras para check-in
- Historial de cambios y auditoría

### Automatización
- Sincronización automática de franjas según plantillas
- No-show detection y suspensiones automáticas en cascada
- Scheduler cada 15 minutos

## 3) Reglas de negocio clave

Todas las reglas críticas están en backend y sus parámetros operativos viven en la tabla `configuracion` de la base de datos.

Claves de configuración:
- `limite_reservas_activas` — Máximo de reservas activas simultáneas
- `max_reservas_por_dia` — Máximo de reservas por día
- `anticipacion_reserva_min` — Anticipación mínima para reservar (minutos)
- `anticipacion_cancelacion_min` — Anticipación mínima para cancelar (minutos)
- `umbral_noshow` — Inasistencias acumuladas que activan suspensión
- `ventana_checkin_min` — Ventana de check-in (minutos antes/después)
- `dias_suspension_por_noshow` — Días de suspensión automática

## 4) API Endpoints

### Públicos
- `GET /health` — Estado del servidor
- `POST /api/auth/login` — Inicio de sesión

### Estudiante (requiere token)
- `GET /api/franjas/semana?fecha=YYYY-MM-DD` — Disponibilidad semanal
- `GET /api/reservas` — Reservas activas
- `GET /api/reservas/historial` — Historial de reservas
- `POST /api/reservas` — Crear reserva
- `DELETE /api/reservas/:id` — Cancelar reserva
- `POST /api/reservas/:id/check-in` — Check-in
- `GET /api/metricas/recomendaciones?limite=5` — Recomendaciones personalizadas
- `GET /api/configuracion/reglas-reserva` — Reglas operativas

### Admin (requiere token admin)
- `GET /api/metricas/resumen?fecha=YYYY-MM-DD` — Panel semanal
- `GET /api/metricas/analisis?tipo=semana|dia|mes|todo` — Análisis granular
- `GET /api/metricas/heatmap?tipo=semana|dia|mes|todo` — Mapa de calor
- `GET /api/admin/suspensiones` — Listar suspensiones
- `POST /api/admin/suspensiones` — Crear suspensión manual
- `DELETE /api/admin/suspensiones/:id` — Levantar suspensión
- `GET /api/admin/suspensiones/usuarios` — Listar usuarios con estado
- `PUT /api/admin/configuracion/reglas-reserva` — Actualizar reglas
- `GET /api/admin/configuracion/audit-log?entidad=` — Historial de cambios
- `GET /api/admin/plantillas` — Listar plantillas
- `PUT /api/admin/plantillas/:id` — Editar plantilla
- `GET /api/admin/scanner/verificar/:cedula` — Verificar estudiante
- `POST /api/admin/scanner/checkin/:idReserva` — Check-in admin

## 5) Arranque local

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
4. Configurar `VITE_API_URL` (ej: `http://localhost:3000/api`)
5. `npm run dev`

### Usuarios demo

| Usuario | Perfil | Password |
|---------|--------|----------|
| `EST001` | El cumplido — historial limpio | `password123` |
| `EST002` | El infractor — 3 no-shows, suspendido | `password123` |
| `EST003` | El suspendido — suspension manual activa | `password123` |
| `EST004` | El puntual — 8 check-ins historicos | `password123` |
| `EST005` | El indeciso — 4 cancelaciones | `password123` |
| `EST006` | El frecuente — 10 check-ins | `password123` |
| `EST007` | El nuevo — sin historial | `password123` |
| `1103100844` | Dev — 1 historico + 1 activa semanal | `password123` |
| `ADM001` | Administrador | `password123` |

### Swagger

- Local UI: `http://localhost:3000/api/docs`
- Local JSON: `http://localhost:3000/api/docs.json`

## 6) Despliegue Railway

### Backend (servicio API)
- Root Directory: `backend`
- Build: `npm install && npx prisma generate`
- Start: `node src/server.js`

### Frontend (servicio web)
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Start: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Variable: `VITE_API_URL=https://bookgym-production.up.railway.app/api`

## 7) Tests

```bash
cd backend
npm test
```

Suite completa con 113+ tests: auth, franjas, reservas, asistencia, métricas, configuración, admin, integración, vulnerabilidades y concurrencia.

## 8) Auditoría

El sistema registra cambios en `audit_log` para:
- Actualización de reglas operativas
- Creación y levantamiento de suspensiones
- Modificaciones de plantillas de franja

Consulta: `GET /api/admin/configuracion/audit-log?entidad=configuracion|suspension|plantilla_franja`
