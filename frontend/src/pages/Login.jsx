import { useState } from 'react'
import { motion } from 'framer-motion'
import { Logo } from '../components/shared/Logo'
import { IconLogIn, IconUser, IconLock, IconAlertTriangle } from '../components/shared/Icons'

export function Login({ onLogin }) {
  const [idInstitucional, setIdInstitucional] = useState('EST001')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(idInstitucional, password)
    } catch (err) {
      setError(err?.response?.data?.error || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <motion.section
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={56} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Book<span className="font-light">Gym</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Reserva tu espacio en el gimnasio</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3">
            <IconLogIn className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary-800">Acceso institucional</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ID institucional
              </label>
              <div className="relative">
                <IconUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
                  value={idInstitucional}
                  onChange={(e) => setIdInstitucional(e.target.value)}
                  placeholder="Ej: EST001"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <IconLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p>Demo: <strong>EST001</strong> / password123</p>
            <p>Admin: <strong>ADM001</strong> / password123</p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
