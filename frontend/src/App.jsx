import { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { Disponibilidad } from './pages/Disponibilidad';
import { MisReservas } from './pages/MisReservas';
import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toast } from './components/Toast';
import { Historial } from './pages/Historial';

function App() {
  const { usuario, login, logout } = useAuth();
  const [tab, setTab] = useState('agenda');
  const [notice, setNotice] = useState(null);

  function showNotice(type, message) {
    setNotice({ type, message });
  }

  function handleLogout() {
    setNotice(null);
    logout();
  }

  if (!usuario) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-16 text-[color:var(--ink)]">
        <Login onLogin={login} />
      </main>
    );
  }

  const esAdmin = usuario.rol === 'administrador';

  useEffect(() => {
    setTab(esAdmin ? 'panel' : 'agenda');
  }, [esAdmin]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10 text-[color:var(--ink)]">
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <header className="surface mb-6 px-6 py-5 fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="chip">BookGym</span>
            <h1 className="mt-2 text-2xl font-bold text-[color:var(--ink)]">Reservas institucionales</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {usuario.id} · {usuario.rol}
            </p>
          </div>

          <button className="btn-outline rounded-md px-4 py-2 text-sm font-semibold transition" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>

        <nav className="mt-5 flex flex-wrap gap-2">
          {esAdmin ? (
            <>
              <button onClick={() => setTab('panel')} className={`tab ${tab === 'panel' ? 'tab-active' : ''}`}>
                Panel
              </button>
              <button onClick={() => setTab('agenda')} className={`tab ${tab === 'agenda' ? 'tab-active' : ''}`}>
                Agenda
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setTab('agenda')} className={`tab ${tab === 'agenda' ? 'tab-active' : ''}`}>
                Agenda
              </button>
              <button onClick={() => setTab('mis-reservas')} className={`tab ${tab === 'mis-reservas' ? 'tab-active' : ''}`}>
                Mis reservas
              </button>
              <button onClick={() => setTab('historial')} className={`tab ${tab === 'historial' ? 'tab-active' : ''}`}>
                Historial
              </button>
            </>
          )}
        </nav>
      </header>

      {esAdmin && tab === 'panel' ? <AdminDashboard /> : null}
      {esAdmin && tab === 'agenda' ? <Disponibilidad soloLectura onNotice={showNotice} /> : null}
      {!esAdmin && tab === 'agenda' ? <Disponibilidad onNotice={showNotice} /> : null}
      {!esAdmin && tab === 'mis-reservas' ? <MisReservas onNotice={showNotice} /> : null}
      {!esAdmin && tab === 'historial' ? <Historial /> : null}
    </main>
  );
}

export default App;
