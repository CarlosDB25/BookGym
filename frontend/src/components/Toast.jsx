import { useEffect } from 'react';

export function Toast({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => onClose(), 1500);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;

  const styles =
    notice.type === 'error'
      ? 'border-rose-300 bg-white text-rose-800'
      : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]';

  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-[14px] border px-4 py-3 shadow-2xl transition-all duration-300 toast-in ${styles}`}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium">{notice.message}</p>
        <button className="ml-auto text-xs font-semibold opacity-70 hover:opacity-100" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
