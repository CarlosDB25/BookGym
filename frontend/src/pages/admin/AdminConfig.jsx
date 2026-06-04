import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useActualizarReglas, usePlantillas, useActualizarPlantilla, useAuditLog } from '../../hooks/useAdmin'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconSave, IconClock, IconAlertTriangle, IconCalendar, IconUsers, IconBan, IconUserX, IconSliders, IconHistory, IconCheck, IconX, IconPencil } from '../../components/shared/Icons'

const TABS = [
  { id: 'reserva', label: 'Reglas de Reserva', icon: IconCalendar },
  { id: 'checkin', label: 'Tiempos de Check-in', icon: IconClock },
  { id: 'plantillas', label: 'Gestión de Plantillas', icon: IconSliders },
  { id: 'audit', label: 'Historial de Cambios', icon: IconHistory },
]

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

const FIELD_META = {
  limiteReservasActivas: { label: 'Límite de reservas activas', icon: IconUsers, min: 1, max: 10, step: 1, tab: 'reserva', unit: 'reservas' },
  maxReservasPorDia: { label: 'Máximo reservas por día', icon: IconCalendar, min: 1, max: 5, step: 1, tab: 'reserva', unit: 'reservas' },
  anticipacionReservaMin: { label: 'Anticipación para reservar', icon: IconClock, min: 10, max: 1440, step: 10, tab: 'reserva', unit: 'minutos' },
  anticipacionCancelacionMin: { label: 'Anticipación para cancelar', icon: IconAlertTriangle, min: 5, max: 1440, step: 5, tab: 'reserva', unit: 'minutos' },
  ventanaCheckinMin: { label: 'Ventana de check-in', icon: IconClock, min: 5, max: 120, step: 5, tab: 'checkin', unit: 'minutos' },
  umbralNoshow: { label: 'Umbral de no-show', icon: IconBan, min: 1, max: 20, step: 1, tab: 'checkin', unit: 'inasistencias' },
  diasSuspensionPorNoshow: { label: 'Días de suspensión', icon: IconUserX, min: 1, max: 90, step: 1, tab: 'checkin', unit: 'días' },
}

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
]

function ReservaTab({ fields, formValues, reglas, handleChange }) {
  return (
    <div className="space-y-6">
      {fields.map(([key, meta]) => {
        const value = formValues[key] ?? reglas[key] ?? 0
        const pct = ((value - meta.min) / (meta.max - meta.min)) * 100

        return (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <meta.icon className="h-4 w-4 text-slate-400" />
                {meta.label}
              </label>
              <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-700">
                {value}
              </span>
            </div>
            <input
              type="range"
              min={meta.min}
              max={meta.max}
              step={meta.step || 1}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-100 accent-primary"
              style={{
                background: `linear-gradient(to right, #4f46e5 ${pct}%, #e2e8f0 ${pct}%)`,
              }}
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{meta.min}</span>
              <span>{meta.max}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PlantillaEditModal({ plantilla, onClose, onSave, guardando }) {
  const [horaInicio, setHoraInicio] = useState(plantilla.horaInicio)
  const [horaFin, setHoraFin] = useState(plantilla.horaFin)
  const [capacidadMaxima, setCapacidadMaxima] = useState(plantilla.capacidadMaxima)

  async function handleSubmit(e) {
    e.preventDefault()
    await onSave({
      horaInicio,
      horaFin,
      capacidadMaxima: Number(capacidadMaxima),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 capitalize">
            Editar {plantilla.diaSemana}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <IconX className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hora de inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hora de fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Capacidad máxima</label>
            <input
              type="number"
              value={capacidadMaxima}
              onChange={(e) => setCapacidadMaxima(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              min={1}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PlantillasTab({ onNotice }) {
  const queryClient = useQueryClient()
  const { data: plantillas = [], isLoading } = usePlantillas()
  const actualizarPlantilla = useActualizarPlantilla()
  const [editing, setEditing] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const slotsUnicos = useMemo(() => {
    const set = new Set()
    plantillas.forEach((p) => set.add(`${p.horaInicio}-${p.horaFin}`))
    return Array.from(set)
      .sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]))
      .map((s) => {
        const [hi, hf] = s.split('-')
        return { key: s, horaInicio: hi, horaFin: hf }
      })
  }, [plantillas])

  const mapa = useMemo(() => {
    const m = new Map()
    plantillas.forEach((p) => {
      m.set(`${p.diaSemana}|${p.horaInicio}-${p.horaFin}`, p)
    })
    return m
  }, [plantillas])

  async function handleToggle(diaSemana, slot) {
    const key = `${diaSemana}|${slot.key}`
    const actual = mapa.get(key)
    try {
      if (actual) {
        await actualizarPlantilla.mutateAsync({
          id: actual.id,
          activa: !actual.activa,
        })
        onNotice?.('success', `Franja ${actual.activa ? 'desactivada' : 'activada'}`)
      }
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al cambiar estado')
    }
  }

  async function handleSave(datos) {
    if (!editing) return
    setGuardando(true)
    try {
      await actualizarPlantilla.mutateAsync({
        id: editing.id,
        ...datos,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-plantillas'] })
      onNotice?.('success', 'Plantilla actualizada')
      setEditing(null)
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al actualizar')
    } finally {
      setGuardando(false)
    }
  }

  if (isLoading) {
    return <div className="space-y-2"><CardSkeleton /><CardSkeleton /></div>
  }

  if (plantillas.length === 0) {
    return (
      <EmptyState
        icon={IconSliders}
        title="Sin plantillas"
        message="No hay plantillas de franja configuradas."
      />
    )
  }

  const activasCount = plantillas.filter((p) => p.activa).length
  const totalCount = plantillas.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <div>
          <p className="font-semibold text-slate-800">Franjas semanales</p>
          <p className="text-xs text-slate-500">Marca las casillas para activar o desactivar</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-primary" />
            <span className="font-medium text-slate-600">Activa</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-slate-300 bg-white" />
            <span className="font-medium text-slate-600">Inactiva</span>
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">
            {activasCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Día
              </th>
              {slotsUnicos.map((slot) => (
                <th key={slot.key} className="px-2 py-3 text-center text-xs font-semibold text-slate-600">
                  <div className="font-mono">{slot.horaInicio}</div>
                  <div className="text-[10px] font-normal text-slate-400">a {slot.horaFin}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIAS_SEMANA.map((dia) => (
              <tr key={dia.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                <td className="sticky left-0 z-10 bg-white px-3 py-3 text-sm font-semibold text-slate-700 group-hover:bg-slate-50">
                  {dia.label}
                </td>
                {slotsUnicos.map((slot) => {
                  const key = `${dia.id}|${slot.key}`
                  const plantilla = mapa.get(key)
                  const activa = plantilla?.activa || false
                  return (
                    <td key={slot.key} className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => plantilla && handleToggle(dia.id, slot)}
                          disabled={!plantilla}
                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all ${
                            activa
                              ? 'border-primary bg-primary text-white shadow-sm hover:scale-105'
                              : plantilla
                              ? 'border-slate-300 bg-white text-slate-300 hover:border-primary/50'
                              : 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50'
                          }`}
                          title={
                            plantilla
                              ? `${plantilla.horaInicio}-${plantilla.horaFin} · Capacidad: ${plantilla.capacidadMaxima}`
                              : 'Sin plantilla'
                          }
                        >
                          {activa && <IconCheck className="h-5 w-5" />}
                        </button>
                        {plantilla && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span>{plantilla.capacidadMaxima}</span>
                            <button
                              type="button"
                              onClick={() => setEditing(plantilla)}
                              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
                              title="Editar hora/capacidad"
                            >
                              <IconPencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Haz clic en una casilla para activar o desactivar la franja. Usa el ícono de lápiz para
        editar la hora o capacidad de una franja específica.
      </p>

      {editing && (
        <PlantillaEditModal
          plantilla={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          guardando={guardando}
        />
      )}
    </div>
  )
}

function AuditTab() {
  const { data: logs = [], isLoading, error } = useAuditLog()

  if (isLoading) {
    return <div className="space-y-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={IconHistory}
        title="Sin cambios registrados"
        message={error ? `Error al cargar: ${error.message}` : 'Aún no se han realizado cambios en la configuración del sistema.'}
      />
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        let cambios = []
        try { cambios = JSON.parse(log.detalle || '[]') } catch {}
        return (
          <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Admin: {log.idUsuario}</span>
              <span className="text-xs text-slate-400">
                {new Date(log.creadoEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {log.accion === 'actualizar_config' ? 'Actualización de reglas operativas' : log.accion} · {log.entidad}
            </p>
            {cambios.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-lg bg-white p-3">
                {cambios.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-700">{c.clave}:</span>
                    <span className="text-danger-500 line-through">{c.valorAnterior || '—'}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-bold text-success-600">{c.valorNuevo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AdminConfig({ onNotice }) {
  const [tab, setTab] = useState('reserva')
  const [formValues, setFormValues] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const { data: reglas, isLoading } = useReglasReserva()
  const actualizar = useActualizarReglas()

  useEffect(() => {
    if (reglas) {
      setFormValues((prev) => {
        if (Object.keys(prev).length > 0) return prev
        return { ...reglas }
      })
    }
  }, [reglas])

  function handleChange(key, value) {
    const num = Math.max(0, Math.floor(Number(value) || 0))
    setFormValues((prev) => ({ ...prev, [key]: num }))
    setHasChanges(true)
  }

  async function handleSave() {
    try {
      const snakePayload = Object.fromEntries(
        Object.entries(formValues).map(([k, v]) => [toSnakeCase(k), v])
      )
      await actualizar.mutateAsync(snakePayload)
      onNotice?.('success', 'Reglas publicadas exitosamente')
      setHasChanges(false)
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al publicar reglas')
    }
  }

  const fields = Object.entries(FIELD_META).filter(([, meta]) => meta.tab === tab)

  if (isLoading || !reglas) {
    return (
      <div className="grid grid-cols-12 gap-8 p-6">
        <div className="col-span-4"><CardSkeleton className="h-64" /></div>
        <div className="col-span-8"><CardSkeleton className="h-96" /></div>
      </div>
    )
  }

  function renderTabContent() {
    switch (tab) {
      case 'reserva':
      case 'checkin':
        return <ReservaTab fields={fields.filter(([, m]) => m.tab === tab)} formValues={formValues} reglas={reglas} handleChange={handleChange} />
      case 'plantillas':
        return <PlantillasTab onNotice={onNotice} />
      case 'audit':
        return <AuditTab />
      default:
        return null
    }
  }

  function renderHeaderButton() {
    if (tab === 'reserva' || tab === 'checkin') {
      return (
        <button
          onClick={handleSave}
          disabled={!hasChanges || actualizar.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          <IconSave className="h-4 w-4" />
          {actualizar.isPending ? 'Publicando...' : 'Publicar Nuevas Reglas'}
        </button>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-12 gap-8 p-6">
      <div className="col-span-4 space-y-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="col-span-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              {TABS.find((t) => t.id === tab)?.label}
            </h3>
            {renderHeaderButton()}
          </div>

          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
