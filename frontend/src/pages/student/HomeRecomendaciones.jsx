import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useFranjas } from '../../hooks/useFranjas'
import { useReservas, useRecomendaciones } from '../../hooks/useReservas'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconSparkles, IconClock, IconShieldAlert, IconCalendarCheck, IconUser, IconActivity, IconCalendar, IconChevronRight, IconUsers, IconTrendingUp } from '../../components/shared/Icons'
import { formatDate, nowMillis, parseSlotMillis, todayYMD } from '../../utils/time'

const DIAS_CORTOS = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie' }
const DIAS_NOMBRES = { 1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes', 6: 'sábado', 0: 'domingo' }

function getNext5Weekdays(fromYmd) {
  const [y, m, d] = fromYmd.split('-').map(Number)
  const dates = []
  const current = new Date(y, m - 1, d)
  current.setHours(0, 0, 0, 0)
  while (dates.length < 5) {
    const day = current.getDay()
    if (day >= 1 && day <= 5) dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function isoWeek(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1, d))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const diff = (target - firstThursday) / 86400000
  return 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

function fmtDayLine(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dia = DIAS_NOMBRES[date.getDay()] || ''
  return `${d}/${String(m).padStart(2, '0')} (${DIAS_CORTOS[dia] || dia.slice(0, 3)})`
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
  const { data: franjas = [], isLoading: loadingFranjas } = useFranjas(todayYMD())

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

  const disponibilidadSemana = useMemo(() => {
    const hoy = todayYMD()
    const hoyWeek = isoWeek(hoy)
    const days = getNext5Weekdays(hoy)
    const counts = {}
    for (const f of franjas) {
      const fy = String(f.fecha || '').split('T')[0]
      counts[fy] = (counts[fy] || 0) + 1
    }
    return days.map((d) => {
      const cuposLibres = franjas
        .filter((f) => String(f.fecha || '').split('T')[0] === d)
        .reduce((acc, f) => acc + (f.cuposDisponibles || 0), 0)
      return {
        ymd: d,
        label: fmtDayLine(d),
        count: counts[d] || 0,
        cuposLibres,
        preGenerada: isoWeek(d) !== hoyWeek,
        isToday: d === hoy,
      }
    })
  }, [franjas])

  if (isLoading || loadingReglas || loadingReservas || loadingFranjas) {
    return (
      <div className="space-y-3 pt-2">
        <SkeletonLoader className="h-16 w-full" />
        <SkeletonLoader className="h-20 w-full" />
        <SkeletonLoader className="h-32 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

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

      {perfil && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IconUser className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Tu perfil</h2>
            </div>
            <span className="text-[10px] text-slate-500">Sobre {perfil.historialRelevante} reservas</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-md bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Asist.</p>
              <p className={`text-sm font-bold ${perfil.tasaAsistencia >= 80 ? 'text-success-600' : perfil.tasaAsistencia >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                {perfil.tasaAsistencia}%
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">No-show</p>
              <p className={`text-sm font-bold ${perfil.tasaNoShow === 0 ? 'text-success-600' : perfil.tasaNoShow <= 20 ? 'text-warning-600' : 'text-danger-600'}`}>
                {perfil.tasaNoShow}%
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800/50">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Total</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{perfil.totalReservas}</p>
            </div>
          </div>
          {perfil.diaFavorito && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <IconActivity className="h-3 w-3 text-primary" />
                <span className="capitalize">{perfil.diaFavorito}</span>
              </div>
              {perfil.horaFavorita && (
                <div className="flex items-center gap-1">
                  <IconClock className="h-3 w-3 text-primary" />
                  <span>{perfil.horaFavorita}</span>
                </div>
              )}
              {perfil.slotFavoritoVeces >= 2 && (
                <div className="flex items-center gap-1">
                  <IconTrendingUp className="h-3 w-3 text-primary" />
                  <span className="capitalize">{perfil.slotFavorito.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
        <div className="mb-2 flex items-center gap-1.5">
          <IconCalendar className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Disponibilidad de la semana</h2>
        </div>
        <ul className="space-y-1">
          {disponibilidadSemana.map((d) => (
            <li
              key={d.ymd}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`font-mono text-[11px] ${d.isToday ? 'rounded bg-primary px-1.5 py-0.5 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {d.label.split(' ')[0]}
                </span>
                <span className="truncate text-slate-600 dark:text-slate-400">{d.label.split(' ').slice(1).join(' ')}</span>
                {d.preGenerada && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400" title="Generada por el nuevo scheduler">
                    scheduler
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <IconUsers className="h-3 w-3" />
                  {d.cuposLibres}
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{d.count} franjas</span>
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/reservar"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Reservar ahora
          <IconChevronRight className="h-3 w-3" />
        </Link>
      </section>

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

      {mejoresMomentos.length === 0 && (
        <EmptyState
          icon={IconSparkles}
          title={recomendaciones?.mensaje || 'Sin recomendaciones aún'}
          message={!perfil ? 'Reserva algunas sesiones para empezar a recibir sugerencias.' : undefined}
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
