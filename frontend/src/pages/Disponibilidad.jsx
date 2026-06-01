import { useMemo, useState } from 'react';
import { SaturacionBadge } from '../components/SaturacionBadge';
import { ActionModal } from '../components/ActionModal';
import { useCrearReserva, useHistorialReservas, useReservas } from '../hooks/useReservas';
import { useFranjas } from '../hooks/useFranjas';
import { useReglasReserva } from '../hooks/useReglasReserva';
import { formatDateBogota, getBogotaNowMillis, getBogotaTodayYMD, mondayFromYMD, slotMillisBogota } from '../utils/time';

export function Disponibilidad({ soloLectura = false, onNotice }) {
  const lunes = useMemo(() => mondayFromYMD(getBogotaTodayYMD()), []);
  const hoyYmd = getBogotaTodayYMD();
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', lines: [], confirm: null });
  const [pendiente, setPendiente] = useState(null);
  const [vista, setVista] = useState(soloLectura ? 'semana' : 'hoy');

  const { data: franjas = [], isLoading, error } = useFranjas(lunes, true);
  const { data: reservas = [] } = useReservas();
  const { data: historial = [] } = useHistorialReservas();
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

  const franjasFiltradas = useMemo(() => {
    if (vista === 'hoy') {
      return franjasVigentes.filter((f) => String(f.fecha || '').startsWith(hoyYmd));
    }
    return franjasVigentes;
  }, [franjasVigentes, vista, hoyYmd]);

  const franjasPorDia = useMemo(() => {
    const map = new Map();
    for (const franja of franjasFiltradas) {
      const ymd = String(franja.fecha || '').split('T')[0];
      if (!ymd) continue;
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(franja);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ymd, items]) => ({
        ymd,
        items: items.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      }));
  }, [franjasFiltradas]);

  const proximaReserva = useMemo(() => {
    const candidatas = reservas
      .map((reserva) => {
        const franja = reserva.franja;
        if (!franja) return null;
        const horaInicio = franja.plantilla?.horaInicio || franja.horaInicio;
        const horaFin = franja.plantilla?.horaFin || franja.horaFin;
        if (!horaInicio || !franja.fecha) return null;
        const inicio = slotMillisBogota(franja.fecha, horaInicio);
        return {
          id: reserva.id,
          inicio,
          horaInicio,
          horaFin,
          fecha: franja.fecha,
        };
      })
      .filter(Boolean)
      .filter((r) => r.inicio > nowMillis)
      .sort((a, b) => a.inicio - b.inicio);

    return candidatas[0] || null;
  }, [reservas, nowMillis]);

  const completadas = useMemo(() => {
    return historial.filter((reserva) => String(reserva.estado || '').toLowerCase() !== 'cancelada');
  }, [historial]);

  const diasAsistencia = useMemo(() => {
    const set = new Set();
    for (const reserva of completadas) {
      const ymd = String(reserva.franja?.fecha || '').split('T')[0];
      if (ymd) set.add(ymd);
    }
    return [...set].sort();
  }, [completadas]);

  const rachaActual = useMemo(() => {
    if (diasAsistencia.length === 0) return 0;
    let streak = 1;
    for (let i = diasAsistencia.length - 1; i > 0; i -= 1) {
      const [y1, m1, d1] = diasAsistencia[i].split('-').map(Number);
      const [y2, m2, d2] = diasAsistencia[i - 1].split('-').map(Number);
      const diff = (Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000;
      if (diff === 1) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [diasAsistencia]);

  const asistenciasMes = useMemo(() => {
    const prefijo = hoyYmd.slice(0, 7);
    return completadas.filter((reserva) => String(reserva.franja?.fecha || '').startsWith(prefijo)).length;
  }, [completadas, hoyYmd]);

  const horaPico = useMemo(() => {
    if (franjasFiltradas.length === 0) return null;
    const map = new Map();
    for (const franja of franjasFiltradas) {
      const score = franja.saturacion === 'alta' ? 3 : franja.saturacion === 'media' ? 2 : 1;
      map.set(franja.horaInicio, (map.get(franja.horaInicio) || 0) + score);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [franjasFiltradas]);

  const recomendadas = useMemo(() => {
    return franjasFiltradas
      .filter((f) => f.saturacion === 'baja' && f.cuposDisponibles > 0)
      .sort((a, b) => b.cuposDisponibles - a.cuposDisponibles || a.horaInicio.localeCompare(b.horaInicio))
      .slice(0, 3);
  }, [franjasFiltradas]);

  function pedirConfirmacion(franja) {
    setPendiente(franja);
    setModal({
      open: true,
      type: 'info',
      title: 'Confirmar reserva',
      lines: [
        `${franja.diaSemana} · ${franja.horaInicio} - ${franja.horaFin}`,
        `Cupos disponibles: ${franja.cuposDisponibles}/${franja.capacidadMaxima}`,
        `Maximo por dia: ${maxReservasPorDia} · Reserva hasta ${anticipacionReservaMin} min antes.`,
        `Cancelacion hasta ${anticipacionCancelacionMin} min antes.`,
      ],
      confirm: 'reservar',
    });
  }

  async function confirmarReserva() {
    if (!pendiente) return;

    try {
      await crearReserva.mutateAsync(pendiente.id);
      onNotice?.('success', 'Reserva confirmada.');
      setModal({
        open: true,
        type: 'success',
        title: 'Reserva confirmada',
        lines: [
          `${pendiente.diaSemana} · ${pendiente.horaInicio}-${pendiente.horaFin}`,
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
        lines: [msg],
        confirm: null,
      });
    } finally {
      setPendiente(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[color:var(--muted)]">Cargando agenda...</p>;
  }

  if (isLoadingReglas || !reglas) {
    return <p className="text-sm text-[color:var(--muted)]">Cargando reglas de reserva...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error?.response?.data?.error || 'Error consultando disponibilidad'}</p>;
  }

  if (errorReglas) {
    return <p className="text-sm text-rose-700">{errorReglas?.response?.data?.error || 'Error consultando reglas de reserva'}</p>;
  }

  return (
    <section className="fade-in space-y-5">
      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        lines={modal.lines}
        onClose={() => setModal((m) => ({ ...m, open: false, confirm: null }))}
        onConfirm={modal.confirm === 'reservar' ? confirmarReserva : undefined}
        confirmLabel="Reservar"
        cancelLabel="Volver"
      />

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--ink)]">Agenda</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Selecciona una franja y confirma.</p>
          </div>
          {!soloLectura ? (
            <div className="flex gap-2">
              <button onClick={() => setVista('hoy')} className={`tab ${vista === 'hoy' ? 'tab-active' : ''}`}>
                Hoy
              </button>
              <button onClick={() => setVista('semana')} className={`tab ${vista === 'semana' ? 'tab-active' : ''}`}>
                Semana
              </button>
            </div>
          ) : (
            <span className="meta">Solo lectura</span>
          )}
        </div>

        {!soloLectura ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="stat-card p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Proxima reserva</p>
              {proximaReserva ? (
                <div className="mt-2 text-sm text-[color:var(--ink)]">
                  <p className="text-lg font-bold">{proximaReserva.horaInicio}</p>
                  <p className="text-xs text-[color:var(--muted)]">{formatDateBogota(proximaReserva.fecha)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[color:var(--muted)]">Sin reservas activas.</p>
              )}
            </div>
            <div className="stat-card p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Racha</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--ink)]">{rachaActual} dias</p>
              <p className="text-xs text-[color:var(--muted)]">{asistenciasMes} asistencias este mes</p>
            </div>
            <div className="stat-card p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Hora pico</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--ink)]">{horaPico || 'Sin datos'}</p>
              <p className="text-xs text-[color:var(--muted)]">Evita esta franja para mas cupo.</p>
            </div>
          </div>
        ) : null}
      </div>

      {!soloLectura ? (
        <div className="panel p-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="tag-success rounded-full px-3 py-1 font-semibold">Baja</span>
            <span className="tag-warning rounded-full px-3 py-1 font-semibold">Media</span>
            <span className="tag-danger rounded-full px-3 py-1 font-semibold">Alta</span>
          </div>
        </div>
      ) : null}

      {franjasPorDia.length === 0 ? (
        <div className="empty-state">
          {vista === 'hoy'
            ? 'No hay franjas disponibles hoy. Prueba la vista Semana.'
            : 'No hay franjas futuras disponibles.'}
        </div>
      ) : (
        <div className="space-y-6">
          {franjasPorDia.map((grupo) => (
            <div key={grupo.ymd} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="section-title">{formatDateBogota(grupo.ymd)}</h3>
                <span className="meta">{grupo.items.length} franjas</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grupo.items.map((franja) => {
                  const yaReservada = idsReservados.has(franja.id);
                  const sinCupo = franja.cuposDisponibles <= 0;
                  const limiteAlcanzado = reservas.length >= limiteReservasActivas;
                  const fechaFranja = String(franja.fecha || '').split('T')[0];
                  const reservasEseDia = reservasPorFecha.get(fechaFranja) || 0;
                  const limitePorDiaAlcanzado = reservasEseDia >= maxReservasPorDia;
                  const deshabilitado = sinCupo || yaReservada || limiteAlcanzado || limitePorDiaAlcanzado;

                  let estado = 'Disponible';
                  if (yaReservada) estado = 'Reservada';
                  else if (sinCupo) estado = 'Lleno';
                  else if (limiteAlcanzado) estado = 'Limite activo';
                  else if (limitePorDiaAlcanzado) estado = 'Reserva diaria';

                  return (
                    <article key={franja.id} className="franja-card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Horario</p>
                          <p className="text-2xl font-bold text-[color:var(--ink)]">{franja.horaInicio}</p>
                          <p className="text-xs text-[color:var(--muted)]">Hasta {franja.horaFin}</p>
                        </div>
                        <SaturacionBadge nivel={franja.saturacion} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                        <span>
                          Cupos: <strong className="text-[color:var(--ink)]">{franja.cuposDisponibles}</strong>/{franja.capacidadMaxima}
                        </span>
                        <span>{estado}</span>
                      </div>
                      {!soloLectura ? (
                        <button
                          className={`btn-primary rounded-md px-3 py-2 text-sm font-semibold transition ${
                            deshabilitado ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          onClick={() => pedirConfirmacion(franja)}
                          disabled={deshabilitado || crearReserva.isPending}
                        >
                          {crearReserva.isPending ? 'Reservando...' : yaReservada ? 'Reservada' : sinCupo ? 'Lleno' : 'Reservar'}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!soloLectura ? (
        <div className="panel p-5">
          <h3 className="section-title">Sugerencias</h3>
          {recomendadas.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">Sin recomendaciones por ahora.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {recomendadas.map((franja) => (
                <div key={franja.id} className="surface-soft px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Recomendada</p>
                  <p className="mt-1 text-lg font-bold text-[color:var(--ink)]">{franja.horaInicio}</p>
                  <p className="text-xs text-[color:var(--muted)]">{formatDateBogota(franja.fecha)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
