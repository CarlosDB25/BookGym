import { SaturacionBadge } from './SaturacionBadge';

export function FranjaCard({ franja, onReservar, reservando }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{franja.diaSemana}</h3>
        <SaturacionBadge nivel={franja.saturacion} />
      </div>

      <p className="mt-3 text-lg font-bold text-slate-900">
        {franja.horaInicio} - {franja.horaFin}
      </p>

      <p className="text-sm text-slate-600">
        Cupos: <strong>{franja.cuposDisponibles}</strong> / {franja.capacidadMaxima}
      </p>

      <button
        className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        onClick={() => onReservar(franja.id)}
        disabled={reservando || franja.cuposDisponibles <= 0}
      >
        {franja.cuposDisponibles <= 0 ? 'Sin cupos' : reservando ? 'Reservando...' : 'Reservar'}
      </button>
    </article>
  );
}
