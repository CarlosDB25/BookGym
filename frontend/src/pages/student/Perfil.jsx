import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useHistorialReservas, useReservas, useRecomendaciones } from '../../hooks/useReservas'
import { useDarkMode } from '../../hooks/useDarkMode'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import {
  IconAlertTriangle, IconBan, IconCheck, IconClose, IconCalendar,
  IconSun, IconMoon, IconActivity, IconClock, IconArrowUp,
  IconCheckCircle, IconFlame,
} from '../../components/shared/Icons'

const DIAS_LABEL = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie' }

function ProgressRing({ value, size = 110, stroke = 11, color = '#4f46e5', trackColor = '#e2e8f0' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="flex items-end gap-2">
      {data.map((d) => {
        const heightPct = (d.count / max) * 100
        const isFav = d.count === max && d.count > 0
        return (
          <div key={d.dia} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-12 w-full items-end">
              <div
                className={`w-full rounded-md transition-all duration-700 ${
                  isFav ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-primary/20'
                }`}
                style={{ height: `${Math.max(heightPct, d.count > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold ${isFav ? 'text-primary' : 'text-slate-400'}`}>
              {DIAS_LABEL[d.dia] || d.dia.slice(0, 3)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Perfil({ usuario }) {
  const { theme, setLight, setDark } = useDarkMode()
  const queryClient = useQueryClient()
  const { data: historial = [], isLoading } = useHistorialReservas()
  const { data: reservas = [] } = useReservas()
  const { data: recomendaciones } = useRecomendaciones(5)

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
  const perfil = recomendaciones?.perfilUsuario
  const tasa = perfil?.tasaAsistencia ?? 0
  const ringColor = tasa >= 80 ? '#10b981' : tasa >= 50 ? '#f59e0b' : '#f43f5e'
  const racha = perfil?.rachaAsistencia ?? 0

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <SkeletonLoader className="h-20 w-full" />
        <SkeletonLoader className="h-44 w-full" />
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800">
        <div className="bg-gradient-to-br from-primary-50 via-white to-white px-4 pt-4 dark:from-primary-900/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3 pb-3">
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
            {racha >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-600 dark:bg-warning-900/30">
                <IconFlame className="h-2.5 w-2.5" />
                Racha {racha}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 pb-4">
            <div className="relative shrink-0">
              <ProgressRing value={tasa} size={104} stroke={10} color={ringColor} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tasa}%</span>
                <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">asist.</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between rounded-md bg-white/60 px-2.5 py-1.5 dark:bg-slate-800/50">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <IconCheckCircle className="h-3.5 w-3.5 text-success-500" />
                  Asistidas
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {perfil?.completadas ?? completadas.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/60 px-2.5 py-1.5 dark:bg-slate-800/50">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <IconAlertTriangle className="h-3.5 w-3.5 text-danger-500" />
                  No-show
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {perfil?.noShows ?? noShows.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/60 px-2.5 py-1.5 dark:bg-slate-800/50">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <IconActivity className="h-3.5 w-3.5 text-primary" />
                  Activas
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{reservas.length}</span>
              </div>
            </div>
          </div>
        </div>

        {perfil?.distribucionDias && perfil.distribucionDias.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IconCalendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Distribución semanal</span>
              </div>
              {perfil.diaFavorito && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                  <IconArrowUp className="h-2.5 w-2.5" />
                  {perfil.diaFavorito} · {perfil.diaFavoritoPct}%
                </span>
              )}
            </div>
            <MiniBarChart data={perfil.distribucionDias} />
          </div>
        )}

        {perfil?.horaFavorita && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[11px] dark:border-slate-800">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <IconClock className="h-3 w-3" />
              Tu hora habitual
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{perfil.horaFavorita}</span>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
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
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    esFalla
                      ? 'border-danger-500 bg-danger-500 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600'
                  }`}
                >
                  {esFalla ? <IconClose className="h-4 w-4" /> : <span className="text-base font-bold">·</span>}
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
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
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
      </section>
    </div>
  )
}
