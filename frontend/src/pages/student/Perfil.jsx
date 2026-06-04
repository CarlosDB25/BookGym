import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useHistorialReservas, useReservas } from '../../hooks/useReservas'
import { useDarkMode } from '../../hooks/useDarkMode'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { IconShieldCheck, IconAlertTriangle, IconBan, IconCheck, IconClose, IconCalendar, IconClock, IconAward, IconLogOut, IconSun, IconMoon } from '../../components/shared/Icons'

export function Perfil({ usuario }) {
  const { logout } = useAuth()
  const { theme, setLight, setDark } = useDarkMode()
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
      <div className="space-y-3 pt-2">
        <SkeletonLoader className="h-20 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2 md:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mi perfil</h1>
        <p className="text-[10px] text-slate-500">America/Bogota (UTC-5)</p>
      </div>

      {suspendido && (
        <div className="flex items-center gap-2.5 rounded-xl border-2 border-danger-200 bg-danger-50 px-3 py-2 dark:border-danger-200/40 dark:bg-danger-900/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-500 text-white">
            <IconBan className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-danger-900 dark:text-danger-300">Cuenta suspendida</p>
            <p className="text-[11px] text-danger-700 dark:text-danger-400">
              {fallas} inasistencias. Acceso bloqueado temporalmente.
            </p>
          </div>
        </div>
      )}

      {enRiesgo && !suspendido && (
        <div className="flex items-center gap-2.5 rounded-xl border-2 border-warning-200 bg-warning-50 px-3 py-2 dark:border-warning-200/40 dark:bg-warning-900/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning-500 text-white">
            <IconAlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-warning-900 dark:text-warning-300">Cuidado</p>
            <p className="text-[11px] text-warning-700 dark:text-warning-400">
              Una inasistencia más y serás suspendido.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-sm">
              {usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-success-500 text-white">
              <IconCheck className="h-2.5 w-2.5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {usuario?.nombre || 'Estudiante'}
            </h2>
            <p className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              ID · {usuario?.id || '---'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-md bg-slate-50 px-2 py-1 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Activas</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{reservas.length}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Asist.</p>
              <p className="text-sm font-bold text-success-600">{completadas.length}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Total</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{historial.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <IconAlertTriangle className="h-3.5 w-3.5 text-warning-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Inasistencias</h3>
          </div>
          <span className="text-[10px] text-slate-500">3 suspensiones automáticas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => {
              const esFalla = i < fallas
              return (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                    esFalla
                      ? 'border-danger-500 bg-danger-500 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                  }`}
                >
                  {esFalla ? <IconClose className="h-3.5 w-3.5" /> : <span className="text-sm font-bold">·</span>}
                </div>
              )
            })}
          </div>
          <p className="flex-1 text-[11px] text-slate-600 dark:text-slate-300">
            {fallas === 0 && 'Sin inasistencias. ¡Sigue así!'}
            {fallas === 1 && '1 inasistencia. Te quedan 2 antes de la suspensión.'}
            {fallas === 2 && '2 inasistencias. Una más y serás suspendido.'}
            {fallas >= 3 && 'Límite alcanzado. Cuenta suspendida.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 sm:w-1/3">
            {theme === 'dark' ? <IconMoon className="h-3.5 w-3.5 text-slate-500" /> : <IconSun className="h-3.5 w-3.5 text-slate-500" />}
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Apariencia</h3>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              type="button"
              onClick={setLight}
              aria-pressed={theme === 'light'}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <IconSun className="h-3.5 w-3.5" />
              Claro
            </button>
            <button
              type="button"
              onClick={setDark}
              aria-pressed={theme === 'dark'}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <IconMoon className="h-3.5 w-3.5" />
              Oscuro
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-danger-200 bg-white px-4 py-2.5 text-sm font-semibold text-danger-600 transition hover:bg-danger-50 active:scale-[0.99] dark:border-danger-200/40 dark:bg-transparent"
      >
        <IconLogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  )
}
