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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-suspensiones'] })
      queryClient.setQueryData(['admin-suspensiones'], (old) => {
        if (!old) return old
        return old.map((u) => {
          if (u.usuarioId === data.idUsuario) {
            return {
              ...u,
              activa: true,
              suspension: { id: data.id, fechaInicio: data.fechaInicio, fechaFin: data.fechaFin, motivo: data.motivo },
            }
          }
          return u
        })
      })
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

export function useAuditLog() {
  return useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data } = await api.get('/admin/configuracion/audit-log')
      return data
    },
    refetchInterval: 30000,
  })
}

export function usePlantillas() {
  return useQuery({
    queryKey: ['admin-plantillas'],
    queryFn: async () => {
      const { data } = await api.get('/admin/plantillas')
      return data
    },
  })
}

export function useSuspensionHistorial() {
  return useQuery({
    queryKey: ['admin-suspension-historial'],
    queryFn: async () => {
      const { data } = await api.get('/admin/configuracion/audit-log?entidad=suspension')
      return data
    },
    refetchInterval: 30000,
  })
}

export function useActualizarPlantilla() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/admin/plantillas/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plantillas'] })
      queryClient.invalidateQueries({ queryKey: ['franjas-semana'] })
    },
  })
}
