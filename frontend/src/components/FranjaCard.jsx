import { SaturacionBadge } from './SaturacionBadge';

export function FranjaCard({ franja, onReservar, reservando }) {
  return (
    <article className="surface p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{franja.diaSemana}</h3>
        <SaturacionBadge nivel={franja.saturacion} />
      </div>

      <p className="mt-3 text-lg font-bold text-[color:var(--ink)]">
        {franja.horaInicio} - {franja.horaFin}
      </p>

      <p className="text-sm text-[color:var(--muted)]">
        Cupos: <strong>{franja.cuposDisponibles}</strong> / {franja.capacidadMaxima}
      </p>

      <button
        className="btn-primary mt-4 w-full rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => onReservar(franja.id)}
        disabled={reservando || franja.cuposDisponibles <= 0}
      >
        {franja.cuposDisponibles <= 0 ? 'Sin cupos' : reservando ? 'Reservando...' : 'Reservar'}
      </button>
    </article>
  );
}
