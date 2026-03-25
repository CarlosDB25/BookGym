import { useMemo, useState } from 'react';
import { SaturacionBadge } from '../components/SaturacionBadge';
import { ActionModal } from '../components/ActionModal';
import { useCrearReserva, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';
import {
  currentWeekdayIndexBogota,
  getBogotaNowMillis,
  getBogotaTodayYMD,
  mondayFromYMD,
  slotMillisBogota,
  weekdayIndexFromDiaSemana,
} from '../utils/time';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const LIMITE_RESERVAS = 2;

export function Disponibilidad({ soloLectura = false, onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const diaInicial = Math.min(Math.max(currentWeekdayIndexBogota(), 0), 4);

  const [diaSeleccionado, setDiaSeleccionado] = useState(DIAS[diaInicial]);
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [] });

  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const crearReserva = useCrearReserva();

  const nowMillis = getBogotaNowMillis();

  const franjasVigentes = useMemo(
    () =>
      franjas
        .filter((f) => slotMillisBogota(f.fecha, f.horaInicio) > nowMillis)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [franjas, nowMillis]
  );

  const porDia = useMemo(() => {
    const map = {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
    };

    for (const f of franjasVigentes) {
      if (map[f.diaSemana]) map[f.diaSemana].push(f);
    }

    return map;
  }, [franjasVigentes]);

  const franjasDelDia = porDia[diaSeleccionado] || [];
  const idsReservados = new Set(reservas.map((r) => r.idFranja));

  async function onReservar(franja) {
    try {
      const reserva = await crearReserva.mutateAsync(franja.id);
      onNotice?.('success', 'Reserva creada exitosamente.');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva confirmada',
        lines: [
          `ID reserva: ${reserva.id}`,
          `Dia: ${franja.diaSemana}`,
          `Horario: ${franja.horaInicio} - ${franja.horaFin}`,
          `Cupos restantes: ${Math.max(franja.cuposDisponibles - 1, 0)}`,
        ],
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'No fue posible crear la reserva';
      onNotice?.('error', msg);
      setModal({
        open: true,
        type: 'error',
        title: 'No se pudo reservar',
        lines: [msg, 'Reglas activas: suspension, limite de reservas activas y cupos disponibles.'],
      });
    }
  }

  const cuposTotalesSemana = franjasVigentes.reduce((acc, f) => acc + f.capacidadMaxima, 0);
  const cuposDispSemana = franjasVigentes.reduce((acc, f) => acc + f.cuposDisponibles, 0);

  if (isLoading) {
    return <p className="text-sm text-slate-300">Cargando agenda semanal...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
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

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise xl:col-span-2">
          <h2 className="text-2xl font-bold text-white">Agenda semanal (Colombia)</h2>
          <p className="text-sm text-slate-300">Visualiza por dia para evitar scroll excesivo. Semana: {lunes}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {DIAS.map((dia) => (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(dia)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${
                  diaSeleccionado === dia ? 'bg-blue-300 text-slate-900' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {dia}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {franjasDelDia.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                No hay franjas futuras para este dia.
              </p>
            ) : (
              franjasDelDia.map((f) => {
                const yaReservada = idsReservados.has(f.id);
                const sinCupo = f.cuposDisponibles <= 0;
                const bloqueadaPorLimite = reservas.length >= LIMITE_RESERVAS;

                return (
                  <article key={f.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3 transition hover:border-blue-300/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-100">
                        {f.horaInicio} - {f.horaFin}
                      </p>
                      <SaturacionBadge nivel={f.saturacion} />
                    </div>

                    <p className="mt-1 text-xs text-slate-300">Cupos: {f.cuposDisponibles}/{f.capacidadMaxima}</p>

                    {soloLectura ? (
                      <p className="mt-2 rounded-md bg-slate-800 px-2 py-1 text-center text-xs text-slate-300">Modo administrador: solo lectura</p>
                    ) : (
                      <button
                        onClick={() => onReservar(f)}
                        disabled={crearReserva.isPending || yaReservada || sinCupo || bloqueadaPorLimite}
                        className="mt-2 w-full rounded-md bg-blue-300 px-2 py-1 text-xs font-semibold text-slate-900 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        {yaReservada
                          ? 'Ya reservada'
                          : sinCupo
                          ? 'Sin cupos'
                          : bloqueadaPorLimite
                          ? 'Limite de reservas alcanzado'
                          : crearReserva.isPending
                          ? 'Reservando...'
                          : 'Reservar'}
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 card-rise">
          <h3 className="text-lg font-bold text-white">Reglas de negocio visibles</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Maximo reservas activas por usuario: {LIMITE_RESERVAS}</li>
            <li>Reservas activas actuales: {reservas.length}</li>
            <li>Cupos semanales disponibles: {cuposDispSemana}</li>
            <li>Cupos semanales totales: {cuposTotalesSemana}</li>
            <li>Suspension activa bloquea creacion de reserva.</li>
            <li>No se permite cancelar un turno ya iniciado.</li>
          </ul>

          <div className="mt-4 rounded-xl bg-slate-950 p-3 text-xs text-slate-400">
            <p>Nota: Sabado y domingo no tienen franjas operativas en este prototipo.</p>
            <p>
              Dia actual (CO): {DIAS[Math.min(Math.max(currentWeekdayIndexBogota(), 0), 4)]}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
