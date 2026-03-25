import { ReservaItem } from '../components/ReservaItem';
import { ActionModal } from '../components/ActionModal';
import { useCancelarReserva, useHistorialReservas, useReservas } from '../hooks/useReservas';
import { useReglasReserva } from '../hooks/useReglasReserva';
import { useState } from 'react';
import { getBogotaNowMillis, slotMillisBogota } from '../utils/time';

export function MisReservas({ onNotice }) {
  const { data: reservas = [], isLoading, error } = useReservas();
  const { data: historial = [] } = useHistorialReservas();
  const { data: reglas, isLoading: isLoadingReglas, error: errorReglas } = useReglasReserva();
  const cancelar = useCancelarReserva();
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [], confirm: null });
  const [pendiente, setPendiente] = useState(null);

  const anticipacionCancelacionMin = reglas?.anticipacionCancelacionMin;

  function solicitarCancelacion(reserva) {
    setPendiente(reserva);
    setModal({
      open: true,
      type: 'info',
      title: 'Confirmar cancelacion',
      lines: [
        `${reserva.franja.plantilla.diaSemana} ${reserva.franja.plantilla.horaInicio}-${reserva.franja.plantilla.horaFin}`,
        `Recuerda: solo se permite cancelar hasta ${anticipacionCancelacionMin} minutos antes del inicio.`,
      ],
      confirm: 'cancelar',
    });
  }

  async function confirmarCancelacion() {
    if (!pendiente) return;
    try {
      const respuesta = await cancelar.mutateAsync(pendiente.id);
      onNotice?.('success', respuesta?.mensaje || 'Reserva cancelada exitosamente');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva cancelada',
        lines: [respuesta?.mensaje || 'Se libero el cupo exitosamente.'],
        confirm: null,
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'No fue posible cancelar la reserva';
      onNotice?.('error', msg);
      setModal({
        open: true,
        type: 'error',
        title: 'Cancelacion no permitida',
        lines: [msg],
        confirm: null,
      });
    } finally {
      setPendiente(null);
    }
  }

  const nowMillis = getBogotaNowMillis();

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando reservas...</p>;
  }

  if (isLoadingReglas || !reglas) {
    return <p className="text-sm text-slate-600">Cargando reglas de reserva...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error consultando reservas'}</p>;
  }

  if (errorReglas) {
    return <p className="text-sm text-rose-700">{errorReglas?.response?.data?.error || 'Error consultando reglas de reserva'}</p>;
  }

  return (
    <section className="fade-in">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal((m) => ({ ...m, open: false, confirm: null }))}
        onConfirm={modal.confirm === 'cancelar' ? confirmarCancelacion : undefined}
        confirmLabel="Si, cancelar"
        cancelLabel="No"
      />

      <h2 className="mb-4 text-2xl font-bold text-slate-900">Mis reservas activas</h2>

      {reservas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 card-rise">
          No tienes reservas activas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reservas.map((reserva) => {
            const inicio = slotMillisBogota(reserva.franja.fecha, reserva.franja.plantilla.horaInicio);
            const puedeCancelar = nowMillis < inicio - anticipacionCancelacionMin * 60 * 1000;

            return (
              <ReservaItem
                key={reserva.id}
                reserva={reserva}
                cancelando={cancelar.isPending}
                onCancelar={puedeCancelar ? () => solicitarCancelacion(reserva) : null}
                nota={
                  !puedeCancelar
                    ? `Cancelacion no disponible (menos de ${anticipacionCancelacionMin} min para iniciar)`
                    : null
                }
              />
            );
          })}
        </div>
      )}

      <h3 className="mt-8 mb-4 text-xl font-bold text-slate-900">Historial de reservas</h3>
      {historial.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 card-rise">
          No hay historial para mostrar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {historial.map((reserva) => (
            <ReservaItem key={reserva.id} reserva={reserva} cancelando={false} onCancelar={null} />
          ))}
        </div>
      )}
    </section>
  );
}
