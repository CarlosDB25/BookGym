import { useMemo, useState } from 'react';
import { SaturacionBadge } from '../components/SaturacionBadge';
import { ActionModal } from '../components/ActionModal';
import { useCrearReserva, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';
import { useReglasReserva } from '../hooks/useReglasReserva';
import { getBogotaNowMillis, getBogotaTodayYMD, mondayFromYMD, slotMillisBogota } from '../utils/time';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export function Disponibilidad({ soloLectura = false, onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [], confirm: null });
  const [pendiente, setPendiente] = useState(null);

  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const { data: reglas, isLoading: isLoadingReglas, error: errorReglas } = useReglasReserva();
  const crearReserva = useCrearReserva();

  const limiteReservasActivas = reglas?.limiteReservasActivas;
  const anticipacionReservaMin = reglas?.anticipacionReservaMin;
  const anticipacionCancelacionMin = reglas?.anticipacionCancelacionMin;
  const maxReservasPorDia = reglas?.maxReservasPorDia;

  const idsReservados = new Set(reservas.map((r) => r.idFranja));
  const reservasPorFecha = useMemo(() => {
    const map = new Map();
    for (const r of reservas) {
      const ymd = String(r.franja?.fecha || '').split('T')[0];
      if (!ymd) continue;
      map.set(ymd, (map.get(ymd) || 0) + 1);
    }
    return map;
  }, [reservas]);
  const nowMillis = getBogotaNowMillis();

  const msAnticipacionReserva = (anticipacionReservaMin || 0) * 60 * 1000;

  const franjasVigentes = useMemo(() => {
    return franjas.filter((f) => {
      const inicio = slotMillisBogota(f.fecha, f.horaInicio);
      return nowMillis < inicio - msAnticipacionReserva;
    });
  }, [franjas, nowMillis, msAnticipacionReserva]);

  const horas = useMemo(() => {
    const hs = [...new Set(franjasVigentes.map((f) => f.horaInicio))];
    hs.sort((a, b) => a.localeCompare(b));
    return hs;
  }, [franjasVigentes]);

  const mapa = useMemo(() => {
    const m = new Map();
    for (const franja of franjasVigentes) {
      m.set(`${franja.diaSemana}|${franja.horaInicio}`, franja);
    }
    return m;
  }, [franjasVigentes]);

  function pedirConfirmacion(franja) {
    setPendiente(franja);
    setModal({
      open: true,
      type: 'info',
      title: 'Confirmar reserva',
      lines: [
        `Dia: ${franja.diaSemana}`,
        `Horario: ${franja.horaInicio} - ${franja.horaFin}`,
        `Cupos disponibles: ${franja.cuposDisponibles}`,
        'Condiciones:',
        `- Maximo ${maxReservasPorDia} reserva(s) activa(s) por dia.`,
        `- Reserva permitida hasta ${anticipacionReservaMin} minutos antes del inicio.`,
        `- Cancelacion permitida hasta ${anticipacionCancelacionMin} minutos antes del inicio.`,
      ],
      confirm: 'reservar',
    });
  }

  async function confirmarReserva() {
    if (!pendiente) return;

    try {
      await crearReserva.mutateAsync(pendiente.id);
      onNotice?.('success', 'Reserva registrada y cupo actualizado en tiempo real.');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva exitosa',
        lines: [
          `${pendiente.diaSemana} ${pendiente.horaInicio}-${pendiente.horaFin}`,
          `Estado: activa`,
          `Reservas activas: ${Math.min(reservas.length + 1, limiteReservasActivas)}/${limiteReservasActivas}`,
        ],
        confirm: null,
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'No fue posible crear la reserva';
      onNotice?.('error', msg);
      setModal({
        open: true,
        type: 'error',
        title: 'Reserva rechazada',
        lines: [msg, 'El servidor valido restricciones y no permitio la operacion.'],
        confirm: null,
      });
    } finally {
      setPendiente(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Cargando agenda semanal...</p>;
  }

  if (isLoadingReglas || !reglas) {
    return <p className="text-sm text-slate-600">Cargando reglas de reserva...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
  }

  if (errorReglas) {
    return <p className="text-sm text-rose-700">{errorReglas?.response?.data?.error || 'Error consultando reglas de reserva'}</p>;
  }

  return (
    <section className="fade-in space-y-4">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal((m) => ({ ...m, open: false, confirm: null }))}
        onConfirm={modal.confirm === 'reservar' ? confirmarReserva : undefined}
        confirmLabel="Confirmar"
        cancelLabel="Volver"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Agenda semanal</h2>
        {!soloLectura ? (
          <>
            <p className="text-sm text-slate-600">Formato horario por bloques (lunes a viernes). Semana base: {lunes}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                Reservas activas: {reservas.length}/{limiteReservasActivas}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Zona horaria: Colombia (UTC-5)</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Vista de monitoreo: solo cupos y nivel de saturacion.</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid min-w-[1100px] grid-cols-6 gap-2">
          <div className="rounded-lg bg-slate-100 p-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700">Hora</div>
          {DIAS.map((dia) => (
            <div key={dia} className="rounded-lg bg-slate-100 p-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700">
              {dia}
            </div>
          ))}

          {horas.length === 0 ? (
            <div className="col-span-6 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
              No hay franjas futuras para mostrar en esta semana.
            </div>
          ) : null}

          {horas.map((hora) => (
            <div key={`row-${hora}`} className="contents">
              <div key={`h-${hora}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-xs font-semibold text-slate-700">
                {hora}
              </div>
              {DIAS.map((dia) => {
                const f = mapa.get(`${dia}|${hora}`);
                if (!f) {
                  return (
                    <div key={`${dia}-${hora}`} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center text-[11px] text-slate-400">
                      -
                    </div>
                  );
                }

                const yaReservada = idsReservados.has(f.id);
                const sinCupo = f.cuposDisponibles <= 0;
                const limiteAlcanzado = reservas.length >= limiteReservasActivas;
                const fechaFranja = String(f.fecha || '').split('T')[0];
                const reservasEseDia = reservasPorFecha.get(fechaFranja) || 0;
                const limitePorDiaAlcanzado = reservasEseDia >= maxReservasPorDia;

                let bloque = 'bg-white border-slate-300 hover:border-slate-500';
                if (sinCupo) bloque = 'bg-slate-100 border-slate-300';
                if (yaReservada) bloque = 'bg-emerald-50 border-emerald-300';

                return (
                  <button
                    key={f.id}
                    onClick={() => (soloLectura ? null : pedirConfirmacion(f))}
                    disabled={soloLectura || crearReserva.isPending || sinCupo || yaReservada || limiteAlcanzado || limitePorDiaAlcanzado}
                    className={`rounded-lg border p-2 ${soloLectura ? 'text-center text-xs' : 'text-left text-[11px]'} transition ${bloque} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{f.cuposDisponibles}/{f.capacidadMaxima}</span>
                      <SaturacionBadge nivel={f.saturacion} />
                    </div>
                    {!soloLectura ? (
                      <p className="mt-1 text-slate-500">
                        {yaReservada
                          ? 'Ya reservada'
                          : sinCupo
                          ? 'Sin cupos'
                          : limiteAlcanzado
                          ? 'Limite alcanzado'
                            : limitePorDiaAlcanzado
                          ? 'Ya tienes reserva este dia'
                          : 'Tocar para reservar'}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
