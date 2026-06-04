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
  formatDayHeader,
  nowMillis,
  parseSlotMillis,
} from '../../utils/time'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconUsers, IconClock } from '../../components/shared/Icons'

function ymdUTC(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getNext5Weekdays(fromYmd) {
  const [y, m, d] = fromYmd.split('-').map(Number)
  const dates = []
  const current = new Date(y, m - 1, d)
  current.setHours(0, 0, 0, 0)

  while (dates.length < 5) {
    const day = current.getDay()
    if (day >= 1 && day <= 5) {
      dates.push(ymdUTC(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function ExploradorFranjas({ onNotice }) {
  const initialStart = todayYMD()
  const [startDate, setStartDate] = useState(initialStart)

  const weekDays = useMemo(() => getNext5Weekdays(startDate), [startDate])

  const defaultDay = useMemo(() => {
    const today = todayYMD()
    if (weekDays.includes(today)) return today
    return weekDays[0]
  }, [weekDays])

  const [selectedDay, setSelectedDay] = useState(defaultDay)
  const [modal, setModal] = useState({ open: false })
  const [pendiente, setPendiente] = useState(null)

  const { data: franjas = [], isLoading } = useFranjas(weekDays[0])
  const { data: reservas = [] } = useReservas()
  const { data: reglas } = useReglasReserva()
  const crearReserva = useCrearReserva()

  const idsReservados = new Set(reservas.map((r) => r.idFranja))
  const maxActivas = reglas?.limiteReservasActivas || 3
  const maxDia = reglas?.maxReservasPorDia || 1
  const reservasHoy = reservas.filter((r) => {
    const ymd = String(r.franja?.fecha || '').split('T')[0]
    return ymd === selectedDay
  }).length

  const franjasDelDia = useMemo(() => {
    const ahora = nowMillis()
    const anticipacion = reglas?.anticipacionReservaMin || 30
    return franjas
      .filter((f) => {
        const fechaStr = String(f.fecha || '').split('T')[0]
        return fechaStr === selectedDay
      })
      .map((f) => {
        const inicio = parseSlotMillis(f.fecha, f.horaInicio)
        const fin = parseSlotMillis(f.fecha, f.horaFin)
        const yaPaso = fin < ahora
        const esPronto = inicio - ahora < anticipacion * 60 * 1000
        return { ...f, inicio, fin, yaPaso, esPronto }
      })
      .sort((a, b) => a.inicio - b.inicio)
  }, [franjas, selectedDay, reglas])

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

  function cambiarPeriodo(direccion) {
    const [y, m, d] = weekDays[0].split('-').map(Number)
    const base = new Date(y, m - 1, d)
    base.setDate(base.getDate() + (direccion === 'next' ? 7 : -7))
    const nuevo = ymdUTC(base)
    setStartDate(nuevo)
    setSelectedDay(nuevo)
  }

  const esPeriodoActual = weekDays.includes(todayYMD())

  return (
    <div className="space-y-5 pt-2 md:pt-0">
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservar</h1>
          <p className="text-sm text-slate-500">Elige un día para ver disponibilidad</p>
        </div>
        {esPeriodoActual && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            Esta semana
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => cambiarPeriodo('prev')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            aria-label="Período anterior"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {weekDays.map((day) => {
              const isSelected = day === selectedDay
              const isToday = day === todayYMD()
              const dayDate = new Date(`${day}T00:00:00`)
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-2 transition ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {formatDayHeader(day).split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {dayDate.getDate()}
                  </span>
                  {isToday && (
                    <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-primary'}`}>
                      Hoy
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => cambiarPeriodo('next')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            aria-label="Período siguiente"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
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
            const pasada = franja.yaPaso

            const deshabilitado = reservada || agotado || limiteActivo || limiteDia || pasada

            const ocupacion = ((franja.capacidadMaxima - franja.cuposDisponibles) / franja.capacidadMaxima) * 100
            const barColor =
              ocupacion >= 80
                ? 'bg-danger-500'
                : ocupacion >= 40
                ? 'bg-warning-400'
                : 'bg-success-500'

            let estadoLabel = 'Reservar'
            let estadoColor = 'bg-primary text-white hover:bg-primary-700'
            if (pasada) { estadoLabel = 'Pasado'; estadoColor = 'bg-slate-100 text-slate-400' }
            else if (reservada) { estadoLabel = 'Ya reservada'; estadoColor = 'bg-slate-100 text-slate-400' }
            else if (agotado) { estadoLabel = 'Agotado'; estadoColor = 'bg-slate-100 text-slate-400' }
            else if (limiteActivo) { estadoLabel = 'Límite activo'; estadoColor = 'bg-slate-100 text-slate-400' }
            else if (limiteDia) { estadoLabel = 'Tope diario'; estadoColor = 'bg-slate-100 text-slate-400' }
            else if (franja.esPronto) { estadoLabel = 'Reservar pronto'; estadoColor = 'bg-warning-500 text-white hover:bg-warning-600' }

            return (
              <div
                key={franja.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  pasada ? 'border-slate-100 opacity-60' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 py-3">
                    <IconClock className="mb-1 h-4 w-4 text-slate-400" />
                    <p className="text-lg font-bold text-slate-800">{franja.horaInicio}</p>
                    <p className="text-[10px] text-slate-500">a {franja.horaFin}</p>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <IconUsers className="h-4 w-4 text-slate-400" />
                        <strong className="text-slate-800">{franja.cuposDisponibles}</strong>
                        <span>/ {franja.capacidadMaxima} cupos</span>
                      </div>
                      <SaturacionBadge nivel={franja.saturacion} />
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(ocupacion, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => pedirReserva(franja)}
                    disabled={deshabilitado || crearReserva.isPending}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${estadoColor} ${
                      deshabilitado || crearReserva.isPending ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {crearReserva.isPending ? '...' : estadoLabel}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {franjasDelDia.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          {franjasDelDia.filter((f) => !f.yaPaso).length} horarios disponibles para este día
        </p>
      )}
    </div>
  )
}
