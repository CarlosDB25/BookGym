import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useHistorialReservas, useReservas } from '../../hooks/useReservas'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { IconShieldCheck, IconAlertTriangle, IconBan, IconCheck, IconClose, IconCalendar, IconClock, IconAward, IconLogOut } from '../../components/shared/Icons'

export function Perfil({ usuario }) {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const { data: historial = [], isLoading } = useHistorialReservas()
  const { data: reservas = [] } = useReservas()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['historial-reservas'] })
    queryClient.invalidateQueries({ queryKey: ['mis-reservas'] })
  }, [queryClient])

  const noShows = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'no_show'),
    [historial]
  )
  const completadas = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'completada'),
    [historial]
  )

  const fallas = noShows.length
  const suspendido = fallas >= 3
  const enRiesgo = fallas === 2

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <SkeletonLoader className="h-40 w-full" />
        <SkeletonLoader className="h-32 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2 md:pt-0">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-xs text-slate-500">America/Bogota</p>
      </div>

      {suspendido && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-500 text-white">
            <IconBan className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-danger-900">Cuenta suspendida</h2>
            <p className="text-sm text-danger-700">
              Has acumulado {fallas} inasistencias. Tu cuenta está bloqueada temporalmente.
            </p>
          </div>
        </div>
      )}

      {enRiesgo && !suspendido && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-warning-200 bg-warning-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-500 text-white">
            <IconAlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-warning-900">¡Cuidado!</h2>
            <p className="text-sm text-warning-700">
              Una inasistencia más y serás suspendido. Confirma tu asistencia puntualmente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-20 bg-gradient-to-br from-primary to-primary-700" />
            <div className="px-6 pb-6 text-center">
              <div className="-mt-12 flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary text-3xl font-bold text-white shadow-md">
                    {usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-success-500 text-white">
                    <IconCheck className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {usuario?.nombre || 'Estudiante'}
              </h2>
              <p className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-600">
                ID · {usuario?.id || '---'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                <IconAlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">Inasistencias</h3>
                <p className="text-xs text-slate-500">3 suspensiones automáticas</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-3">
                {[0, 1, 2].map((i) => {
                  const esFalla = i < fallas
                  return (
                    <div
                      key={i}
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
                        esFalla
                          ? 'border-danger-500 bg-danger-500 text-white shadow-md shadow-danger-200'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {esFalla ? <IconClose className="h-6 w-6" /> : <span className="text-xl font-bold">·</span>}
                    </div>
                  )
                })}
              </div>
              <p className="text-center text-sm text-slate-600">
                {fallas === 0 && '¡Perfecto! Sin inasistencias registradas.'}
                {fallas === 1 && '1 inasistencia. Te quedan 2 antes de la suspensión.'}
                {fallas === 2 && '2 inasistencias. Una más y serás suspendido.'}
                {fallas >= 3 && 'Has alcanzado el límite. Cuenta suspendida.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <IconCalendar className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Activas</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{reservas.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <IconCheck className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Asistidas</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-success-600">{completadas.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <IconAward className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Total</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{historial.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <IconClock className="h-4 w-4" />
          <span className="text-xs">Hora oficial del sistema</span>
        </div>
        <p className="mt-1 text-lg font-bold text-slate-900">America/Bogota (UTC-5)</p>
        <p className="text-xs text-slate-500">Las reservas y horarios usan esta zona horaria.</p>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger-200 bg-white px-6 py-3.5 text-sm font-semibold text-danger-600 transition hover:bg-danger-50 active:scale-[0.99] md:w-auto"
      >
        <IconLogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  )
}
