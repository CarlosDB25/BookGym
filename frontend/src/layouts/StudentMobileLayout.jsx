import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '../components/shared/Logo'
import { useDarkMode } from '../hooks/useDarkMode'
import { IconSun, IconMoon } from '../components/shared/Icons'

const navItems = [
  { path: '/home', label: 'Inicio', icon: 'auto_awesome' },
  { path: '/reservar', label: 'Reservar', icon: 'calendar_today' },
  { path: '/mis-reservas', label: 'Cupos', icon: 'confirmation_number' },
  { path: '/perfil', label: 'Perfil', icon: 'person' },
]

function MobileBottomNav({ location }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-2 pb-2 pt-1 backdrop-blur-lg shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:border-slate-800 md:hidden">
      <ul className="grid grid-cols-4">
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path
          return (
            <li key={path}>
              <Link
                to={path}
                className="relative flex h-14 flex-col items-center justify-center"
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2 inset-y-1 rounded-2xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 material-symbols-outlined text-2xl transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {icon}
                </span>
                <span
                  className={`relative z-10 mt-0.5 text-[10px] leading-none transition-colors ${
                    isActive ? 'font-bold text-primary' : 'font-medium text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function DesktopSidebar({ location, usuario, onLogout }) {
  const { isDark, toggle } = useDarkMode()
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white md:overflow-y-auto dark:md:border-slate-800">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <Logo size={32} />
        <span className="text-xl font-bold text-slate-900">
          Book<span className="font-light">Gym</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}
                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
              >
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{usuario?.nombre}</p>
            <p className="truncate text-xs text-slate-500">ID: {usuario?.id}</p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger-200 bg-white px-4 py-2 text-sm font-semibold text-danger-600 transition hover:bg-danger-50 dark:border-danger-200/50 dark:bg-transparent"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export function StudentMobileLayout({ usuario, onLogout }) {
  const location = useLocation()
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:flex md:items-start">
      <DesktopSidebar location={location} usuario={usuario} onLogout={onLogout} />

      <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950 md:min-h-0 md:flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/85 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Book<span className="font-light">Gym</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggle}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
              </button>
              <button
                onClick={onLogout}
                className="rounded-lg bg-danger-50 px-2.5 py-1 text-xs font-semibold text-danger-600 transition hover:bg-danger-100 dark:bg-danger-900/30"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-2 md:px-8 md:py-8 md:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full md:max-w-4xl"
          >
            <Outlet />
          </motion.div>
        </main>

        <MobileBottomNav location={location} />
      </div>
    </div>
  )
}
