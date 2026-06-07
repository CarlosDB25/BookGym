# Frontend BookGym

Cliente web del sistema de reservas de gimnasio universitario con dos experiencias: **estudiante** (mobile-first) y **administrador** (desktop sidebar).

---

## 1) Stack técnico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI declarativa por componentes |
| Vite | 6 | Bundler y dev server |
| Axios | 1.13 | Cliente HTTP con interceptores |
| TanStack Query | 5.95 | Fetch, caché, polling e invalidaciones |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Framer Motion | 12 | Animaciones de layouts y modales |
| Recharts | 3.8 | Gráficos del dashboard admin |
| html5-qrcode | 2.3 | Escáner QR/código de barras |
| Dayjs | 1.11 | Manejo de fechas con timezone |

---

## 2) Configuración del entorno

### Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `VITE_API_URL` | Sí | URL base del backend | `http://localhost:3000/api` |

### Archivos

| Archivo | Propósito |
|---|---|
| `.env.example` | Plantilla con valores de desarrollo |
| `.env` | Variables locales (no versionado) |

> ⚠️ **Buena práctica**: `.env.production`, `.env.development` y `.env.staging` **no deben versionarse**. Las variables de entorno se inyectan en tiempo de build/deploy según el ambiente.

### Scripts

```bash
npm run dev        # Desarrollo con HMR
npm run build      # Build de producción
npm run preview    # Vista previa del build
npm run lint       # ESLint
npm run test:e2e   # Tests de integración frontend ↔ backend
```

---

## 3) Arquitectura general

```
src/
├── main.jsx              # Bootstrap: QueryClient → ErrorBoundary → Router
├── App.jsx               # Router principal con autenticación y layouts
├── index.css             # Estilos globales + animaciones
├── config/
│   └── axios.js          # Instancia Axios con interceptores
├── utils/
│   └── time.js           # Utilidades de fecha/hora (America/Bogota)
├── hooks/                # React Query hooks (1 por dominio)
│   ├── useAuth.js
│   ├── useFranjas.js
│   ├── useReservas.js
│   ├── useMetricas.js
│   ├── useReglasReserva.js
│   └── useAdmin.js
├── components/
│   ├── ui/               # Componentes reutilizables
│   │   ├── ActionModal.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── SaturacionBadge.jsx
│   │   ├── SkeletonLoader.jsx
│   │   └── Toast.jsx
│   └── shared/           # Componentes compartidos
│       ├── Icons.jsx     (30+ iconos SVG)
│       └── Logo.jsx
├── layouts/
│   ├── StudentMobileLayout.jsx   # Layout mobile estudiante (bottom nav)
│   └── AdminDesktopLayout.jsx    # Layout desktop admin (sidebar)
└── pages/
    ├── Login.jsx
    ├── TerminosCondiciones.jsx
    ├── PoliticaPrivacidad.jsx
    ├── student/
    │   ├── HomeRecomendaciones.jsx
    │   ├── ExploradorFranjas.jsx
    │   ├── MisCupos.jsx
    │   └── Perfil.jsx
    └── admin/
        ├── DashboardAnalitico.jsx
        ├── ScannerHub.jsx
        ├── AdminUsuarios.jsx
        └── AdminConfig.jsx
```

---

## 4) Conexión con el backend

### Cliente Axios (`src/config/axios.js`)

- Base URL desde `VITE_API_URL` (fallback `http://localhost:3000/api`)
- Timeout: 30s
- Request interceptor: inyecta token JWT desde `localStorage`
- Response interceptor:
  - **401/403**: limpia sesión y redirige a `/login`
  - **504**: lanza `CustomEvent('app-toast')` (para futuro manejo de timeouts en métricas)

### Mapa completo de endpoints

| Frontend (hook/página) | Método | Endpoint | Backend (archivo) |
|---|---|---|---|
| `useAuth` | POST | `/auth/login` | `auth.routes.js` |
| `useFranjas` | GET | `/franjas/semana?fecha=` | `franjas.routes.js` |
| `useReservas` | GET | `/reservas` | `reservas.routes.js` |
| `useHistorialReservas` | GET | `/reservas/historial` | `reservas.routes.js` |
| `useCrearReserva` | POST | `/reservas` | `reservas.routes.js` |
| `useCancelarReserva` | DELETE | `/reservas/:id` | `reservas.routes.js` |
| `useCheckinReserva` | POST | `/reservas/:id/check-in` | `asistencia.routes.js` |
| `useRecomendaciones` | GET | `/metricas/recomendaciones` | `metricas.routes.js` |
| `useMetricasResumen` | GET | `/metricas/resumen?fecha=` | `metricas.routes.js` |
| `useMetricasAnalisis` | GET | `/metricas/analisis` | `metricas.routes.js` |
| `useReglasReserva` | GET | `/configuracion/reglas-reserva` | `configuracion.routes.js` |
| `useAdminSuspensiones` | GET | `/admin/suspensiones/usuarios` | `admin.suspensiones.routes.js` |
| `useCrearSuspension` | POST | `/admin/suspensiones` | `admin.suspensiones.routes.js` |
| `useLevantarSuspension` | DELETE | `/admin/suspensiones/:id` | `admin.suspensiones.routes.js` |
| `useActualizarReglas` | PUT | `/admin/configuracion/reglas-reserva` | `admin.configuracion.routes.js` |
| ScannerHub (directo) | GET | `/admin/scanner/verificar/:cedula` | `admin.scanner.routes.js` |
| ScannerHub (directo) | POST | `/admin/scanner/checkin/:id` | `admin.scanner.routes.js` |

### Forma de las respuestas de la API

**`GET /reservas` y `GET /reservas/historial`:**
```json
[{
  "id": "uuid",
  "idUsuario": "EST001",
  "idFranja": "uuid",
  "fechaCreacion": "2026-03-20T11:10:00.000Z",
  "estado": "activa",
  "franja": {
    "id": "uuid",
    "fecha": "2026-03-20T00:00:00.000Z",
    "semestre": "2026-1",
    "cuposDisponibles": 20,
    "plantilla": {
      "id": "uuid",
      "diaSemana": "lunes",
      "horaInicio": "08:00",
      "horaFin": "09:00",
      "capacidadMaxima": 30,
      "activa": true
    }
  }
}]
```

> ⚠️ Las propiedades `horaInicio`, `horaFin` y `diaSemana` están **anidadas** en `franja.plantilla.*` (no directamente en `franja.*`). El frontend accede con el patrón `franja?.plantilla?.horaInicio || franja?.horaInicio || ''` para compatibilidad con ambos formatos.

**`GET /franjas/semana`:**
```json
[{
  "id": "uuid",
  "fecha": "2026-03-24T00:00:00.000Z",
  "diaSemana": "martes",
  "horaInicio": "18:00",
  "horaFin": "19:00",
  "capacidadMaxima": 20,
  "cuposDisponibles": 11,
  "saturacion": "media"
}]
```

> ℹ️ Este endpoint **aplana** los datos de `plantilla` directamente en el objeto franja.

---

## 5) Hooks — React Query

Cada hook encapsula una consulta o mutación con su propia configuración de caché y polling.

| Hook | Query Key | refetchInterval | staleTime | Uso |
|---|---|---|---|---|
| `useAuth()` | — (no RQ) | — | — | Login/logout, state en localStorage |
| `useFranjas(fechaLunes)` | `['franjas-semana', fecha]` | global | 0 | Franjas semanales |
| `useReservas()` | `['mis-reservas']` | 10s | 0 | Reservas activas del usuario |
| `useHistorialReservas()` | `['historial-reservas']` | 15s | 0 | Historial de reservas |
| `useRecomendaciones(5)` | `['recomendaciones', 5]` | 30s | 30s | Recomendaciones personalizadas |
| `useMetricasResumen(fecha)` | `['metricas-resumen', fecha]` | 15s | 0 | KPIs del dashboard admin |
| `useMetricasAnalisis(tipo, fecha)` | `['metricas-analisis', ...]` | — | 60s | Datos semanales para gráficos |
| `useReglasReserva()` | `['reglas-reserva']` | 60s | 60s | Reglas operativas desde BD |
| `useAdminSuspensiones()` | `['admin-suspensiones']` | 15s | 0 | Lista de suspensiones |
| `useCrearReserva()` | Mutación | — | — | Invalida franjas + reservas |
| `useCancelarReserva()` | Mutación | — | — | Invalida franjas + reservas |
| `useCheckinReserva()` | Mutación | — | — | Invalida reservas |
| `useCrearSuspension()` | Mutación | — | — | Invalida suspensiones |
| `useLevantarSuspension()` | Mutación | — | — | Invalida suspensiones |
| `useActualizarReglas()` | Mutación | — | — | Invalida **todas** las queries |

---

## 6) Páginas y rutas

### Estudiante (mobile-first)

| Ruta | Página | Descripción |
|---|---|---|
| `/home` | `HomeRecomendaciones` | Dashboard con recomendaciones personalizadas + reglas activas |
| `/explorar` | `ExploradorFranjas` | Selector semanal con capacidad, saturación y botón de reserva |
| `/mis-cupos` | `MisCupos` | Reservas activas (check-in, cancelación) + historial con badges de estado |
| `/perfil` | `Perfil` | Datos del usuario, streaks, estadísticas, alertas de suspensión |

### Administrador (desktop sidebar)

| Ruta | Página | Descripción |
|---|---|---|
| `/admin` | `DashboardAnalitico` | KPIs con sparklines, gráficos de barras, donut de estados, mapa de calor, tendencia, filtros semana/diario/mensual/siempre |
| `/admin/scanner` | `ScannerHub` | Escáner QR + ingreso manual para check-in administrativo |
| `/admin/usuarios` | `AdminUsuarios` | Tabla de usuarios con búsqueda por ID, filtros, suspensión manual, historial de auditoría |
| `/admin/config` | `AdminConfig` | Sliders para configurar reglas operativas (7 parámetros) |

### Públicas

| Ruta | Página | Descripción |
|---|---|---|
| `/login` | `Login` | Autenticación con credenciales institucionales |
| `/terminos` | `TerminosCondiciones` | Términos y condiciones legales |
| `/privacidad` | `PoliticaPrivacidad` | Política de privacidad |

---

## 7) Componentes UI

| Componente | Props | Propósito |
|---|---|---|
| `Toast` | `{ notice, onClose, duration }` | Notificación animada (success/error/warning/info) |
| `ActionModal` | `{ open, type, title, lines, onClose, onConfirm }` | Modal de confirmación/detalle con variantes visuales |
| `EmptyState` | `{ icon, title, message, action }` | Estado vacío con icono y mensaje |
| `SkeletonLoader` | `{ className, lines }` | Esqueleto de carga con shimmer |
| `CardSkeleton` | `{ className }` | Esqueleto tipo card |
| `SaturacionBadge` | `{ nivel, className }` | Badge de saturación (baja/media/alta) con color y animación |
| `ErrorBoundary` | `{ children }` | Error boundary con botón de reinicio (clase) |
| `Logo` | `{ className, size }` | Logotipo SVG |
| `LogoWordmark` | `{ className }` | Logotipo con texto "BookGym" |

Iconos: 30+ SVG components en `Icons.jsx` con `stroke="currentColor"` para herencia de color.

---

## 8) Reglas dinámicas (sin hardcode)

El frontend **no define constantes de negocio**. Las obtiene del backend mediante `GET /configuracion/reglas-reserva`:

| Clave | Descripción |
|---|---|
| `limiteReservasActivas` | Máx. reservas activas simultáneas por usuario |
| `maxReservasPorDia` | Máx. reservas activas por día |
| `anticipacionReservaMin` | Minutos mínimos de anticipación para reservar |
| `anticipacionCancelacionMin` | Minutos mínimos de anticipación para cancelar |
| `ventanaCheckinMin` | Minutos antes/después del inicio para hacer check-in |
| `umbralNoshow` | Número de inasistencias antes de suspensión automática |
| `diasSuspensionPorNoshow` | Días de suspensión por alcanzar el umbral |

---

## 9) Sincronización en vivo

React Query maneja polling e invalidaciones:

- **Polling automático**: franjas (global), reservas activas (10s), historial (15s), métricas (15s), recomendaciones (30s), reglas (60s)
- **Invalidaciones en mutaciones**: crear/cancelar reserva → refresca franjas + reservas + recomendaciones
- **RefetchOnWindowFocus**: al volver a la pestaña, refresca datos automáticamente

---

## 10) Zona horaria

Todas las operaciones de tiempo usan `America/Bogota` (UTC-5, sin horario de verano) mediante dayjs con plugin timezone:

- `now()` → momento actual en Bogotá
- `parseSlotMillis(fecha, hora)` → timestamp para comparaciones de ventanas
- `formatDate(iso)` → formato legible: `"jueves 20 mar"`
- `formatDayHeader(iso)` → formato compacto: `"jue 20/3"`

---

## 11) Flujo de datos end-to-end

### Estudiante

1. Login → `POST /auth/login` → guarda token + usuario en localStorage
2. Carga reglas → `GET /configuracion/reglas-reserva` → almacena en React Query
3. Carga franjas → `GET /franjas/semana` × hook `useFranjas`
4. Carga reservas → `GET /reservas` + `GET /reservas/historial` × hooks dedicados
5. Reserva → modal → `POST /reservas` → invalida franjas + reservas + recomendaciones
6. Cancela → modal → `DELETE /reservas/:id` → invalida franjas + reservas
7. Check-in → modal doble confirmación → `POST /reservas/:id/check-in`

### Administrador

1. Login (igual que estudiante, con rol administrador)
2. Dashboard → `GET /metricas/resumen` + `GET /metricas/analisis` → gráficos Recharts
3. Scanner → escanea QR o ingresa cédula → `GET /admin/scanner/verificar/:cedula` → escenario visual
4. Check-in admin → `POST /admin/scanner/checkin/:id`
5. Suspensiones → tabla `@tanstack/react-table` → levantar con `DELETE /admin/suspensiones/:id`
6. Configuración → sliders → `PUT /admin/configuracion/reglas-reserva`

---

## 12) Buenas prácticas implementadas

- ✅ Todos los componentes funcionales con hooks (sin clases, excepto ErrorBoundary)
- ✅ Optional chaining (`?.`) en accesos a datos anidados
- ✅ Fallback pattern `franja?.plantilla?.campo || franja?.campo || ''` para compatibilidad de formas API
- ✅ Reglas de negocio desde backend (sin constantes hardcodeadas)
- ✅ Polling optimizado por hook (cada uno define su propio intervalo)
- ✅ Mutaciones con invalidación selectiva de queries
- ✅ Manejo de errores con toasts + error boundary global
- ✅ `catch {}` silencioso para operaciones no críticas (stop de cámara, cleanup)
- ✅ Timezone Colombia en todas las operaciones de fecha
- ✅ Carga esqueletal (skeletons) en todas las páginas

---

## 13) Pruebas de integración (E2E)

```bash
npm run test:e2e
```

El script `scripts/test-e2e.mjs` verifica:

1. **Conectividad**: `GET /health` responde 200
2. **Autenticación**: login con credenciales demo → token JWT
3. **Reglas**: respuesta con las 7 claves esperadas
4. **Franjas**: array con campos `id`, `fecha`, `horaInicio`, `horaFin`, `cuposDisponibles`, `saturacion`
5. **Reservas activas**: array con relación `franja.plantilla.horaInicio`
6. **Historial**: array de reservas
7. **Recomendaciones**: objeto con `mejoresMomentos` / `evitando`
8. **Métricas admin**: resumen semanal
9. **Suspensiones admin**: lista de usuarios (solo admin)
10. **Scanner admin**: verificar estudiante (solo admin)

Uso:
```bash
VITE_API_URL=https://bookgym-production.up.railway.app/api npm run test:e2e
```

---

## 14) Swagger del backend

El frontend consume la documentación Swagger directamente desde el backend:

- Local UI: `http://localhost:3000/api/docs`
- Local JSON: `http://localhost:3000/api/docs.json`
- Railway UI: `https://bookgym-production.up.railway.app/api/docs`
- Railway JSON: `https://bookgym-production.up.railway.app/api/docs.json`
