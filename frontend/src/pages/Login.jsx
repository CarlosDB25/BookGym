import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Logo } from '../components/shared/Logo'
import { IconLogIn, IconUser, IconLock, IconAlertTriangle, IconCheck, IconSun, IconMoon } from '../components/shared/Icons'
import { useDarkMode } from '../hooks/useDarkMode'

const RAND_ID_NAME = `bk_${Math.random().toString(36).slice(2, 10)}`
const RAND_PW_NAME = `bp_${Math.random().toString(36).slice(2, 10)}`

export function Login({ onLogin }) {
  const [idInstitucional, setIdInstitucional] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [aceptoTerminos, setAceptoTerminos] = useState(
    () => localStorage.getItem('terminosAceptados') === 'true'
  )
  const { isDark, toggle: toggleDark } = useDarkMode()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!aceptoTerminos) return
    if (!idInstitucional.trim() || !password) {
      setError('Ingresa tu ID institucional y contraseña')
      return
    }
    setError('')
    setLoading(true)
    try {
      localStorage.setItem('terminosAceptados', 'true')
      await onLogin(idInstitucional, password)
    } catch (err) {
      setError(err?.response?.data?.error || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface p-4">
      <button
        type="button"
        onClick={toggleDark}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
      </button>

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

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="other">
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
                  type="text"
                  name={RAND_ID_NAME}
                  id={RAND_ID_NAME}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  inputMode="text"
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
                  name={RAND_PW_NAME}
                  id={RAND_PW_NAME}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  aceptoTerminos
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 bg-white'
                }`}
                onClick={() => setAceptoTerminos(!aceptoTerminos)}
              >
                {aceptoTerminos && <IconCheck className="h-3 w-3" />}
              </div>
              <span className="text-xs leading-relaxed text-slate-600">
                Acepto los{' '}
                <Link to="/terminos" className="font-medium text-primary underline hover:text-primary-700">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacidad" className="font-medium text-primary underline hover:text-primary-700">
                  Política de Privacidad
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !aceptoTerminos}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Problemas para entrar? Contacta al administrador del gimnasio.
        </p>
      </motion.section>
    </div>
  )
}
