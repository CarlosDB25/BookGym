# Frontend BookGym

Cliente web del prototipo de reservas.

## Stack

- React + Vite
- Axios
- TanStack Query
- Tailwind CSS

## Variables

Crear .env basado en .env.example:

- VITE_API_URL=https://bookgym-production.up.railway.app/api

## Scripts

- npm run dev
- npm run build
- npm run preview

## Flujo estudiante

- Login
- Agenda semanal unificada por bloques (L-V)
- Seleccion de bloque
- Confirmacion intermedia en modal
- Reserva y cancelacion con respuesta visual

## Flujo administrador

- Panel de metricas semanales
- Refresco manual y automatico de datos
- Vista de agenda en modo solo lectura

## UX funcional

- Zona horaria Colombia (America/Bogota)
- Bloques horarios con estados visibles: disponible, sin cupos, reservado, limite alcanzado
- Modal de confirmacion antes de reservar
