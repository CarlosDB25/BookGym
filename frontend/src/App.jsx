import { useState } from 'react';
import { Login } from './pages/Login';
import { Disponibilidad } from './pages/Disponibilidad';
import { MisReservas } from './pages/MisReservas';
import { useAuth } from './hooks/useAuth';

function App() {
  const { usuario, login, logout } = useAuth();
  const [tab, setTab] = useState('disponibilidad');

  if (!usuario) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-16">
        <Login onLogin={login} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Sistema de reservas</p>
            <h1 className="text-2xl font-extrabold text-slate-900">BookGym - Prototipo Funcional</h1>
            <p className="text-sm text-slate-600">
              Usuario: <strong>{usuario.id}</strong> ({usuario.rol})
            </p>
          </div>

          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={logout}
          >
            Cerrar sesion
          </button>
        </div>

        <nav className="mt-4 flex gap-2">
          <button
            onClick={() => setTab('disponibilidad')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'disponibilidad' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Disponibilidad
          </button>
          <button
            onClick={() => setTab('mis-reservas')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === 'mis-reservas' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Mis reservas
          </button>
        </nav>
      </header>

      {tab === 'disponibilidad' ? <Disponibilidad /> : <MisReservas />}
    </main>
  );
}

export default App;
