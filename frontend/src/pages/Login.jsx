import { useState } from 'react';

export function Login({ onLogin }) {
  const [idInstitucional, setIdInstitucional] = useState('EST001');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(idInstitucional, password);
    } catch (err) {
      setError(err?.response?.data?.error || 'No fue posible iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface grid gap-6 p-6 fade-in md:grid-cols-[1fr_0.95fr]">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <span className="chip">Acceso institucional</span>
          <h1 className="mt-3 text-3xl font-bold text-[color:var(--ink)]">Reserva tu cupo</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Acceso rápido y claro.</p>
        </div>

        <div className="grid gap-3">
          <div className="step">
            <span className="font-bold text-[color:var(--accent)]">1</span>
            <span>Inicia sesion</span>
          </div>
          <div className="step">
            <span className="font-bold text-[color:var(--accent)]">2</span>
            <span>Selecciona una franja</span>
          </div>
          <div className="step">
            <span className="font-bold text-[color:var(--accent)]">3</span>
            <span>Confirma y listo</span>
          </div>
        </div>
      </div>

      <div className="surface-soft p-5">
        <h2 className="text-xl font-bold text-[color:var(--ink)]">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Completa tus datos.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[color:var(--ink)]">
            ID institucional *
            <input
              className="input-field mt-2 w-full"
              value={idInstitucional}
              onChange={(e) => setIdInstitucional(e.target.value)}
              placeholder="Ej: EST001"
            />
          </label>

          <label className="block text-sm font-medium text-[color:var(--ink)]">
            Contrasena *
            <input
              type="password"
              className="input-field mt-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-dashed border-[color:var(--border)] bg-white/70 p-3 text-xs text-[color:var(--muted)]">
          <p>Usuario estudiante: EST001 / password123</p>
          <p>Usuario admin: ADM001 / password123</p>
        </div>
      </div>
    </section>
  );
}
