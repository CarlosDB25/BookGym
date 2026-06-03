import { useState, useEffect } from 'react'
import { useReglasReserva } from '../../hooks/useReglasReserva'
import { useActualizarReglas } from '../../hooks/useAdmin'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { IconSettings, IconSave, IconClock, IconAlertTriangle, IconCalendar, IconUsers, IconBan, IconUserX, IconSliders } from '../../components/shared/Icons'

const TABS = [
  { id: 'reserva', label: 'Reglas de Reserva', icon: IconCalendar },
  { id: 'checkin', label: 'Tiempos de Check-in', icon: IconClock },
  { id: 'plantillas', label: 'Gestión de Plantillas', icon: IconSliders },
]

const FIELD_META = {
  limiteReservasActivas: { label: 'Límite de reservas activas', icon: IconUsers, min: 1, max: 10, tab: 'reserva' },
  maxReservasPorDia: { label: 'Máximo reservas por día', icon: IconCalendar, min: 1, max: 5, tab: 'reserva' },
  anticipacionReservaMin: { label: 'Anticipación para reservar (min)', icon: IconClock, min: 5, max: 120, tab: 'reserva', step: 5 },
  anticipacionCancelacionMin: { label: 'Anticipación para cancelar (min)', icon: IconAlertTriangle, min: 5, max: 120, tab: 'reserva', step: 5 },
  ventanaCheckinMin: { label: 'Ventana de check-in (min)', icon: IconClock, min: 1, max: 60, tab: 'checkin' },
  umbralNoshow: { label: 'Umbral de no-show', icon: IconBan, min: 1, max: 10, tab: 'checkin' },
  diasSuspensionPorNoshow: { label: 'Días de suspensión', icon: IconUserX, min: 1, max: 30, tab: 'checkin' },
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
      await actualizar.mutateAsync(formValues)
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
            <button
              onClick={handleSave}
              disabled={!hasChanges || actualizar.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              <IconSave className="h-4 w-4" />
              {actualizar.isPending ? 'Publicando...' : 'Publicar Nuevas Reglas'}
            </button>
          </div>

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
        </div>
      </div>
    </div>
  )
}
