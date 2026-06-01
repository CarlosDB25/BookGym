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
      : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <article className={`w-full max-w-md rounded-[16px] border p-5 shadow-2xl card-rise ${tone}`}>
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
              className="btn-outline rounded-md px-4 py-2 text-sm font-semibold transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="btn-primary rounded-md px-4 py-2 text-sm font-semibold transition"
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="btn-primary mt-5 w-full rounded-md px-4 py-2 text-sm font-semibold transition"
          >
            Entendido
          </button>
        )}
      </article>
    </div>
  );
}
