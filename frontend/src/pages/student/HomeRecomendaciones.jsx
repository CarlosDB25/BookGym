import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useReservas, useRecomendaciones, useCrearReserva, useHistorialReservas } from '../../hooks/useReservas'
import { ActionModal } from '../../components/ui/ActionModal'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  IconSparkles, IconClock, IconShieldAlert, IconCalendarCheck,
  IconChevronRight, IconAlertTriangle, IconX,
} from '../../components/shared/Icons'
import { formatDate, nowMillis, parseSlotMillis } from '../../utils/time'

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

export function HomeRecomendaciones({ onNotice }) {
  const { usuario } = useAuth()
  const { data: reglas, isLoading: loadingReglas } = useReglasReserva()
  const { data: recomendaciones, isLoading } = useRecomendaciones(5)
  const { data: reservasActivas = [], isLoading: loadingReservas } = useReservas()
  const { data: historial = [] } = useHistorialReservas()
  const crearReserva = useCrearReserva()
  const [modal, setModal] = useState({ open: false })
  const [pendiente, setPendiente] = useState(null)

  const mejoresMomentos = recomendaciones?.mejoresMomentos ?? []
  const evitando = recomendaciones?.evitando ?? []

  const noShows = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'no_show'),
    [historial]
  )
  const fallas = noShows.length

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

  function pedirReserva(item) {
    setPendiente(item)
    setModal({
      open: true,
      type: 'info',
      title: 'Reservar horario recomendado',
      lines: [
        `${item.dia} · ${item.horaInicio} - ${item.horaFin}`,
        `Cupos: ${item.cuposRestantes}/${item.capacidadMaxima}`,
        item.razon,
      ],
      confirm: true,
    })
  }

  async function confirmarReserva() {
    if (!pendiente) return
    try {
      await crearReserva.mutateAsync(pendiente.id)
      onNotice?.('success', 'Reserva confirmada')
      setModal({ open: false })
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al reservar')
      setModal({ open: false })
    } finally {
      setPendiente(null)
    }
  }

  if (isLoading || loadingReglas || loadingReservas) {
    return (
      <div className="space-y-3 pt-2">
        <SkeletonLoader className="h-16 w-full" />
        <SkeletonLoader className="h-24 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2 pb-2">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal({ open: false })}
        onConfirm={modal.confirm ? confirmarReserva : undefined}
        confirmLabel="Reservar"
        cancelLabel="Volver"
      />

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

      {fallas > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-danger-100 bg-danger-50/50 px-3 py-1.5 dark:border-danger-900/30 dark:bg-danger-900/10">
          <IconAlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger-500" />
          <span className="text-xs font-medium text-danger-700 dark:text-danger-400">
            {fallas} inasistencia{fallas !== 1 ? 's' : ''} · {fallas >= 3 ? 'Cuenta suspendida' : `${3 - fallas} restante${3 - fallas !== 1 ? 's' : ''} antes de suspensión`}
          </span>
          <span className="ml-auto flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  i < fallas ? 'bg-danger-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </span>
        </div>
      )}

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

      {mejoresMomentos.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800">
          <div className="mb-2 flex items-center gap-1.5">
            <IconSparkles className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Recomendados para ti</h2>
            <span className="text-[10px] text-slate-500">· {mejoresMomentos.length}</span>
          </div>
          <ul className="space-y-1.5">
            {mejoresMomentos.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/30"
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
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {item.cuposRestantes} libres
                  </span>
                  <button
                    onClick={() => pedirReserva(item)}
                    disabled={crearReserva.isPending || item.cuposRestantes <= 0}
                    className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-white transition hover:bg-primary-700 disabled:opacity-40"
                  >
                    {crearReserva.isPending ? '...' : 'Reservar'}
                  </button>
                </div>
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