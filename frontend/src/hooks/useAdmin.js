import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export function useAdminSuspensiones() {
  return useQuery({
    queryKey: ['admin-suspensiones'],
    queryFn: async () => {
      const { data } = await api.get('/admin/suspensiones/usuarios')
      return data
    },
    refetchInterval: 15000,
  })
}

export function useCrearSuspension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/admin/suspensiones', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suspensiones'] })
    },
  })
}

export function useLevantarSuspension() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, justificacion }) => {
      const { data } = await api.delete(`/admin/suspensiones/${id}`, {
        data: { justificacion },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suspensiones'] })
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] })
    },
  })
}

export function useActualizarReglas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reglas) => {
      const { data } = await api.put('/admin/configuracion/reglas-reserva', reglas)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
}
