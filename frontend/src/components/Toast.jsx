export function Toast({ notice, onClose }) {
  if (!notice) return null;

  const styles =
    notice.type === 'error'
      ? 'border-rose-500/40 bg-rose-900/80 text-rose-100'
      : 'border-emerald-500/40 bg-emerald-900/80 text-emerald-100';

  return (
    <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-xl transition-all duration-300 toast-in ${styles}`}>
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{notice.message}</p>
        <button className="ml-auto text-xs opacity-80 hover:opacity-100" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
