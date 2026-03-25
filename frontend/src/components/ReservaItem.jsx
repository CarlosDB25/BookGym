export function ReservaItem({ reserva, onCancelar, cancelando, nota = null }) {
  const { franja } = reserva;
  const ymd = franja.fecha.split('T')[0];
  const mostrarCancelar = typeof onCancelar === 'function';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm card-rise">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{franja.plantilla.diaSemana}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        {franja.plantilla.horaInicio} - {franja.plantilla.horaFin}
      </p>
      <p className="text-sm text-slate-600">Fecha: {ymd}</p>
      <p className="text-sm text-slate-600">Estado: {reserva.estado}</p>
      {nota ? <p className="mt-2 text-xs text-amber-700">{nota}</p> : null}

      {mostrarCancelar ? (
        <button
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          onClick={() => onCancelar(reserva.id)}
          disabled={cancelando}
        >
          {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
        </button>
      ) : null}
    </article>
  );
}
