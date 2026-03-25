import { useState } from 'react';
import { Login } from './pages/Login';
import { Disponibilidad } from './pages/Disponibilidad';
import { MisReservas } from './pages/MisReservas';
import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toast } from './components/Toast';

function App() {
  const { usuario, login, logout } = useAuth();
  const [tab, setTab] = useState('principal');
  const [notice, setNotice] = useState(null);

  function showNotice(type, message) {
    setNotice({ type, message });
  }

  if (!usuario) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-16 text-slate-100">
        <Login onLogin={login} />
      </main>
    );
  }

  const esAdmin = usuario.rol === 'administrador';

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 text-slate-100">
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <header className="mb-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 shadow-2xl backdrop-blur fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Sistema de reservas</p>
            <h1 className="text-2xl font-extrabold text-white">BookGym - Prototipo Funcional</h1>
            <p className="text-sm text-slate-300">
              Usuario: <strong>{usuario.id}</strong> ({usuario.rol})
            </p>
          </div>

          <button
            className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
            onClick={logout}
          >
            Cerrar sesion
          </button>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTab('principal')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'principal' ? 'bg-blue-200 text-slate-900' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {esAdmin ? 'Panel admin' : 'Agenda semanal'}
          </button>
          {esAdmin ? (
            <button
              onClick={() => setTab('agenda')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === 'agenda' ? 'bg-blue-200 text-slate-900' : 'bg-slate-800 text-slate-200'
              }`}
            >
              Agenda (solo lectura)
            </button>
          ) : (
            <button
              onClick={() => setTab('mis-reservas')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === 'mis-reservas' ? 'bg-blue-200 text-slate-900' : 'bg-slate-800 text-slate-200'
              }`}
            >
              Mis reservas
            </button>
          )}
        </nav>
      </header>

      {esAdmin && tab === 'principal' ? <AdminDashboard /> : null}
      {esAdmin && tab === 'agenda' ? <Disponibilidad soloLectura onNotice={showNotice} /> : null}
      {!esAdmin && tab === 'principal' ? <Disponibilidad onNotice={showNotice} /> : null}
      {!esAdmin && tab === 'mis-reservas' ? <MisReservas onNotice={showNotice} /> : null}
    </main>
  );
}

export default App;
