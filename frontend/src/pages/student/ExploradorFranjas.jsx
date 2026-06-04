import { useMemo, useState } from 'react'
import { useFranjas } from '../../hooks/useFranjas'
import { useReservas, useCrearReserva } from '../../hooks/useReservas'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { SaturacionBadge } from '../../components/ui/SaturacionBadge'
import { ActionModal } from '../../components/ui/ActionModal'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  todayYMD,
  mondayFromYMD,
  formatDayHeader,
} from '../../utils/time'
import { IconCalendar, IconX } from '../../components/shared/Icons'

export function ExploradorFranjas({ onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(todayYMD()), [])
  const [selectedDay, setSelectedDay] = useState(todayYMD())
  const [modal, setModal] = useState({ open: false })
  const [pendiente, setPendiente] = useState(null)

  const { data: franjas = [], isLoading } = useFranjas(lunes)
  const { data: reservas = [] } = useReservas()
  const { data: reglas } = useReglasReserva()
  const crearReserva = useCrearReserva()

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(lunes)
      date.setDate(date.getDate() + i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }, [lunes])

  const idsReservados = new Set(reservas.map((r) => r.idFranja))
  const maxActivas = reglas?.limiteReservasActivas || 3
  const maxDia = reglas?.maxReservasPorDia || 1
  const reservasHoy = reservas.filter((r) => {
    const ymd = String(r.franja?.fecha || '').split('T')[0]
    return ymd === selectedDay
  }).length

  const franjasDelDia = useMemo(() => {
    return franjas
      .filter((f) => {
        const ymd = String(f.fecha || '').split('T')[0]
        return ymd === selectedDay
      })
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  }, [franjas, selectedDay])

  function pedirReserva(franja) {
    setPendiente(franja)
    setModal({
      open: true,
      type: 'info',
      title: 'Confirmar reserva',
      lines: [
        `${franja.diaSemana} · ${franja.horaInicio} - ${franja.horaFin}`,
        `Cupos: ${franja.cuposDisponibles}/${franja.capacidadMaxima}`,
        `Cancelación hasta ${reglas?.anticipacionCancelacionMin || 30} min antes`,
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

  return (
    <div className="space-y-4 pt-2">
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

      <div>
        <h1 className="text-xl font-bold text-slate-900">Explorar franjas</h1>
        <p className="text-sm text-slate-500">Selecciona un día para ver disponibilidad</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const isSelected = day === selectedDay
          const isToday = day === todayYMD()
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-primary'
              }`}
            >
              <span className="text-xs">{formatDayHeader(day).split(' ')[0]}</span>
              <span className="text-base font-bold">
                {formatDayHeader(day).split(' ')[1]?.split('/')[0]}
              </span>
              {isToday && (
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-primary'}`}>
                  Hoy
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : franjasDelDia.length === 0 ? (
        <EmptyState
          icon={IconCalendar}
          title="Sin franjas disponibles"
          message="No hay horarios disponibles para este día. Prueba con otra fecha."
        />
      ) : (
        <div className="space-y-3">
          {franjasDelDia.map((franja) => {
            const reservada = idsReservados.has(franja.id)
            const agotado = franja.cuposDisponibles <= 0
            const limiteActivo = reservas.length >= maxActivas
            const limiteDia = reservasHoy >= maxDia
            const deshabilitado = reservada || agotado || limiteActivo || limiteDia

            const ocupacion = ((franja.capacidadMaxima - franja.cuposDisponibles) / franja.capacidadMaxima) * 100
            const barColor =
              ocupacion >= 80
                ? 'bg-danger-500'
                : ocupacion >= 40
                ? 'bg-warning-400'
                : 'bg-success-500'

            let estadoLabel = 'Reservar'
            if (reservada) estadoLabel = 'Reservada'
            else if (agotado) estadoLabel = 'Agotado'
            else if (limiteActivo) estadoLabel = 'Límite activo'
            else if (limiteDia) estadoLabel = 'Tope diario'

            return (
              <div
                key={franja.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
              >
                <div className="min-w-[60px] text-center">
                  <p className="text-lg font-bold text-slate-800">{franja.horaInicio}</p>
                  <p className="text-xs text-slate-400">{franja.horaFin}</p>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      <strong className="text-slate-800">{franja.cuposDisponibles}</strong> / {franja.capacidadMaxima} cupos
                    </span>
                    <SaturacionBadge nivel={franja.saturacion} />
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(ocupacion, 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => pedirReserva(franja)}
                  disabled={deshabilitado || crearReserva.isPending}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    deshabilitado
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : 'bg-primary text-white hover:bg-primary-700'
                  }`}
                >
                  {crearReserva.isPending ? '...' : estadoLabel}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
