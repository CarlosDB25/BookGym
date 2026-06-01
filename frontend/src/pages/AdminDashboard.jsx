import { useMemo } from 'react';
import { useMetricas } from '../hooks/useMetricas';
import { getBogotaTodayYMD, mondayFromYMD } from '../utils/time';

export function AdminDashboard() {
  const fecha = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const {
    data: resumen,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
    isFetching,
  } = useMetricas(fecha);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando panel administrativo...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error cargando panel administrativo'}</p>;
  }

  return (
    <section className="fade-in space-y-5">
      <div className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--ink)]">Panel administrativo semanal</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Solo franjas vigentes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
            <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 font-semibold uppercase tracking-[0.2em]">
              Semana {resumen?.semana || fecha}
            </span>
            <span>Ultima actualizacion: {new Date(dataUpdatedAt).toLocaleTimeString('es-CO')}</span>
            <button
              onClick={() => refetch()}
              className="btn-outline rounded-md px-4 py-2 text-xs font-semibold transition"
            >
              {isFetching ? 'Actualizando...' : 'Actualizar ahora'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="stat-card p-4 card-rise">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Reservas realizadas</p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--ink)]">{resumen?.totalReservadas ?? 0}</p>
        </article>
        <article className="stat-card p-4 card-rise">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Cupos disponibles</p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--ink)]">{resumen?.totalDisponibles ?? 0}</p>
        </article>
        <article className="stat-card p-4 card-rise">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Capacidad total</p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--ink)]">{resumen?.totalCapacidad ?? 0}</p>
        </article>
        <article className="stat-card p-4 card-rise">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Ocupacion promedio</p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--ink)]">{resumen?.ocupacionPromedio ?? 0}%</p>
        </article>
      </div>

      <article className="surface p-5 card-rise">
        <h3 className="text-lg font-bold text-[color:var(--ink)]">Distribucion de saturacion (franjas)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="tag-danger rounded-xl p-3">
            <p className="text-xs uppercase tracking-[0.2em]">Alta</p>
            <p className="mt-2 text-2xl font-bold">{resumen?.saturacionAlta ?? 0}</p>
          </div>
          <div className="tag-warning rounded-xl p-3">
            <p className="text-xs uppercase tracking-[0.2em]">Media</p>
            <p className="mt-2 text-2xl font-bold">{resumen?.saturacionMedia ?? 0}</p>
          </div>
          <div className="tag-success rounded-xl p-3">
            <p className="text-xs uppercase tracking-[0.2em]">Baja</p>
            <p className="mt-2 text-2xl font-bold">{resumen?.saturacionBaja ?? 0}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
