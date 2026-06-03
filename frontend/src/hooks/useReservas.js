import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export function useReservas() {
  return useQuery({
    queryKey: ['mis-reservas'],
    queryFn: async () => {
      const { data } = await api.get('/reservas')
      return data
    },
    refetchInterval: 10000,
  })
}

export function useHistorialReservas() {
  return useQuery({
    queryKey: ['historial-reservas'],
    queryFn: async () => {
      const { data } = await api.get('/reservas/historial')
      return data
    },
    refetchInterval: 15000,
  })
}

export function useRecomendaciones(limite = 5) {
  return useQuery({
    queryKey: ['recomendaciones', limite],
    queryFn: async () => {
      const { data } = await api.get(`/metricas/recomendaciones?limite=${limite}`)
      return data
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export function useCrearReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (idFranja) => {
      const { data } = await api.post('/reservas', { idFranja })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franjas-semana'] })
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] })
      queryClient.invalidateQueries({ queryKey: ['historial-reservas'] })
      queryClient.invalidateQueries({ queryKey: ['recomendaciones'] })
    },
  })
}

export function useCancelarReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (idReserva) => {
      const { data } = await api.delete(`/reservas/${idReserva}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franjas-semana'] })
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] })
      queryClient.invalidateQueries({ queryKey: ['historial-reservas'] })
    },
  })
}

export function useCheckinReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (idReserva) => {
      const { data } = await api.post(`/reservas/${idReserva}/check-in`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] })
      queryClient.invalidateQueries({ queryKey: ['historial-reservas'] })
    },
  })
}
