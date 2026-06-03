import { useMemo } from 'react'
import { useReservas, useHistorialReservas } from '../../hooks/useReservas'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { Logo } from '../../components/shared/Logo'
import { IconUser, IconCalendar, IconAward, IconAlertTriangle, IconShieldAlert, IconClock } from '../../components/shared/Icons'

function calculateStreak(completadas) {
  if (completadas.length === 0) return 0
  const dias = [...new Set(completadas.map((r) => String(r.franja?.fecha || '').split('T')[0]))].sort()
  if (dias.length === 0) return 0
  let streak = 1
  for (let i = dias.length - 1; i > 0; i--) {
    const [y1, m1, d1] = dias[i].split('-').map(Number)
    const [y2, m2, d2] = dias[i - 1].split('-').map(Number)
    const diff = (Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

export function Perfil({ usuario }) {
  const { data: reservas = [] } = useReservas()
  const { data: historial = [] } = useHistorialReservas()
  const { data: reglas } = useReglasReserva()

  const completadas = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'completada'),
    [historial]
  )
  const noShows = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'no_show'),
    [historial]
  )
  const streak = useMemo(() => calculateStreak(completadas), [completadas])
  const mesActual = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return completadas.filter((r) => String(r.franja?.fecha || '').startsWith(prefix)).length
  }, [completadas])

  const umbralNoShow = reglas?.umbralNoshow || 3
  const enRiesgo = noShows.length >= umbralNoShow - 1 && noShows.length < umbralNoShow
  const suspendido = noShows.length >= umbralNoShow

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
          <IconUser className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{usuario.nombre || usuario.id}</h1>
          <p className="text-sm text-slate-500">ID: {usuario.id}</p>
          <p className="text-xs text-slate-400">Estudiante</p>
        </div>
      </div>

      {suspendido && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-5 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <IconShieldAlert className="mb-2 h-10 w-10 text-danger-500" />
            <h2 className="text-lg font-bold text-danger-800">Cuenta suspendida</h2>
            <p className="mt-1 text-sm text-danger-600">
              Has acumulado {noShows.length} inasistencias. Tu cuenta está bloqueada temporalmente.
            </p>
            {reglas?.diasSuspensionPorNoshow && (
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-danger-700">
                <IconClock className="h-4 w-4" />
                <span>{reglas.diasSuspensionPorNoshow} días de suspensión</span>
              </div>
            )}
          </div>
        </div>
      )}

      {enRiesgo && !suspendido && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
          <div className="flex items-start gap-3">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 text-warning-500" />
            <div>
              <p className="text-sm font-semibold text-warning-800">Riesgo de suspensión</p>
              <p className="text-xs text-warning-700">
                Tienes {noShows.length}/{umbralNoShow} inasistencias. {umbralNoShow - noShows.length} falta(s) más y serás suspendido.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
          <IconAward className="mx-auto mb-1 h-5 w-5 text-primary" />
          <p className="text-2xl font-bold text-slate-900">{streak}</p>
          <p className="text-xs text-slate-500">Racha (días)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
          <IconCalendar className="mx-auto mb-1 h-5 w-5 text-success-500" />
          <p className="text-2xl font-bold text-slate-900">{mesActual}</p>
          <p className="text-xs text-slate-500">Este mes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
          <IconClock className="mx-auto mb-1 h-5 w-5 text-warning-500" />
          <p className="text-2xl font-bold text-slate-900">{reservas.length}</p>
          <p className="text-xs text-slate-500">Activas</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-sm font-semibold text-slate-800">Estadísticas</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Reservas completadas</span>
            <span className="font-semibold text-slate-800">{completadas.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Inasistencias (No Show)</span>
            <span className={`font-semibold ${noShows.length > 0 ? 'text-danger-600' : 'text-slate-800'}`}>
              {noShows.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Cancelaciones</span>
            <span className="font-semibold text-slate-800">
              {historial.filter((r) => String(r.estado).toLowerCase() === 'cancelada').length}
            </span>
          </div>
          {reglas && (
            <>
              <hr className="border-slate-100" />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Límite activas: {reglas.limiteReservasActivas}</span>
                <span>Umbral no-show: {reglas.umbralNoshow}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
