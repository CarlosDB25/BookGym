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
      <h2 className="text-2xl font-bold text-slate-900">Panel administrativo semanal</h2>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span>Semana: {resumen?.semana || fecha}</span>
        <span>Alcance: solo franjas vigentes (sin pasadas ni canceladas)</span>
        <span>Ultima actualizacion: {new Date(dataUpdatedAt).toLocaleTimeString('es-CO')}</span>
        <button
          onClick={() => refetch()}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
        >
          {isFetching ? 'Actualizando...' : 'Actualizar ahora'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-500">Reservas realizadas</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{resumen?.totalReservadas ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-500">Cupos disponibles</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{resumen?.totalDisponibles ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-500">Capacidad total</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{resumen?.totalCapacidad ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-500">Ocupacion promedio</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{resumen?.ocupacionPromedio ?? 0}%</p>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 card-rise">
        <h3 className="text-lg font-bold text-slate-900">Distribucion de saturacion (franjas)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-rose-50 p-3 text-rose-700">Alta: {resumen?.saturacionAlta ?? 0}</div>
          <div className="rounded-xl bg-amber-50 p-3 text-amber-700">Media: {resumen?.saturacionMedia ?? 0}</div>
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Baja: {resumen?.saturacionBaja ?? 0}</div>
        </div>
      </article>
    </section>
  );
}
