import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useReglasReserva() {
  return useQuery({
    queryKey: ['reglas-reserva'],
    queryFn: async () => {
      const { data } = await api.get('/configuracion/reglas-reserva');
      return data;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}
