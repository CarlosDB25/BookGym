export function ReservaItem({ reserva, onCancelar, cancelando }) {
  const { franja } = reserva;
  const ymd = franja.fecha.split('T')[0];

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-sm card-rise">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">{franja.plantilla.diaSemana}</p>
      <p className="mt-1 text-lg font-bold text-white">
        {franja.plantilla.horaInicio} - {franja.plantilla.horaFin}
      </p>
      <p className="text-sm text-slate-300">Fecha: {ymd}</p>

      <button
        className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-rose-900"
        onClick={() => onCancelar(reserva.id)}
        disabled={cancelando}
      >
        {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
      </button>
    </article>
  );
}
