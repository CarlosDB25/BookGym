import { useMemo, useState, useCallback } from 'react'
import api from '../config/axios'

export function useAuth() {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('usuario')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (idInstitucional, password) => {
    const { data } = await api.post('/auth/login', { idInstitucional, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify({ id: data.id, rol: data.rol, nombre: data.nombre || data.id }))
    setUsuario({ id: data.id, rol: data.rol, nombre: data.nombre || data.id })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }, [])

  return useMemo(() => ({ usuario, login, logout }), [usuario, login, logout])
}
