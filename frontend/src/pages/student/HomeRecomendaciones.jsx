import { useAuth } from '../../hooks/useAuth'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useReservas, useRecomendaciones } from '../../hooks/useReservas'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconSparkles, IconClock, IconShieldAlert, IconCalendarCheck, IconCheckCircle, IconUser, IconActivity, IconTrendingUp } from '../../components/shared/Icons'
import { formatDate, nowMillis, parseSlotMillis } from '../../utils/time'

function AfinidadBadge({ nivel }) {
  if (nivel === 'alta') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        <IconSparkles className="h-3 w-3" />
        Para ti
      </span>
    )
  }
  if (nivel === 'media') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
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

  const mejoresMomentos = recomendaciones?.mejoresMomentos ?? []
  const evitando = recomendaciones?.evitando ?? []
  const perfil = recomendaciones?.perfilUsuario

  const ahora = nowMillis()
  const proximaReserva = reservasActivas
    .filter((r) => {
      const inicio = parseSlotMillis(r.franja?.fecha, r.franja?.horaInicio || r.franja?.plantilla?.horaInicio)
      return inicio > ahora
    })
    .sort((a, b) => {
      const aInicio = parseSlotMillis(a.franja?.fecha, a.franja?.horaInicio || a.franja?.plantilla?.horaInicio)
      const bInicio = parseSlotMillis(b.franja?.fecha, b.franja?.horaInicio || b.franja?.plantilla?.horaInicio)
      return aInicio - bInicio
    })[0]

  if (isLoading || loadingReglas || loadingReservas) {
    return (
      <div className="space-y-4 pt-4">
        <SkeletonLoader className="h-8 w-2/3" />
        <SkeletonLoader className="h-32 w-full" />
        <SkeletonLoader className="h-24 w-full" />
        <SkeletonLoader className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      {proximaReserva ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary-50 to-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <IconCalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Tu próxima reserva</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {proximaReserva.franja?.plantilla?.diaSemana || proximaReserva.franja?.diaSemana} · {formatDate(proximaReserva.franja?.fecha)}
              </p>
              <p className="text-sm font-medium text-slate-700">
                {proximaReserva.franja?.horaInicio || proximaReserva.franja?.plantilla?.horaInicio} -{' '}
                {proximaReserva.franja?.horaFin || proximaReserva.franja?.plantilla?.horaFin}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <IconCalendarCheck className="h-4 w-4 text-slate-400" />
            <span>No tienes reservas próximas</span>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, <span className="text-primary">{usuario?.nombre?.split(' ')[0] || 'estudiante'}</span>
        </h1>
        <p className="text-sm text-slate-500">
          {perfil ? 'Estas recomendaciones se basan en tu historial real de reservas.' : 'Estas son las franjas con más espacio disponible.'}
        </p>
      </div>

      {perfil && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <IconUser className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tu perfil de uso</h2>
              <p className="text-[11px] text-slate-500">Calculado sobre {perfil.historialRelevante} reservas</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Asistencia</p>
              <p className={`mt-0.5 text-lg font-bold ${perfil.tasaAsistencia >= 80 ? 'text-success-600' : perfil.tasaAsistencia >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                {perfil.tasaAsistencia}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">No-show</p>
              <p className={`mt-0.5 text-lg font-bold ${perfil.tasaNoShow === 0 ? 'text-success-600' : perfil.tasaNoShow <= 20 ? 'text-warning-600' : 'text-danger-600'}`}>
                {perfil.tasaNoShow}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Reservas</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">{perfil.totalReservas}</p>
            </div>
          </div>
          {perfil.diaFavorito && (
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <IconActivity className="h-3.5 w-3.5 text-primary" />
                <span>
                  Sueles ir los <strong className="text-slate-900 capitalize">{perfil.diaFavorito}</strong> ({perfil.diaFavoritoPct}% de tus reservas)
                </span>
              </div>
              {perfil.horaFavorita && (
                <div className="flex items-center gap-2">
                  <IconClock className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Tu hora habitual: <strong className="text-slate-900">{perfil.horaFavorita}</strong> ({perfil.horaFavoritaPct}% de las veces)
                  </span>
                </div>
              )}
              {perfil.slotFavoritoVeces >= 2 && (
                <div className="flex items-center gap-2">
                  <IconTrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Tu favorito: <strong className="text-slate-900 capitalize">{perfil.slotFavorito.replace('_', ' a las ')}</strong> ({perfil.slotFavoritoVeces} veces)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mejoresMomentos.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <IconSparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-900">Recomendados para ti</h2>
            <span className="text-xs text-slate-500">· {mejoresMomentos.length} opciones</span>
          </div>
          <div className="space-y-3">
            {mejoresMomentos.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AfinidadBadge nivel={item.afinidad} />
                      {item.ocupacionHistorica !== null && item.ocupacionHistorica < 50 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          {item.ocupacionHistorica}% ocupado
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-slate-900">
                      {item.dia} · {item.horaInicio} - {item.horaFin}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(item.fecha)} · {item.cuposRestantes} de {item.capacidadMaxima} cupos libres
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-primary-50/50 p-2.5">
                  <div className="flex items-start gap-2">
                    <IconCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900">¿Por qué te conviene?</strong> {item.razon}
                    </p>
                  </div>
                  {item.penalizaciones && item.penalizaciones.length > 0 && (
                    <p className="mt-1 text-[11px] text-amber-700">⚠ {item.penalizaciones[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {evitando.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <IconClock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Horarios que se llenan rápido</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">Históricamente estos horarios se agotan primero. Si los necesitas, reserva con anticipación.</p>
          <div className="space-y-2">
            {evitando.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {item.dia} · {item.horaInicio}
                  </p>
                  <p className="text-xs text-slate-500">{item.razon}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-700">{item.ocupacionHistorica}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-amber-600">lleno</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {mejoresMomentos.length === 0 && (
        <EmptyState
          icon={IconSparkles}
          title={recomendaciones?.mensaje || 'Sin recomendaciones aún'}
          message={!perfil ? 'Reserva algunas sesiones para empezar a recibir sugerencias basadas en tu historial.' : undefined}
        />
      )}

      {reglas && (
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <IconShieldAlert className="mt-0.5 h-4 w-4 text-slate-500" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Reglas del sistema</p>
              <p>Máx. {reglas.limiteReservasActivas} activas · {reglas.maxReservasPorDia} por día</p>
              <p>Reserva con al menos {reglas.anticipacionReservaMin} min de anticipación</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
