import { useQuery } from '@tanstack/react-query'
import api from '../config/axios'

export function useReglasReserva() {
  return useQuery({
    queryKey: ['reglas-reserva'],
    queryFn: async () => {
      const { data } = await api.get('/configuracion/reglas-reserva')
      return data
    },
    staleTime: 60000,
    refetchInterval: 60000,
  })
}
