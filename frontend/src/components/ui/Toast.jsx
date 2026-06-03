import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconAlertTriangle, IconCheck, IconInfo } from '../shared/Icons'

const styles = {
  success: {
    bg: 'bg-success-50 border-success-200 text-success-800',
    icon: IconCheck,
  },
  error: {
    bg: 'bg-danger-50 border-danger-200 text-danger-800',
    icon: IconAlertTriangle,
  },
  warning: {
    bg: 'bg-warning-50 border-warning-200 text-warning-800',
    icon: IconInfo,
  },
  info: {
    bg: 'bg-primary-50 border-primary-200 text-primary-800',
    icon: IconInfo,
  },
}

export function Toast({ notice, onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!notice) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose?.(), 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [notice, duration, onClose])

  if (!notice) return null

  const s = styles[notice.type] || styles.info
  const Icon = s.icon

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-elevated ${s.bg}`}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{notice.message}</p>
          <button
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
            onClick={() => {
              setVisible(false)
              setTimeout(() => onClose?.(), 200)
            }}
          >
            <IconX className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
