export function ActionModal({ open, type = 'info', title, lines = [], onClose }) {
  if (!open) return null;

  const tone =
    type === 'error'
      ? 'border-rose-400/40 bg-rose-950/90 text-rose-100'
      : 'border-blue-300/40 bg-slate-900/95 text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <article className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl card-rise ${tone}`}>
        <h3 className="text-lg font-bold">{title}</h3>

        <div className="mt-3 space-y-2 text-sm">
          {lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          Entendido
        </button>
      </article>
    </div>
  );
}
