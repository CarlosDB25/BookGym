import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export function useReservas() {
  return useQuery({
    queryKey: ['mis-reservas'],
    queryFn: async () => {
      const { data } = await api.get('/reservas');
      return data;
    },
    refetchInterval: 7000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idFranja) => {
      const { data } = await api.post('/reservas', { idFranja });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franjas-semana'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idReserva) => {
      const { data } = await api.delete(`/reservas/${idReserva}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franjas-semana'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
  });
}
