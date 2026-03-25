import { useMemo, useState } from 'react';
import { SaturacionBadge } from '../components/SaturacionBadge';
import { ActionModal } from '../components/ActionModal';
import { useCrearReserva, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';
import { getBogotaNowMillis, getBogotaTodayYMD, mondayFromYMD, slotMillisBogota } from '../utils/time';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const LIMITE_RESERVAS = 2;

function agruparPorDia(franjas) {
  const out = { lunes: [], martes: [], miercoles: [], jueves: [], viernes: [] };

  for (const franja of franjas) {
    if (out[franja.diaSemana]) out[franja.diaSemana].push(franja);
  }

  for (const dia of DIAS) {
    out[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  return out;
}

export function Disponibilidad({ soloLectura = false, onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [] });

  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const crearReserva = useCrearReserva();

  const idsReservados = new Set(reservas.map((r) => r.idFranja));
  const nowMillis = getBogotaNowMillis();

  const franjasVigentes = useMemo(
    () => franjas.filter((f) => slotMillisBogota(f.fecha, f.horaInicio) > nowMillis),
    [franjas, nowMillis]
  );

  const dias = useMemo(() => agruparPorDia(franjasVigentes), [franjasVigentes]);

  async function onReservar(franja) {
    try {
      const reserva = await crearReserva.mutateAsync(franja.id);
      onNotice?.('success', 'Reserva registrada y cupo actualizado en tiempo real.');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva exitosa',
        lines: [
          `Reserva: ${reserva.id}`,
          `${franja.diaSemana} ${franja.horaInicio}-${franja.horaFin}`,
          `Estado: activa`,
          `Reservas activas: ${Math.min(reservas.length + 1, LIMITE_RESERVAS)}/${LIMITE_RESERVAS}`,
        ],
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'No fue posible crear la reserva';
      onNotice?.('error', msg);
      setModal({
        open: true,
        type: 'error',
        title: 'Reserva rechazada',
        lines: [msg, 'El servidor valido restricciones y no permitio la operacion.'],
      });
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando agenda semanal...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
  }

  return (
    <section className="fade-in space-y-4">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Agenda semanal</h2>
        <p className="text-sm text-slate-600">Formato horario por bloques (lunes a viernes). Semana base: {lunes}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Reservas activas: {reservas.length}/{LIMITE_RESERVAS}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Zona horaria: Colombia (UTC-5)</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Cupos sincronizados por servidor</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid min-w-[1050px] grid-cols-5 gap-3">
          {DIAS.map((dia) => (
            <section key={dia} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-slate-700">{dia}</h3>

              <div className="max-h-[64vh] space-y-2 overflow-auto pr-1">
                {(dias[dia] || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                    Sin franjas futuras
                  </div>
                ) : (
                  (dias[dia] || []).map((f) => {
                    const yaReservada = idsReservados.has(f.id);
                    const sinCupo = f.cuposDisponibles <= 0;
                    const limiteAlcanzado = reservas.length >= LIMITE_RESERVAS;

                    return (
                      <article key={f.id} className="rounded-lg border border-slate-200 bg-white p-2 transition hover:border-slate-400">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-800">{f.horaInicio} - {f.horaFin}</p>
                          <SaturacionBadge nivel={f.saturacion} />
                        </div>

                        <p className="mt-1 text-[11px] text-slate-600">Cupos: {f.cuposDisponibles}/{f.capacidadMaxima}</p>

                        {soloLectura ? (
                          <p className="mt-2 rounded bg-slate-100 px-2 py-1 text-center text-[11px] text-slate-600">Solo lectura</p>
                        ) : (
                          <button
                            onClick={() => onReservar(f)}
                            disabled={crearReserva.isPending || yaReservada || sinCupo || limiteAlcanzado}
                            className="mt-2 w-full rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                          >
                            {yaReservada
                              ? 'Ya reservada'
                              : sinCupo
                              ? 'Sin cupos'
                              : limiteAlcanzado
                              ? 'Limite alcanzado'
                              : crearReserva.isPending
                              ? 'Procesando...'
                              : 'Reservar'}
                          </button>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
