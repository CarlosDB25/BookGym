import { useState, useEffect } from 'react'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useActualizarReglas, usePlantillas, useActualizarPlantilla, useAuditLog } from '../../hooks/useAdmin'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { EmptyState } from '../../components/ui/EmptyState'
import { IconSettings, IconSave, IconClock, IconAlertTriangle, IconCalendar, IconUsers, IconBan, IconUserX, IconSliders, IconHistory } from '../../components/shared/Icons'

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

function PlantillaRow({ plantilla, onEdit, editando, onChange, onGuardar, guardando }) {
  const editing = editando?.id === plantilla.id
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="min-w-[90px]">
        <span className="text-sm font-semibold capitalize text-slate-800">{plantilla.diaSemana}</span>
      </div>
      {editing ? (
        <>
          <input
            type="time"
            value={onChange ? undefined : plantilla.horaInicio}
            defaultValue={plantilla.horaInicio}
            onChange={(e) => onChange('horaInicio', e.target.value)}
            className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <span className="text-slate-400">—</span>
          <input
            type="time"
            value={onChange ? undefined : plantilla.horaFin}
            defaultValue={plantilla.horaFin}
            onChange={(e) => onChange('horaFin', e.target.value)}
            className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            defaultValue={plantilla.capacidadMaxima}
            onChange={(e) => onChange('capacidadMaxima', e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            min={1}
          />
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {guardando ? '...' : 'Guardar'}
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium text-slate-700">{plantilla.horaInicio}</span>
          <span className="text-slate-400">—</span>
          <span className="text-sm text-slate-700">{plantilla.horaFin}</span>
          <span className="ml-auto text-sm text-slate-600">
            Cap. <strong>{plantilla.capacidadMaxima}</strong>
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            plantilla.activa ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {plantilla.activa ? 'Activa' : 'Inactiva'}
          </span>
          <button
            onClick={() => onEdit(plantilla)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <IconSettings className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}

function PlantillasTab({ onNotice }) {
  const { data: plantillas = [], isLoading } = usePlantillas()
  const actualizarPlantilla = useActualizarPlantilla()
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})

  function handleEdit(p) {
    setEditando(p)
    setEditForm({ horaInicio: p.horaInicio, horaFin: p.horaFin, capacidadMaxima: p.capacidadMaxima })
  }

  function handleChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGuardar() {
    if (!editando) return
    try {
      await actualizarPlantilla.mutateAsync({ id: editando.id, ...editForm })
      onNotice?.('success', 'Plantilla actualizada')
      setEditando(null)
      setEditForm({})
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'Error al actualizar')
    }
  }

  if (isLoading) {
    return <div className="space-y-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
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

  const grouped = {}
  for (const p of plantillas) {
    if (!grouped[p.diaSemana]) grouped[p.diaSemana] = []
    grouped[p.diaSemana].push(p)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dia, items]) => (
        <div key={dia}>
          <h4 className="mb-2 text-sm font-bold capitalize text-slate-700">{dia}</h4>
          <div className="space-y-2">
            {items.map((p) => (
              <PlantillaRow
                key={p.id}
                plantilla={p}
                onEdit={handleEdit}
                editando={editando && editando.id === p.id ? editando : null}
                onChange={handleChange}
                onGuardar={handleGuardar}
                guardando={actualizarPlantilla.isPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditTab() {
  const { data: logs = [], isLoading } = useAuditLog()

  if (isLoading) {
    return <div className="space-y-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={IconHistory}
        title="Sin cambios registrados"
        message="Aún no se han realizado cambios en la configuración del sistema."
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
              <span className="font-medium text-slate-700">{log.idUsuario}</span>
              <span className="text-xs text-slate-400">{new Date(log.creadoEn).toLocaleString('es-CO')}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{log.accion} · {log.entidad}</p>
            {cambios.length > 0 && (
              <div className="mt-2 space-y-1">
                {cambios.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-600">{c.clave}:</span>
                    <span className="text-danger-500 line-through">{c.valorAnterior}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-success-600">{c.valorNuevo}</span>
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
