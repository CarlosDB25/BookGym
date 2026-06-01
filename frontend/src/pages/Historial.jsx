import { useMemo } from 'react';
import { useHistorialReservas } from '../hooks/useReservas';
import { formatDateBogota } from '../utils/time';
import { ReservaItem } from '../components/ReservaItem';

export function Historial() {
  const { data: historial = [], isLoading, error } = useHistorialReservas();

  const grupos = useMemo(() => {
    const map = new Map();
    for (const reserva of historial) {
      const ymd = String(reserva.franja?.fecha || '').split('T')[0];
      if (!ymd) continue;
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(reserva);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([ymd, items]) => ({ ymd, items }));
  }, [historial]);

  if (isLoading) {
    return <p className="text-sm text-[color:var(--muted)]">Cargando historial...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error consultando historial'}</p>;
  }

  return (
    <section className="fade-in space-y-5">
      <div className="panel p-5">
        <h2 className="text-2xl font-bold text-[color:var(--ink)]">Historial</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Reservas finalizadas o canceladas.</p>
      </div>

      {grupos.length === 0 ? (
        <div className="empty-state">Aun no tienes historial. Reserva un horario para comenzar.</div>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <div key={grupo.ymd} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="section-title">{formatDateBogota(grupo.ymd)}</h3>
                <span className="meta">{grupo.items.length} registros</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {grupo.items.map((reserva) => (
                  <ReservaItem key={reserva.id} reserva={reserva} cancelando={false} onCancelar={null} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
