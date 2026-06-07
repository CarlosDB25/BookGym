import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { useMetricasResumen, useMetricasAnalisis, useMetricasHeatmap } from '../../hooks/useMetricas'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { mondayFromYMD, todayYMD } from '../../utils/time'
import { IconTrendingUp, IconUsers, IconX, IconActivity, IconCalendar } from '../../components/shared/Icons'

const DONUT_COLORS = {
  completada: '#10b981',
  cancelada: '#f59e0b',
  no_show: '#f43f5e',
}

function ocupacionColor(pct) {
  if (pct >= 80) return '#f43f5e'
  if (pct >= 60) return '#f59e0b'
  if (pct >= 40) return '#3b82f6'
  return '#10b981'
}

function heatColor(pct) {
  if (pct >= 80) return 'bg-rose-500'
  if (pct >= 60) return 'bg-amber-400'
  if (pct >= 40) return 'bg-primary'
  if (pct >= 20) return 'bg-emerald-400'
  return 'bg-emerald-500/30'
}

function heatOpacity(pct) {
  if (pct >= 80) return 'opacity-100'
  if (pct >= 60) return 'opacity-85'
  if (pct >= 40) return 'opacity-70'
  if (pct >= 20) return 'opacity-55'
  return 'opacity-25'
}

const TIPO_OPCIONES = [
  { id: 'semana', label: 'Semanal' },
  { id: 'dia', label: 'Diario' },
  { id: 'mes', label: 'Mensual' },
  { id: 'todo', label: 'Siempre' },
]

function MiniSparkline({ values, color = '#4f46e5' }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex items-end gap-[2px] h-8">
      {values.slice(-6).map((v, i) => {
        const h = Math.max(2, (v / max) * 28)
        return (
          <div
            key={i}
            className="w-full rounded-sm transition-all"
            style={{ height: h, backgroundColor: color, opacity: 0.3 + (v / max) * 0.7 }}
          />
        )
      })}
    </div>
  )
}

function KpiCard({ icon, label, value, trend, trendLabel, sparkData }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {trend !== undefined && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <IconTrendingUp className="h-3 w-3" />
              {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'vs ant.'}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-xl bg-primary-50 p-3">
            {icon}
          </div>
          {sparkData && sparkData.length > 0 && (
            <MiniSparkline values={sparkData} />
          )}
        </div>
      </div>
    </div>
  )
}

export function DashboardAnalitico() {
  const fecha = useMemo(() => mondayFromYMD(todayYMD()), [])
  const [tipoAnalisis, setTipoAnalisis] = useState('semana')
  const { data: resumen, isLoading } = useMetricasResumen(fecha)
  const { data: analisis } = useMetricasAnalisis(tipoAnalisis, fecha)
  const { data: heatmapData } = useMetricasHeatmap(tipoAnalisis, fecha)

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3"><CardSkeleton className="h-32" /></div>
        ))}
        <div className="col-span-12 lg:col-span-8"><CardSkeleton className="h-64" /></div>
        <div className="col-span-12 lg:col-span-4"><CardSkeleton className="h-64" /></div>
        <div className="col-span-12"><CardSkeleton className="h-72" /></div>
      </div>
    )
  }

  const donutData = [
    { name: 'Completadas', value: resumen?.totalReservadas || 0, key: 'completada' },
    { name: 'Canceladas', value: resumen?.totalCanceladas || 0, key: 'cancelada' },
    { name: 'No Show', value: resumen?.totalNoShow || 0, key: 'no_show' },
  ].filter((d) => d.value > 0)

  const ocupacion = resumen?.ocupacionPromedio || 0
  const tasaNoShow = resumen?.tasaNoShow || 0
  const analisisData = analisis?.desglose || []
  const sparkData = analisisData.map((d) => d.ocupacion || 0)

  const heatmapFilas = heatmapData?.filas || []
  const heatmapHoras = heatmapData?.horas || []

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard
          icon={IconActivity}
          label="Ocupación"
          value={`${Number(ocupacion).toFixed(1)}%`}
          trend={resumen?.cambioOcupacion}
          trendLabel="vs ant."
          sparkData={sparkData}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard
          icon={IconX}
          label="Tasa No-Show"
          value={`${Number(tasaNoShow).toFixed(1)}%`}
          trend={resumen?.cambioNoShow}
          trendLabel="vs ant."
          sparkData={sparkData}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard
          icon={IconUsers}
          label="Suspendidos"
          value={resumen?.suspendidos || 0}
          sparkData={sparkData}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard
          icon={IconTrendingUp}
          label="Capacidad Total"
          value={resumen?.totalCapacidad || 0}
          sparkData={sparkData}
        />
      </div>

      <div className="col-span-12 lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Saturación</h3>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {TIPO_OPCIONES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTipoAnalisis(id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  tipoAnalisis === id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {analisisData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analisisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val) => [`${Number(val).toFixed(1)}%`, 'Ocupación']}
              />
              <Bar dataKey="ocupacion" name="Ocupación %" radius={[6, 6, 0, 0]}>
                {analisisData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={ocupacionColor(entry.ocupacion || 0)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400">Sin datos de análisis</p>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Estado de Reservas</h3>
        {donutData.length > 0 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.key} fill={DONUT_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [val, 'Reservas']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {donutData.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[entry.key] }} />
                  <span className="text-slate-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin datos de reservas</p>
        )}
      </div>

      {heatmapFilas.length > 0 && (
        <div className="col-span-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Mapa de Calor</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
              <span>Bajo</span>
              <div className="flex gap-0.5">
                <div className="h-3 w-3 rounded-sm bg-emerald-500/25" />
                <div className="h-3 w-3 rounded-sm bg-emerald-500/55" />
                <div className="h-3 w-3 rounded-sm bg-primary/70" />
                <div className="h-3 w-3 rounded-sm bg-amber-400/85" />
                <div className="h-3 w-3 rounded-sm bg-rose-500" />
              </div>
              <span>Alto</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${heatmapHoras.length}, minmax(48px, 1fr))` }}>
              <div className="text-[10px] font-semibold text-slate-400" />
              {heatmapHoras.map((h) => (
                <div key={h} className="text-center text-[9px] font-mono font-bold text-slate-500">{h}</div>
              ))}
              {heatmapFilas.map((fila) => (
                <>
                  <div className="flex items-center text-[11px] font-semibold text-slate-700 capitalize">
                    <IconCalendar className="mr-1.5 h-3 w-3 text-slate-400" />
                    {fila.label?.slice(0, 3)}
                  </div>
                  {fila.slots.map((slot, si) => (
                    <div
                      key={si}
                      className={`h-8 rounded-md ${slot.activa ? heatColor(slot.ocupacion) : 'bg-slate-100'} ${heatOpacity(slot.ocupacion)} flex items-center justify-center`}
                      title={`${fila.dia} ${slot.hora}: ${slot.ocupacion}% ocupado`}
                    >
                      <span className="text-[8px] font-bold text-white drop-shadow-sm">
                        {slot.activa ? `${slot.ocupacion}%` : ''}
                      </span>
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="col-span-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Tendencia de Ocupación</h3>
        {analisisData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analisisData}>
              <defs>
                <linearGradient id="fillOcupacion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val) => [`${Number(val).toFixed(1)}%`, 'Ocupación']}
              />
              <Area
                type="monotone"
                dataKey="ocupacion"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#fillOcupacion)"
                name="Ocupación %"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400">Sin datos de tendencia</p>
        )}
      </div>
    </div>
  )
}