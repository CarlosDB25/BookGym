import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { useHistorialReservas } from '../../hooks/useReservas'

export function Perfil({ usuario }) {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const { data: historial = [], isLoading } = useHistorialReservas()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['historial-reservas'] })
  }, [])

  const noShows = useMemo(
    () => historial.filter((r) => String(r.estado).toLowerCase() === 'no_show'),
    [historial]
  )

  const count = noShows.length
  const suspendido = count >= 3
  const enRiesgo = count === 2

  if (isLoading) {
    return (
      <div className="space-y-md pt-2">
        <div className="flex items-center justify-between">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-surface-container-high" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface-container-high" />
        </div>
        <div className="h-52 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-52 animate-pulse rounded-xl bg-surface-container-high" />
      </div>
    )
  }

  return (
    <div className="space-y-md pt-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline-md-mobile text-headline-md-mobile text-on-surface md:text-headline-md md:text-headline-md font-sans">
          Perfil
        </h1>
        <button className="text-primary hover:opacity-80 active:scale-95 p-2 transition-all duration-150">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {/* Risk Warning Banner */}
      {enRiesgo && !suspendido && (
        <div className="bg-surface-container-high border border-outline-variant/50 rounded-xl p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-[#d97706] mt-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div>
            <h3 className="font-headline-md-mobile text-headline-md-mobile text-[#b45309] font-sans">¡Cuidado!</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-sans">
              Una inasistencia más y serás suspendido.
            </p>
          </div>
        </div>
      )}

      {/* Suspended Banner */}
      {suspendido && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl p-md flex items-start gap-sm">
          <span className="material-symbols-outlined text-[#ba1a1a] mt-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            gavel
          </span>
          <div>
            <h3 className="font-headline-md-mobile text-headline-md-mobile text-[#93000a] font-sans">
              Cuenta suspendida
            </h3>
            <p className="font-body-sm text-body-sm text-[#93000a] font-sans">
              Has acumulado {count} inasistencias. Tu cuenta está bloqueada temporalmente.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        {/* User Card */}
        <div className="md:col-span-5 lg:col-span-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-3xl font-bold font-sans">
                {usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 bg-success-300 text-success-900 w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface-container-lowest">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs font-sans">
            {usuario?.nombre || 'Estudiante'}
          </h1>
          <p className="font-metadata-xs text-metadata-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant/50 font-sans">
            ID: {usuario?.id || '---'}
          </p>
        </div>

        {/* Contador de Fallas */}
        <div className="md:col-span-7 lg:col-span-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg flex flex-col">
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-outline">gavel</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-sans">Contador de Fallas</h2>
          </div>
          <div className="flex flex-col items-center justify-center space-y-lg py-sm flex-1">
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => {
                const esFalla = i < count
                return (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      esFalla
                        ? 'bg-[#ffdad6] border-[#ba1a1a] shadow-[0_0_15px_rgba(186,26,26,0.3)]'
                        : 'bg-surface-container-high border-outline-variant/50'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        esFalla ? 'text-[#ba1a1a]' : 'text-outline-variant'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {esFalla ? 'close' : 'circle'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className={`font-body-base text-body-base text-center max-w-sm font-sans ${
              suspendido ? 'text-[#ba1a1a] font-medium' : 'text-on-surface-variant'
            }`}>
              {count} inasistenci{count !== 1 ? 'as' : 'a'} detectada{count !== 1 ? 's' : ''}. Con 3 serás suspendido.
            </p>
          </div>
        </div>
      </div>

      {/* Logout & Footer */}
      <div className="flex flex-col items-center mt-xl space-y-lg">
        <button
          onClick={logout}
          className="bg-surface-container-lowest border border-outline-variant text-[#ba1a1a] font-body-base text-body-base font-medium py-3 px-8 rounded flex items-center gap-2 hover:bg-[#ffdad6]/20 active:scale-95 transition-all duration-150"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar Sesión
        </button>
        <p className="font-metadata-xs text-metadata-xs text-outline flex items-center gap-1 font-sans">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          Hora oficial del sistema: America/Bogota
        </p>
      </div>
    </div>
  )
}
