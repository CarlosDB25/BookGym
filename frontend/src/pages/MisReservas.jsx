import { ReservaItem } from '../components/ReservaItem';
import { ActionModal } from '../components/ActionModal';
import { useCancelarReserva, useReservas } from '../hooks/useReservas';
import { useState } from 'react';

export function MisReservas({ onNotice }) {
  const { data: reservas = [], isLoading, error } = useReservas();
  const cancelar = useCancelarReserva();
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [] });

  async function onCancelar(idReserva) {
    try {
      const respuesta = await cancelar.mutateAsync(idReserva);
      onNotice?.('success', respuesta?.mensaje || 'Reserva cancelada exitosamente');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva cancelada',
        lines: [respuesta?.mensaje || 'Se libero el cupo exitosamente.'],
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'No fue posible cancelar la reserva';
      onNotice?.('error', msg);
      setModal({
        open: true,
        type: 'error',
        title: 'Cancelacion no permitida',
        lines: [msg],
      });
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
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />

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
