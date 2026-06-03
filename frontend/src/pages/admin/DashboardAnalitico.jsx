import { useMemo } from 'react'
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { useMetricasResumen, useMetricasAnalisis } from '../../hooks/useMetricas'
import { CardSkeleton } from '../../components/ui/SkeletonLoader'
import { mondayFromYMD, todayYMD } from '../../utils/time'
import { IconTrendingUp, IconUsers, IconX, IconActivity } from '../../components/shared/Icons'

const DONUT_COLORS = {
  completada: '#10b981',
  cancelada: '#f59e0b',
  no_show: '#f43f5e',
}

const HEAT_COLORS = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']

function KpiCard({ icon: Icon, label, value, trend, trendLabel }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {trend !== undefined && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <IconTrendingUp className="h-3 w-3" />
              {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'vs semana ant.'}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-primary-50 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )
}

export function DashboardAnalitico({ onNotice }) {
  const fecha = useMemo(() => mondayFromYMD(todayYMD()), [])
  const { data: resumen, isLoading } = useMetricasResumen(fecha)
  const { data: analisis } = useMetricasAnalisis('semana', fecha)

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="col-span-3"><CardSkeleton className="h-32" /></div>
        ))}
        <div className="col-span-8"><CardSkeleton className="h-64" /></div>
        <div className="col-span-4"><CardSkeleton className="h-64" /></div>
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
  const tendencia = resumen?.cambioOcupacion

  const analisisData = analisis?.desglose || []

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-3">
        <KpiCard
          icon={Activity}
          label="Ocupación"
          value={`${ocupacion}%`}
          trend={tendencia}
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          icon={IconX}
          label="Tasa No-Show"
          value={`${tasaNoShow}%`}
          trend={resumen?.cambioNoShow}
          trendLabel="vs semana ant."
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          icon={Users}
          label="Suspendidos"
          value={resumen?.suspendidos || 0}
        />
      </div>
      <div className="col-span-3">
        <KpiCard
          icon={TrendingUp}
          label="Capacidad Total"
          value={resumen?.totalCapacidad || 0}
        />
      </div>

      <div className="col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Saturación Semanal</h3>
        {analisisData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analisisData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="porcentajeOcupacion" name="Ocupación %" radius={[8, 8, 0, 0]}>
                {analisisData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={HEAT_COLORS[Math.min(Math.floor((entry.porcentajeOcupacion || 0) / 12.5), 7)]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400">Sin datos de análisis semanal</p>
        )}
      </div>

      <div className="col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Estado de Reservas</h3>
        {donutData.length > 0 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.key} fill={DONUT_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              {donutData.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[entry.key] }}
                  />
                  <span className="text-slate-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Sin datos de reservas</p>
        )}
      </div>

      <div className="col-span-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Tendencia de Ocupación</h3>
        {analisisData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={analisisData}>
              <defs>
                <linearGradient id="fillOcupacion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="porcentajeOcupacion"
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
