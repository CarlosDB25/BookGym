import { useMemo } from 'react';
import { FranjaCard } from '../components/FranjaCard';
import { useCrearReserva, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';

function obtenerLunesActual() {
  const hoy = new Date();
  const dia = hoy.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + ajuste);

  return lunes.toISOString().slice(0, 10);
}

export function Disponibilidad() {
  const lunes = useMemo(() => obtenerLunesActual(), []);

  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const crearReserva = useCrearReserva();

  async function onReservar(idFranja) {
    await crearReserva.mutateAsync(idFranja);
  }

  const idsReservados = new Set(reservas.map((r) => r.idFranja));

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando disponibilidad...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Disponibilidad semanal</h2>
          <p className="text-sm text-slate-600">Semana iniciando: {lunes}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {franjas.map((franja) => (
          <div key={franja.id} className={idsReservados.has(franja.id) ? 'opacity-60' : ''}>
            <FranjaCard
              franja={franja}
              reservando={crearReserva.isPending}
              onReservar={onReservar}
            />
            {idsReservados.has(franja.id) ? (
              <p className="mt-1 text-center text-xs text-slate-500">Ya tienes una reserva en esta franja</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
