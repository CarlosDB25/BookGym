import { ReservaItem } from '../components/ReservaItem';
import { useCancelarReserva, useReservas } from '../hooks/useReservas';

export function MisReservas({ onNotice }) {
  const { data: reservas = [], isLoading, error } = useReservas();
  const cancelar = useCancelarReserva();

  async function onCancelar(idReserva) {
    try {
      const respuesta = await cancelar.mutateAsync(idReserva);
      onNotice?.('success', respuesta?.mensaje || 'Reserva cancelada exitosamente');
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'No fue posible cancelar la reserva');
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-300">Cargando reservas...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error?.response?.data?.error || 'Error consultando reservas'}</p>;
  }

  return (
    <section className="fade-in">
      <h2 className="mb-4 text-2xl font-bold text-white">Mis reservas activas</h2>

      {reservas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300 card-rise">
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
