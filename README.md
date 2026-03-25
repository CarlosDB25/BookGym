# BookGym - Prototipo funcional

Implementacion del flujo central de reservas para gimnasio universitario, siguiendo el Documento II:

- Login con usuarios precargados
- Disponibilidad semanal con saturacion estimada
- Creacion de reserva con validaciones de negocio
- Cancelacion de reserva con liberacion inmediata de cupo
- Control de concurrencia basico y funcional con transaccion Prisma

## Estructura

- backend: API REST con Node.js, Express, Prisma y PostgreSQL
- frontend: Cliente web con React, Vite, Axios, TanStack Query y Tailwind CSS

## Decisiones tecnicas

1. Monolito modular
Se eligio separar por modulos de dominio dentro de un solo backend para simplificar despliegue, depuracion y mantenimiento en fase de prototipo.

2. Prisma + PostgreSQL
PostgreSQL aporta transacciones ACID, necesarias para proteger el decremento de cupos y evitar sobre-reservas.

3. JWT stateless
La API valida token en cada peticion protegida y no mantiene sesion en servidor.

4. Orden de validaciones en reservas
Se conserva el orden del documento por costo:
- suspension activa
- limite de reservas activas
- disponibilidad dentro de transaccion

5. Alcance estricto del prototipo
No se implementan check-in administrativo, gestion de suspensiones ni metricas historicas reales.

## Requisitos

- Node.js 20+
- PostgreSQL (local o Railway)

## Backend - configuracion

1. Ir a backend

```bash
cd backend
```

2. Crear archivo .env basado en .env.example

```bash
cp .env.example .env
```

En Windows PowerShell puedes copiar manualmente:

```powershell
Copy-Item .env.example .env
```

3. Completar variables:
- DATABASE_URL
- JWT_SECRET
- PORT

4. Migrar y poblar datos iniciales

```bash
npx prisma migrate dev --name init
node prisma/seed.js
```

5. Ejecutar backend

```bash
npm run dev
```

## Frontend - configuracion

1. Ir a frontend

```bash
cd frontend
```

2. Crear archivo .env basado en .env.example

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Ajustar VITE_API_URL si el backend no corre en localhost:3000

4. Ejecutar frontend

```bash
npm run dev
```

## Usuarios de prueba

- Estudiante: EST001 / password123
- Administrador: ADM001 / password123

## Endpoints principales

- POST /api/auth/login
- GET /api/franjas/semana?fecha=YYYY-MM-DD
- GET /api/reservas
- POST /api/reservas
- DELETE /api/reservas/:id

## Despliegue inicial en Railway

### Backend + PostgreSQL

1. Crear proyecto en Railway
2. Agregar servicio PostgreSQL
3. Agregar servicio desde repositorio GitHub (carpeta backend)
4. Variables del servicio backend:
- DATABASE_URL: usar la del servicio PostgreSQL
- JWT_SECRET: generar valor aleatorio largo
- PORT: Railway lo inyecta, pero puedes dejar 3000 local
5. Comando de build sugerido:
- npm install
- npx prisma generate
6. Comando de start:
- node src/server.js
7. Ejecutar migraciones una vez:
- npx prisma migrate deploy
8. Ejecutar seed una vez:
- node prisma/seed.js

### Frontend

1. Crear nuevo servicio en Railway apuntando a carpeta frontend
2. Definir VITE_API_URL con la URL publica del backend + /api
3. Build command:
- npm install && npm run build
4. Start command:
- npm run preview -- --host 0.0.0.0 --port $PORT

## Pruebas manuales recomendadas

1. Login con EST001
2. Consultar disponibilidad semanal
3. Reservar una franja con cupo > 0
4. Confirmar que cuposDisponibles disminuye en 1
5. Reservar hasta alcanzar limite de reservas activas
6. Intentar una reserva extra y validar error 400
7. Cancelar una reserva futura
8. Confirmar que cuposDisponibles aumenta en 1

## Notas

- El control de concurrencia actual es funcional para prototipo al envolver update y create en una unica transaccion.
- Para produccion se recomienda robustecer con estrategias adicionales de bloqueo/aislamiento y pruebas de carga concurrente.
