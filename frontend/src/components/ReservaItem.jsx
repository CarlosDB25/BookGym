export function ReservaItem({ reserva, onCancelar, cancelando, nota = null }) {
  const { franja } = reserva;
  const ymd = franja.fecha.split('T')[0];
  const mostrarCancelar = typeof onCancelar === 'function';
  const estado = String(reserva.estado || '').toLowerCase();
  const estadoClass =
    estado === 'activa'
      ? 'tag-success'
      : estado === 'cancelada'
      ? 'tag-danger'
      : 'tag-warning';

  return (
    <article className="surface p-4 card-rise">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">{franja.plantilla.diaSemana}</p>
        <span className={`${estadoClass} rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]`}>
          {reserva.estado}
        </span>
      </div>
      <p className="mt-2 text-lg font-bold text-[color:var(--ink)]">
        {franja.plantilla.horaInicio} - {franja.plantilla.horaFin}
      </p>
      <p className="text-sm text-[color:var(--muted)]">Fecha: {ymd}</p>
      {nota ? <p className="mt-2 text-xs text-[color:var(--accent-strong)]">{nota}</p> : null}

      {mostrarCancelar ? (
        <button
          className="btn-primary mt-4 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onCancelar(reserva.id)}
          disabled={cancelando}
        >
          {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
        </button>
      ) : null}
    </article>
  );
}
