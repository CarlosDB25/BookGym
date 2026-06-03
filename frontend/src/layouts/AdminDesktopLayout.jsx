import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { IconLayoutDashboard, IconScan, IconUsers, IconSettings, IconLogOut } from '../components/shared/Icons'
import { Logo } from '../components/shared/Logo'
import { formatClock } from '../utils/time'

const sidebarItems = [
  { path: '/admin', label: 'Dashboard', icon: IconLayoutDashboard },
  { path: '/admin/scanner', label: 'Scanner Hub', icon: IconScan },
  { path: '/admin/usuarios', label: 'Gestión de Comunidad', icon: IconUsers },
  { path: '/admin/config', label: 'Configuración', icon: IconSettings },
]

export function AdminDesktopLayout({ usuario, onLogout }) {
  const location = useLocation()
  const [clock, setClock] = useState(formatClock())

  useEffect(() => {
    const interval = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(interval)
  }, [])

  const breadcrumb = sidebarItems.find((s) => s.path === location.pathname)?.label || 'Panel'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 flex h-screen w-[260px] flex-col bg-slate-950 text-white">
        <div className="flex h-20 items-center gap-3 px-6">
          <Logo size={36} />
          <span className="text-xl tracking-tight">
            <span className="font-light text-white">Book</span>
            <span className="font-extrabold text-white">Gym</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <NavLink
                key={path}
                to={path}
                className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto h-5 w-1 rounded-full bg-indigo-400" />
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 text-xs text-slate-500">
            <p className="font-medium text-slate-400">{usuario?.nombre}</p>
            <p className="text-slate-600">Administrador</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          >
            <IconLogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="ml-[260px] flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-400">Admin</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-medium text-slate-600">
              {clock}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
