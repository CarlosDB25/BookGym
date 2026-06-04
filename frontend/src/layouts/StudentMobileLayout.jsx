import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '../components/shared/Logo'

const navItems = [
  { path: '/home', label: 'Recomendados', icon: 'auto_awesome' },
  { path: '/reservar', label: 'Reservar', icon: 'calendar_today' },
  { path: '/mis-reservas', label: 'Mis Cupos', icon: 'confirmation_number' },
  { path: '/perfil', label: 'Perfil', icon: 'person' },
]

export function StudentMobileLayout({ usuario, onLogout }) {
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface">
      <header className="sticky top-0 z-30 bg-white/90 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-slate-900">
              Book<span className="font-light">Gym</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">{usuario?.nombre}</span>
            <button
              onClick={onLogout}
              className="rounded-lg bg-danger-50 px-2.5 py-1 text-xs font-semibold text-danger-600 transition hover:bg-danger-100"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-20 pt-2">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="relative flex items-stretch">
          {navItems.map(({ path, label, icon }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                {isActive && (
                  <motion.div
                    className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span
                  className={`material-symbols-outlined text-2xl transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {icon}
                </span>
                <span
                  className={`text-[10px] transition-colors ${
                    isActive ? 'font-bold text-primary' : 'font-medium text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
