import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useReservas, useRecomendaciones } from '../../hooks/useReservas'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  IconSparkles, IconClock, IconShieldAlert, IconCalendarCheck,
  IconUser, IconActivity, IconCalendar, IconChevronRight,
  IconFlame, IconCheck, IconAlertTriangle, IconArrowUp,
} from '../../components/shared/Icons'
import { formatDate, nowMillis, parseSlotMillis } from '../../utils/time'

const DIAS_CORTOS = { lunes: 'L', martes: 'M', miercoles: 'M', jueves: 'J', viernes: 'V' }
const DIAS_LABEL = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie' }

function ProgressRing({ value, size = 96, stroke = 10, color = '#4f46e5', trackColor = '#e2e8f0' }) {
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
    <div className="flex items-end gap-1.5">
      {data.map((d) => {
        const heightPct = (d.count / max) * 100
        const isFav = d.count === max && d.count > 0
        return (
          <div key={d.dia} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-10 w-full items-end">
              <div
                className={`w-full rounded-md transition-all duration-700 ${
                  isFav ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-primary/20'
                }`}
                style={{ height: `${Math.max(heightPct, d.count > 0 ? 12 : 4)}%` }}
              />
            </div>
            <span className={`text-[9px] font-semibold ${isFav ? 'text-primary' : 'text-slate-400'}`}>
              {DIAS_LABEL[d.dia] || d.dia.slice(0, 3)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function AfinidadBadge({ nivel }) {
  if (nivel === 'alta') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        <IconSparkles className="h-2.5 w-2.5" />
        Para ti
      </span>
    )
  }
  if (nivel === 'media') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
        Conocido
      </span>
    )
  }
  return null
}

export function HomeRecomendaciones() {
  const { usuario } = useAuth()
  const { data: reglas, isLoading: loadingReglas } = useReglasReserva()
  const { data: recomendaciones, isLoading } = useRecomendaciones(5)
  const { data: reservasActivas = [], isLoading: loadingReservas } = useReservas()

  const mejoresMomentos = recomendaciones?.mejoresMomentos ?? []
  const evitando = recomendaciones?.evitando ?? []
  const perfil = recomendaciones?.perfilUsuario

  const proximaReserva = useMemo(() => {
    const ahora = nowMillis()
    return reservasActivas
      .filter((r) => {
        const inicio = parseSlotMillis(r.franja?.fecha, r.franja?.horaInicio || r.franja?.plantilla?.horaInicio)
        return inicio > ahora
      })
      .sort((a, b) => {
        const aInicio = parseSlotMillis(a.franja?.fecha, a.franja?.horaInicio || a.franja?.plantilla?.horaInicio)
        const bInicio = parseSlotMillis(b.franja?.fecha, b.franja?.horaInicio || b.franja?.plantilla?.horaInicio)
        return aInicio - bInicio
      })[0]
  }, [reservasActivas])

  if (isLoading || loadingReglas || loadingReservas) {
    return (
      <div className="space-y-3 pt-2">
        <SkeletonLoader className="h-16 w-full" />
        <SkeletonLoader className="h-44 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  const tasa = perfil?.tasaAsistencia ?? 0
  const ringColor = tasa >= 80 ? '#10b981' : tasa >= 50 ? '#f59e0b' : '#f43f5e'
  const racha = perfil?.rachaAsistencia ?? 0

  return (
    <div className="space-y-3 pt-2 pb-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Hola, <span className="text-primary">{usuario?.nombre?.split(' ')[0] || 'estudiante'}</span>
        </h1>
        <Link
          to="/reservar"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700"
        >
          Ver disponibilidad
          <IconChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <IconCalendarCheck className="h-4 w-4" />
          </div>
          {proximaReserva ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Tu próxima reserva</p>
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatDate(proximaReserva.franja?.fecha)} · {proximaReserva.franja?.horaInicio || proximaReserva.franja?.plantilla?.horaInicio} - {proximaReserva.franja?.horaFin || proximaReserva.franja?.plantilla?.horaFin}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tienes reservas próximas</p>
          )}
        </div>
      </div>

      {perfil ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800">
          <div className="bg-gradient-to-br from-primary-50 via-white to-white px-4 pt-4 dark:from-primary-900/20 dark:via-slate-900 dark:to-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IconUser className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tu perfil de uso</h2>
              </div>
              {racha >= 2 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold text-warning-600 dark:bg-warning-900/30">
                  <IconFlame className="h-2.5 w-2.5" />
                  Racha {racha}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ProgressRing value={tasa} size={88} stroke={9} color={ringColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{tasa}%</span>
                  <span className="text-[8px] font-medium uppercase tracking-wider text-slate-500">asist.</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <IconCheck className="h-3 w-3 text-success-500" /> Asistidas
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{perfil.completadas}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <IconAlertTriangle className="h-3 w-3 text-danger-500" /> No-show
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{perfil.noShows}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <IconActivity className="h-3 w-3 text-primary" /> Finalizadas
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{perfil.totalFinalizadas}</span>
                </div>
              </div>
            </div>
          </div>

          {perfil.distribucionDias && perfil.distribucionDias.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <IconCalendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tus días</span>
                </div>
                {perfil.diaFavorito && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <IconArrowUp className="h-2.5 w-2.5" />
                    {perfil.diaFavorito}
                  </span>
                )}
              </div>
              <MiniBarChart data={perfil.distribucionDias} />
            </div>
          )}

          {perfil.horaFavorita && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <IconClock className="h-3 w-3" />
                Tu hora habitual
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{perfil.horaFavorita}</span>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center dark:border-slate-700">
          <IconActivity className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-xs text-slate-500">Reserva algunas sesiones para empezar a ver tu perfil de uso.</p>
        </section>
      )}

      {mejoresMomentos.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
          <div className="mb-2 flex items-center gap-1.5">
            <IconSparkles className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recomendados para ti</h2>
            <span className="text-[10px] text-slate-500">· {mejoresMomentos.length}</span>
          </div>
          <ul className="space-y-1">
            {mejoresMomentos.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <AfinidadBadge nivel={item.afinidad} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.dia} · {item.horaInicio}-{item.horaFin}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">{item.razon}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {item.cuposRestantes} libres
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {evitando.length > 0 && (
        <section className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/10">
          <div className="mb-1.5 flex items-center gap-1.5">
            <IconClock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Horarios que se llenan rápido</h2>
          </div>
          <ul className="space-y-0.5">
            {evitando.slice(0, 3).map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300"
              >
                <span className="capitalize">
                  {item.dia} · {item.horaInicio}
                </span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{item.ocupacionHistorica}% lleno</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mejoresMomentos.length === 0 && !perfil && (
        <EmptyState
          icon={IconSparkles}
          title={recomendaciones?.mensaje || 'Sin recomendaciones aún'}
          message="Reserva algunas sesiones para empezar a recibir sugerencias."
        />
      )}

      {reglas && (
        <div className="rounded-md bg-slate-50 px-3 py-1.5 dark:bg-slate-800/40">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <IconShieldAlert className="h-3 w-3 shrink-0" />
            <span>
              Máx. {reglas.limiteReservasActivas} activas · {reglas.maxReservasPorDia}/día · Anticipación {reglas.anticipacionReservaMin} min
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
