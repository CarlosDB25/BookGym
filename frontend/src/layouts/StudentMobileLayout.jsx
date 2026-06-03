import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IconSparkles, IconCalendar, IconTicket, IconUser } from '../components/shared/Icons'
import { Logo } from '../components/shared/Logo'

const tabs = [
  { path: '/home', label: 'Recomendados', icon: IconSparkles },
  { path: '/explorar', label: 'Explorar', icon: IconCalendar },
  { path: '/mis-cupos', label: 'Mis Cupos', icon: IconTicket },
  { path: '/perfil', label: 'Perfil', icon: IconUser },
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-slate-200 bg-white/90 px-2 backdrop-blur-lg">
        <div className="flex items-center justify-around py-1">
          {tabs.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2"
              >
                {isActive && (
                  <motion.div
                    className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
