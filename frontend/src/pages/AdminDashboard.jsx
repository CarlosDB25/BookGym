import { useMemo } from 'react';
import { useFranjas } from '../hooks/useFranjas';
import { getBogotaTodayYMD, mondayFromYMD } from '../utils/time';

function calcularResumen(franjas) {
  const totalCapacidad = franjas.reduce((acc, f) => acc + f.capacidadMaxima, 0);
  const totalDisponibles = franjas.reduce((acc, f) => acc + f.cuposDisponibles, 0);
  const totalReservadas = totalCapacidad - totalDisponibles;
  const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservadas / totalCapacidad) * 100) : 0;

  const saturacionAlta = franjas.filter((f) => f.saturacion === 'alta').length;
  const saturacionMedia = franjas.filter((f) => f.saturacion === 'media').length;
  const saturacionBaja = franjas.filter((f) => f.saturacion === 'baja').length;

  return {
    totalCapacidad,
    totalReservadas,
    totalDisponibles,
    ocupacionPromedio,
    saturacionAlta,
    saturacionMedia,
    saturacionBaja,
  };
}

export function AdminDashboard() {
  const fecha = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const { data: franjas = [], isLoading, error } = useFranjas(fecha, true);
  const resumen = useMemo(() => calcularResumen(franjas), [franjas]);

  if (isLoading) {
    return <p className="text-sm text-slate-300">Cargando panel administrativo...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error?.response?.data?.error || 'Error cargando panel administrativo'}</p>;
  }

  return (
    <section className="fade-in space-y-5">
      <h2 className="text-2xl font-bold text-white">Panel administrativo semanal</h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-400">Reservas realizadas</p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-300">{resumen.totalReservadas}</p>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-400">Cupos disponibles</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-300">{resumen.totalDisponibles}</p>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-400">Capacidad total</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-100">{resumen.totalCapacidad}</p>
        </article>
        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
          <p className="text-xs uppercase tracking-wider text-slate-400">Ocupacion promedio</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-300">{resumen.ocupacionPromedio}%</p>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
        <h3 className="text-lg font-bold text-slate-100">Distribucion de saturacion (franjas)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-rose-500/20 p-3 text-rose-200">Alta: {resumen.saturacionAlta}</div>
          <div className="rounded-xl bg-amber-500/20 p-3 text-amber-200">Media: {resumen.saturacionMedia}</div>
          <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-200">Baja: {resumen.saturacionBaja}</div>
        </div>
      </article>
    </section>
  );
}
