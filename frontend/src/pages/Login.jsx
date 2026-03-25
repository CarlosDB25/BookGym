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
    <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm fade-in">
      <h1 className="text-2xl font-extrabold text-slate-900">BookGym</h1>
      <p className="mt-2 text-sm text-slate-600">Inicia sesion para reservar cupos del gimnasio universitario.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          ID institucional
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            value={idInstitucional}
            onChange={(e) => setIdInstitucional(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Contrasena
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
        <p>Usuario estudiante: EST001 / password123</p>
        <p>Usuario admin: ADM001 / password123</p>
      </div>
    </section>
  );
}
