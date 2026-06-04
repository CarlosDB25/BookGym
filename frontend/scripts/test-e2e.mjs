/**
 * E2E Integration Tests: Frontend ↔ Backend
 *
 * Uses the same axios config as the frontend to verify every API endpoint
 * returns the expected status code and response shape.
 *
 * Usage:
 *   node scripts/test-e2e.mjs                  # localhost:3000
 *   VITE_API_URL=https://production.com/api node scripts/test-e2e.mjs
 */

import axios from 'axios'

const BASE = process.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

let TOKEN = ''
let USER = null

function ok(label) {
  console.log(`  ✅ ${label}`)
}

function fail(label, err) {
  const msg = err?.response ? `${err.response.status} ${JSON.stringify(err.response.data)}` : err.message
  console.error(`  ❌ ${label}: ${msg}`)
  process.exitCode = 1
}

async function step(name, fn) {
  console.log(`\n${name}`)
  await fn()
}

// ─── 1. Health ───────────────────────────────────────────────────────────
step('1. Health & connectivity', async () => {
  try {
    const { status } = await api.get('/health')
    if (status === 200) ok('GET /health → 200')
    else fail('GET /health', `status ${status}`)
  } catch (err) {
    fail('GET /health (is backend running?)', err)
  }
})

// ─── 2. Auth ─────────────────────────────────────────────────────────────
step('2. Auth - login', async () => {
  try {
    const { data, status } = await api.post('/auth/login', {
      idInstitucional: 'EST001',
      password: 'password123',
    })
    if (status !== 200) return fail('POST /auth/login', `status ${status}`)
    if (!data.token) return fail('POST /auth/login', 'no token in response')
    TOKEN = data.token
    USER = data
    ok('POST /auth/login → token received')

    // shape check
    const fields = ['id', 'rol', 'nombre', 'token']
    for (const f of fields) {
      if (!(f in data)) fail('POST /auth/login', `missing field "${f}"`)
    }
  } catch (err) {
    fail('POST /auth/login', err)
  }
})

// ─── 3. Authenticated endpoints ──────────────────────────────────────────
const authApi = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { Authorization: `Bearer ${TOKEN}` },
})

step('3. Reglas de reserva', async () => {
  try {
    const { data, status } = await authApi.get('/configuracion/reglas-reserva')
    if (status !== 200) return fail('GET /configuracion/reglas-reserva', `status ${status}`)
    if (typeof data !== 'object') return fail('GET /configuracion/reglas-reserva', 'response not an object')
    ok('GET /configuracion/reglas-reserva → 200')

    const requiredKeys = [
      'limiteReservasActivas', 'maxReservasPorDia',
      'anticipacionReservaMin', 'anticipacionCancelacionMin',
      'ventanaCheckinMin', 'umbralNoshow', 'diasSuspensionPorNoshow',
    ]
    for (const k of requiredKeys) {
      if (!(k in data)) fail('reglas-reserva', `missing key "${k}"`)
    }
  } catch (err) {
    fail('GET /configuracion/reglas-reserva', err)
  }
})

step('4. Franjas semanales', async () => {
  try {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const fecha = monday.toISOString().split('T')[0]

    const { data, status } = await authApi.get('/franjas/semana', {
      params: { fecha },
    })
    if (status !== 200) return fail('GET /franjas/semana', `status ${status}`)
    if (!Array.isArray(data)) return fail('GET /franjas/semana', 'response not an array')
    ok(`GET /franjas/semana → 200 (${data.length} franjas)`)

    if (data.length > 0) {
      const item = data[0]
      const expected = ['id', 'fecha', 'diaSemana', 'horaInicio', 'horaFin', 'cuposDisponibles', 'saturacion']
      for (const f of expected) {
        if (!(f in item)) fail('franjas item', `missing field "${f}"`)
      }
    }
  } catch (err) {
    fail('GET /franjas/semana', err)
  }
})

step('5. Reservas activas', async () => {
  try {
    const { data, status } = await authApi.get('/reservas')
    if (status !== 200) return fail('GET /reservas', `status ${status}`)
    if (!Array.isArray(data)) return fail('GET /reservas', 'response not an array')
    ok(`GET /reservas → 200 (${data.length} activas)`)

    if (data.length > 0) {
      const item = data[0]
      if (!item.id) fail('reserva', 'missing "id"')
      if (!item.franja) fail('reserva', 'missing "franja" relation')
      if (item.franja) {
        if (!item.franja.fecha) fail('reserva.franja', 'missing "fecha"')
        if (!item.franja.plantilla) fail('reserva.franja', 'missing "plantilla"')
        if (item.franja.plantilla && !item.franja.plantilla.horaInicio) fail('reserva.franja.plantilla', 'missing "horaInicio"')
      }
    }
  } catch (err) {
    fail('GET /reservas', err)
  }
})

step('6. Reservas historial', async () => {
  try {
    const { data, status } = await authApi.get('/reservas/historial')
    if (status !== 200) return fail('GET /reservas/historial', `status ${status}`)
    if (!Array.isArray(data)) return fail('GET /reservas/historial', 'response not an array')
    ok(`GET /reservas/historial → 200 (${data.length} registros)`)
  } catch (err) {
    fail('GET /reservas/historial', err)
  }
})

step('7. Recomendaciones', async () => {
  try {
    const { data, status } = await authApi.get('/metricas/recomendaciones', {
      params: { limite: 5 },
    })
    if (status !== 200) return fail('GET /metricas/recomendaciones', `status ${status}`)
    if (typeof data !== 'object') return fail('GET /metricas/recomendaciones', 'response not an object')
    ok('GET /metricas/recomendaciones → 200')
  } catch (err) {
    fail('GET /metricas/recomendaciones', err)
  }
})

// ─── 4. Admin endpoints ──────────────────────────────────────────────────
step('8. Admin - metricas resumen', async () => {
  try {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const fecha = monday.toISOString().split('T')[0]

    const { data, status } = await authApi.get('/metricas/resumen', {
      params: { fecha },
    })
    if (status !== 200) return fail('GET /metricas/resumen', `status ${status}`)
    ok('GET /metricas/resumen → 200')
  } catch (err) {
    fail('GET /metricas/resumen', err)
  }
})

step('9. Admin - suspensiones', async () => {
  if (USER?.rol !== 'administrador') {
    console.log('  ⏭️  skipping (not admin)')
    return
  }
  try {
    const { data, status } = await authApi.get('/admin/suspensiones/usuarios')
    if (status !== 200) return fail('GET /admin/suspensiones/usuarios', `status ${status}`)
    if (!Array.isArray(data)) return fail('GET /admin/suspensiones/usuarios', 'response not an array')
    ok(`GET /admin/suspensiones/usuarios → 200 (${data.length} usuarios)`)
  } catch (err) {
    fail('GET /admin/suspensiones/usuarios', err)
  }
})

step('10. Admin - scanner verificar', async () => {
  if (USER?.rol !== 'administrador') {
    console.log('  ⏭️  skipping (not admin)')
    return
  }
  try {
    const { status } = await authApi.get('/admin/scanner/verificar/EST001')
    if (status === 200) ok('GET /admin/scanner/verificar/EST001 → 200')
    else fail('GET /admin/scanner/verificar/EST001', `status ${status}`)
  } catch (err) {
    fail('GET /admin/scanner/verificar/EST001', err)
  }
})

// ─── 5. Admin config ─────────────────────────────────────────────────────
step('11. Admin - actualizar config (read-only check)', async () => {
  if (USER?.rol !== 'administrador') {
    console.log('  ⏭️  skipping (not admin)')
    return
  }
  try {
    const { data } = await authApi.get('/configuracion/reglas-reserva')
    if (typeof data?.limiteReservasActivas === 'number') {
      ok('reglas-reserva values are numeric (frontend-ready)')
    }
  } catch (err) {
    fail('config shape check', err)
  }
})

// ─── Summary ─────────────────────────────────────────────────────────────
const passed = process.exitCode ? false : true
console.log(`\n${'─'.repeat(50)}`)
console.log(passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
console.log(`Backend URL: ${BASE}`)
process.exit(passed ? 0 : 1)
