import { useMemo, useState } from 'react';
import api from '../api/client';

export function useAuth() {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(idInstitucional, password) {
    const { data } = await api.post('/auth/login', { idInstitucional, password });

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify({ id: data.id, rol: data.rol }));

    setUsuario({ id: data.id, rol: data.rol });

    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  return useMemo(
    () => ({ usuario, login, logout }),
    [usuario]
  );
}
