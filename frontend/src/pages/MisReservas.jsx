import { ReservaItem } from '../components/ReservaItem';
import { useCancelarReserva, useReservas } from '../hooks/useReservas';

export function MisReservas() {
  const { data: reservas = [], isLoading, error } = useReservas();
  const cancelar = useCancelarReserva();

  async function onCancelar(idReserva) {
    await cancelar.mutateAsync(idReserva);
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando reservas...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error?.response?.data?.error || 'Error consultando reservas'}</p>;
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Mis reservas activas</h2>

      {reservas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No tienes reservas activas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reservas.map((reserva) => (
            <ReservaItem
              key={reserva.id}
              reserva={reserva}
              cancelando={cancelar.isPending}
              onCancelar={onCancelar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
