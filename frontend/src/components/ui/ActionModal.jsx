import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars

export function ActionModal({
  open,
  type = 'info',
  title,
  lines = [],
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  children,
}) {
  const borderColor =
    type === 'error'
      ? 'border-danger-200'
      : type === 'success'
      ? 'border-success-200'
      : 'border-slate-200'

  const iconColor =
    type === 'error'
      ? 'text-danger-500'
      : type === 'success'
      ? 'text-success-500'
      : 'text-primary-600'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.article
            key="modal-content"
            className={`w-full max-w-md rounded-2xl border bg-white p-6 shadow-elevated ${borderColor}`}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-bold ${iconColor}`}>{title}</h3>

            {lines.length > 0 && (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {lines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            )}

            {children}

            {onConfirm ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  {confirmLabel}
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Entendido
              </button>
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
