import { useAuth } from '../../hooks/useAuth'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useRecomendaciones } from '../../hooks/useReservas'
import { SaturacionBadge } from '../../components/ui/SaturacionBadge'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconSparkles, IconTrendingUp, IconArrowRight, IconClock, IconShieldAlert } from '../../components/shared/Icons'

export function HomeRecomendaciones({ onNotice }) {
  const { usuario } = useAuth()
  const { data: reglas, isLoading: loadingReglas } = useReglasReserva()
  const { data: recomendaciones, isLoading } = useRecomendaciones(5)

  const mejoresMomentos = recomendaciones?.mejoresMomentos ?? []
  const evitando = recomendaciones?.evitando ?? []

  if (isLoading || loadingReglas) {
    return (
      <div className="space-y-4 pt-4">
        <SkeletonLoader className="h-8 w-2/3" />
        <SkeletonLoader className="h-24 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hola, <span className="text-primary">{usuario?.nombre || ''}</span></h1>
          <p className="text-sm text-slate-500">Estas son tus mejores opciones hoy</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50">
          <span className="h-3 w-3 rounded-full bg-success-500" />
        </div>
      </div>

      {mejoresMomentos.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <IconSparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-800">Momentos recomendados</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {mejoresMomentos.map((item, idx) => (
              <div
                key={idx}
                className="flex shrink-0 snap-start flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
                style={{ minWidth: '160px' }}
              >
                <SaturacionBadge nivel={item.clasificacion} />
                <p className="text-lg font-bold text-slate-800">{item.horaInicio}</p>
                <p className="text-xs text-slate-500">
                  {item.diaSemana} · {item.cuposRestantes} cupos
                </p>
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>{item.tendencia === 'bajando' ? 'Mejorando' : 'Estable'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {evitando.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <IconClock className="h-4 w-4 text-warning-500" />
            <h2 className="text-sm font-semibold text-slate-800">Franjas con alta demanda</h2>
          </div>
          <div className="space-y-2">
            {evitando.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.horaInicio}</p>
                  <p className="text-xs text-slate-500">{item.diaSemana}</p>
                </div>
                <SaturacionBadge nivel="alta" />
              </div>
            ))}
          </div>
        </section>
      )}

      {mejoresMomentos.length === 0 && evitando.length === 0 && (
        <EmptyState
          icon={IconSparkles}
          title="Sin recomendaciones aún"
          message="Reserva algunas sesiones para recibir sugerencias personalizadas."
        />
      )}

      {reglas && (
        <div className="rounded-xl bg-primary-50 p-4">
          <div className="flex items-start gap-3">
            <IconShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
            <div className="text-xs text-primary-800">
              <p className="font-medium">Reglas activas</p>
              <p>Máx. {reglas.limiteReservasActivas} activas · {reglas.maxReservasPorDia} por día</p>
              <p>Reserva hasta {reglas.anticipacionReservaMin} min antes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
