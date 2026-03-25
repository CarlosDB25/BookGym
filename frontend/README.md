# Frontend BookGym

Cliente web del sistema de reservas con dos experiencias: estudiante y administrador.

## 1) Stack

- React + Vite
- Axios
- TanStack Query
- Tailwind CSS

## 2) Configuración

Crear `.env` desde `.env.example`:

- `VITE_API_URL` (ejemplo local: `http://localhost:3000/api`)

## 3) Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## 4) Flujo end-to-end en frontend

### Estudiante

1. Inicia sesión y obtiene token.
2. Carga agenda semanal y reglas operativas (`/configuracion/reglas-reserva`).
3. Puede reservar si cumple ventanas/límites.
4. Ve reservas activas y, en paralelo, historial.
5. Cancela con confirmación modal (si está dentro de ventana permitida).

### Administrador

1. Abre panel de métricas semanales.
2. Ve datos recalculados periódicamente.
3. Abre agenda modo lectura con foco en cupos/saturación.

## 5) Sincronización en vivo

El frontend usa polling + invalidaciones de React Query para reflejar cambios sin recargar:

- franjas semanales
- reservas activas
- historial de reservas
- métricas

## 6) Reglas dinámicas (sin hardcode)

El frontend no define cantidades/minutos como constantes de negocio; las obtiene desde backend:

- `limiteReservasActivas`
- `maxReservasPorDia`
- `anticipacionReservaMin`
- `anticipacionCancelacionMin`

Endpoint consumido:

- `GET /api/configuracion/reglas-reserva`

## 7) UX funcional implementada

- Zona horaria Colombia (`America/Bogota`)
- Confirmación previa para reservar y cancelar
- Separación de `Mis reservas activas` y `Historial`
- Cancelación oculta/deshabilitada cuando la regla temporal ya no permite acción
- Agenda admin en modo lectura simplificado

## 8) Swagger backend (referencia para frontend)

El frontend no expone Swagger propio; consume el del backend.

- Local UI: `http://localhost:3000/api/docs`
- Local JSON: `http://localhost:3000/api/docs.json`
- Railway UI: `https://bookgym-production.up.railway.app/api/docs`
- Railway JSON: `https://bookgym-production.up.railway.app/api/docs.json`
