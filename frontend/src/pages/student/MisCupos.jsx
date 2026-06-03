import { useState, useMemo } from 'react'
import { useReservas, useHistorialReservas, useCancelarReserva, useCheckinReserva } from '../../hooks/useReservas'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { ActionModal } from '../../components/ui/ActionModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { SaturacionBadge } from '../../components/ui/SaturacionBadge'
import {
  nowMillis,
  parseSlotMillis,
  isWithinWindow,
  formatDate,
} from '../../utils/time'
import { IconTicket, IconHistory, IconCalendarCheck, IconXCircle, IconCheckCircle, IconClock, IconAlertTriangle } from '../../components/shared/Icons'

export function MisCupos({ onNotice }) {
  const [tab, setTab] = useState('activas')
  const [modal, setModal] = useState({ open: false })
  const [pendiente, setPendiente] = useState(null)
  const [checkinTarget, setCheckinTarget] = useState(null)

  const { data: reservas = [], isLoading } = useReservas()
  const { data: historial = [], isLoading: loadingHist } = useHistorialReservas()
  const { data: reglas } = useReglasReserva()
  const cancelar = useCancelarReserva()
  const checkin = useCheckinReserva()

  const windowCancel = (reglas?.anticipacionCancelacionMin || 30) * 60 * 1000
  const windowCheckin = reglas?.ventanaCheckinMin || 15
  const now = nowMillis()

  const activasConEstado = useMemo(() => {
    return reservas.map((r) => {
      const franja = r.franja
      const inicio = parseSlotMillis(franja.fecha, franja.horaInicio)
      const fin = parseSlotMillis(franja.fecha, franja.horaFin)
      const puedeCancelar = isWithinWindow(inicio, reglas?.anticipacionCancelacionMin || 30)
      const enVentanaCheckin =
        now >= inicio - windowCheckin * 60 * 1000 && now <= fin
      return { ...r, inicio, fin, puedeCancelar, enVentanaCheckin }
    }).sort((a, b) => a.inicio - b.inicio)
  }, [reservas, now, windowCancel, windowCheckin, reglas])

  function solicitarCancelacion(reserva) {
    setPendiente(reserva)
    setModal({
      open: true,
      type: 'info',
      title: 'Cancelar reserva',
      lines: [
        `${reserva.franja.diaSemana} · ${reserva.franja.horaInicio} - ${reserva.franja.horaFin}`,
        `¿Estás seguro? Esta acción no se puede deshacer.`,
      ],
      confirm: true,
    })
  }

  async function confirmarCancelacion() {
    if (!pendiente) return
    try {
      await cancelar.mutateAsync(pendiente.id)
      onNotice?.('success', 'Reserva cancelada')
      setModal({ open: false })
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al cancelar')
      setModal({ open: false })
    } finally {
      setPendiente(null)
    }
  }

  async function handleCheckin(id) {
    try {
      await checkin.mutateAsync(id)
      onNotice?.('success', 'Check-in registrado exitosamente')
      setCheckinTarget(null)
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error en check-in')
    }
  }

  const tabs = [
    { id: 'activas', label: 'Activas', icon: IconTicket, count: reservas.length },
    { id: 'historial', label: 'Historial', icon: IconHistory, count: historial.length },
  ]

  if (isLoading || loadingHist) {
    return (
      <div className="space-y-4 pt-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-2">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal({ open: false })}
        onConfirm={modal.confirm ? confirmarCancelacion : undefined}
        confirmLabel="Sí, cancelar"
        cancelLabel="No"
      />

      <ActionModal
        open={Boolean(checkinTarget)}
        type="info"
        title="Confirmar asistencia"
        lines={['Confirma tu asistencia a esta sesión. Toque dos veces para confirmar.']}
        onClose={() => setCheckinTarget(null)}
        onConfirm={checkinTarget ? () => handleCheckin(checkinTarget) : undefined}
        confirmLabel="Confirmar asistencia"
        cancelLabel="Cancelar"
      />

      <h1 className="text-xl font-bold text-slate-900">Mis Cupos</h1>

      <div className="flex gap-2">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tab === id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'activas' && (
        <>
          {activasConEstado.length === 0 ? (
            <EmptyState
              icon={IconTicket}
              title="Sin reservas activas"
              message="Reserva un horario desde la sección Explorar."
            />
          ) : (
            <div className="space-y-3">
              {activasConEstado.map((reserva) => (
                <div
                  key={reserva.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <SaturacionBadge
                      nivel={reserva.enVentanaCheckin ? 'baja' : 'media'}
                    />
                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(reserva.franja.fecha)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {reserva.franja.horaInicio} - {reserva.franja.horaFin}
                  </p>
                  <p className="text-sm text-slate-500">{reserva.franja.diaSemana}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {reserva.enVentanaCheckin && (
                      <button
                        onClick={() => setCheckinTarget(reserva.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-success-600"
                      >
                        <IconCheckCircle className="h-4 w-4" />
                        Confirmar Asistencia
                      </button>
                    )}
                    {reserva.puedeCancelar && (
                      <button
                        onClick={() => solicitarCancelacion(reserva)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <IconXCircle className="h-4 w-4" />
                        Cancelar Turno
                      </button>
                    )}
                    {!reserva.puedeCancelar && !reserva.enVentanaCheckin && (
                      <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-400">
                        <IconClock className="h-3 w-3" />
                        Ventana de cancelación cerrada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'historial' && (
        <>
          {historial.length === 0 ? (
            <EmptyState
              icon={IconHistory}
              title="Sin historial"
              message="Tus reservas pasadas aparecerán aquí."
            />
          ) : (
            <div className="space-y-2">
              {historial.map((reserva) => {
                const estado = String(reserva.estado || '').toLowerCase()
                const colorMap = {
                  completada: 'text-success-600 bg-success-50',
                  cancelada: 'text-danger-600 bg-danger-50',
                  no_show: 'text-warning-600 bg-warning-50',
                  activa: 'text-primary-600 bg-primary-50',
                }
                const color = colorMap[estado] || colorMap.activa
                const IconMap = {
                  completada: IconCheckCircle,
                  cancelada: IconXCircle,
                  no_show: IconAlertTriangle,
                  activa: IconClock,
                }
                const Icon = IconMap[estado] || IconClock

                return (
                  <div
                    key={reserva.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {reserva.franja?.horaInicio} - {reserva.franja?.horaFin}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reserva.franja?.diaSemana} · {formatDate(reserva.franja?.fecha)}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
                      <Icon className="h-3 w-3" />
                      {estado === 'no_show' ? 'No show' : estado}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
