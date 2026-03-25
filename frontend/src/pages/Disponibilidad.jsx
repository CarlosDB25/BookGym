import { useMemo } from 'react';
import { SaturacionBadge } from '../components/SaturacionBadge';
import { useCrearReserva, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';
import { getBogotaNowMillis, getBogotaTodayYMD, mondayFromYMD, slotMillisBogota } from '../utils/time';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function crearMapaFranjas(franjas) {
  const mapa = new Map();

  for (const franja of franjas) {
    mapa.set(`${franja.diaSemana}|${franja.horaInicio}`, franja);
  }

  return mapa;
}

function horasOrdenadas(franjas) {
  const hs = [...new Set(franjas.map((f) => f.horaInicio))];
  hs.sort((a, b) => a.localeCompare(b));
  return hs;
}

export function Disponibilidad({ soloLectura = false, onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const crearReserva = useCrearReserva();

  const nowMillis = getBogotaNowMillis();
  const franjasVigentes = useMemo(
    () => franjas.filter((f) => slotMillisBogota(f.fecha, f.horaInicio) > nowMillis),
    [franjas, nowMillis]
  );

  const mapa = useMemo(() => crearMapaFranjas(franjasVigentes), [franjasVigentes]);
  const horas = useMemo(() => horasOrdenadas(franjasVigentes), [franjasVigentes]);
  const idsReservados = new Set(reservas.map((r) => r.idFranja));

  async function onReservar(idFranja) {
    try {
      await crearReserva.mutateAsync(idFranja);
      onNotice?.('success', 'Reserva creada exitosamente.');
    } catch (err) {
      onNotice?.('error', err?.response?.data?.error || 'No fue posible crear la reserva');
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-300">Cargando agenda semanal...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
  }

  return (
    <section className="fade-in space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Agenda semanal (Colombia)</h2>
        <p className="text-sm text-slate-300">
          Semana desde {lunes}. Sabado y domingo se muestran como no disponibles.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/70 p-3 card-rise">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-8 gap-2 text-xs uppercase tracking-wide text-slate-300">
            <div className="rounded-lg bg-slate-800 p-2 text-center font-semibold">Hora</div>
            {DIAS.map((dia) => (
              <div key={dia} className="rounded-lg bg-slate-800 p-2 text-center font-semibold">
                {dia}
              </div>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            {horas.map((hora) => (
              <div key={hora} className="grid grid-cols-8 gap-2">
                <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-center text-xs font-semibold text-cyan-200">
                  {hora}
                </div>

                {DIAS.map((dia) => {
                  const f = mapa.get(`${dia}|${hora}`);

                  if (dia === 'sabado' || dia === 'domingo') {
                    return (
                      <div key={`${dia}-${hora}`} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-center text-xs text-slate-500">
                        No disponible
                      </div>
                    );
                  }

                  if (!f) {
                    return (
                      <div key={`${dia}-${hora}`} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-center text-xs text-slate-500">
                        Sin franja
                      </div>
                    );
                  }

                  const yaReservada = idsReservados.has(f.id);
                  const sinCupo = f.cuposDisponibles <= 0;

                  return (
                    <div key={f.id} className="rounded-lg border border-slate-700 bg-slate-950/80 p-2 text-xs transition hover:border-cyan-500/60">
                      <div className="mb-1 flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-200">{f.horaInicio}-{f.horaFin}</span>
                        <SaturacionBadge nivel={f.saturacion} />
                      </div>

                      <p className="text-slate-300">Cupos: {f.cuposDisponibles}/{f.capacidadMaxima}</p>

                      {soloLectura ? (
                        <p className="mt-2 rounded-md bg-slate-800 px-2 py-1 text-center text-[11px] text-slate-300">Solo lectura</p>
                      ) : (
                        <button
                          onClick={() => onReservar(f.id)}
                          disabled={crearReserva.isPending || yaReservada || sinCupo}
                          className="mt-2 w-full rounded-md bg-cyan-500 px-2 py-1 text-[11px] font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {yaReservada ? 'Ya reservada' : sinCupo ? 'Sin cupos' : crearReserva.isPending ? 'Reservando...' : 'Reservar'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {horas.length === 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-center text-sm text-slate-300">
                No hay franjas futuras para mostrar en esta semana.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
