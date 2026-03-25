export function ActionModal({
  open,
  type = 'info',
  title,
  lines = [],
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}) {
  if (!open) return null;

  const tone =
    type === 'error'
      ? 'border-rose-300 bg-white text-rose-800'
      : 'border-slate-300 bg-white text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <article className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl card-rise ${tone}`}>
        <h3 className="text-lg font-bold">{title}</h3>

        <div className="mt-3 space-y-2 text-sm">
          {lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>

        {onConfirm ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Entendido
          </button>
        )}
      </article>
    </div>
  );
}
