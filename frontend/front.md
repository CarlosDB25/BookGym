# Frontend BookGym

Frontend React SPA que consume la API REST del backend BookGym.

## Stack

- React 19 + Vite 8 + Tailwind CSS 3.4
- TanStack Query v5 (cache, polling)
- React Router v7 (role-based guards)
- Recharts (dashboard admin)
- Framer Motion (transiciones, micro-animaciones)
- Dayjs + plugins UTC/timezone (America/Bogota)
- html5-qrcode (scanner check-in)
- @tanstack/react-table (tabla usuarios admin)
- Axios (interceptors 401/403/504)
- Iconos inline SVG custom (sin librerías externas)

## Arquitectura

```
src/
├── main.jsx          # QueryClient + providers
├── App.jsx           # Router + layout switch (rol)
├── config/
│   └── axios.js      # Instancia Axios con interceptors
├── utils/
│   └── time.js       # dayjs-tz America/Bogota
├── hooks/
│   ├── useAuth.js
│   ├── useFranjas.js
│   ├── useReservas.js
│   ├── useMetricas.js
│   ├── useReglasReserva.js
│   └── useAdmin.js
├── layouts/
│   ├── StudentMobileLayout.jsx  # Bottom nav 4 tabs
│   └── AdminDesktopLayout.jsx   # Sidebar 260px + topbar reloj
├── components/
│   ├── shared/
│   │   ├── Icons.jsx    # 30 inline SVGs
│   │   └── Logo.jsx
│   └── ui/
│       ├── ActionModal.jsx
│       ├── EmptyState.jsx
│       ├── SaturacionBadge.jsx
│       ├── SkeletonLoader.jsx
│       └── Toast.jsx
└── pages/
    ├── Login.jsx
    ├── student/
    │   ├── HomeRecomendaciones.jsx
    │   ├── ExploradorFranjas.jsx
    │   ├── MisCupos.jsx
    │   └── Perfil.jsx
    └── admin/
        ├── DashboardAnalitico.jsx  # Recharts KPI/donut/bar/area
        ├── ScannerHub.jsx          # QR + manual input
        ├── AdminUsuarios.jsx       # Tabla + drawer + suspender
        └── AdminConfig.jsx         # Sliders reglas operativas
```

## Reglas de negocio

- Todas las reglas vía `GET /api/configuracion/reglas-reserva`
- Franjas polling cada 10s con staleTime 0
- Toda hora en America/Bogota (dayjs-tz), prohibido raw `new Date()`
- Cancelación deshabilita botón si pasó ventana

## Roles y rutas

| Ruta          | Rol   | Vista                    |
|---------------|-------|--------------------------|
| `/login`      | —     | Login                    |
| `/`           | student | HomeRecomendaciones    |
| `/explorar`   | student | ExploradorFranjas      |
| `/mis-cupos`  | student | MisCupos + check-in     |
| `/perfil`     | student | Perfil (racha/bloqueo)  |
| `/admin`      | admin | DashboardAnalitico       |
| `/admin/scanner` | admin | ScannerHub             |
| `/admin/usuarios` | admin | AdminUsuarios          |
| `/admin/config` | admin | AdminConfig             |

## Variables de entorno

```env
VITE_API_URL=http://localhost:3000/api
```

## Comandos

```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run preview  # Preview build
npm run lint     # ESLint
```
