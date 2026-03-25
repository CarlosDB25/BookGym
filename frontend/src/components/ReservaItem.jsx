export function ReservaItem({ reserva, onCancelar, cancelando }) {
  const { franja } = reserva;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{franja.plantilla.diaSemana}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        {franja.plantilla.horaInicio} - {franja.plantilla.horaFin}
      </p>
      <p className="text-sm text-slate-600">Fecha: {new Date(franja.fecha).toLocaleDateString('es-CO')}</p>

      <button
        className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-rose-300"
        onClick={() => onCancelar(reserva.id)}
        disabled={cancelando}
      >
        {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
      </button>
    </article>
  );
}
