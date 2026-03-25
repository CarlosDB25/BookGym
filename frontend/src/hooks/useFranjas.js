import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useFranjas(fechaLunes, enabled = true) {
  return useQuery({
    queryKey: ['franjas-semana', fechaLunes],
    queryFn: async () => {
      const { data } = await api.get(`/franjas/semana?fecha=${fechaLunes}`);
      return data;
    },
    enabled: Boolean(fechaLunes) && enabled,
    staleTime: 30 * 1000,
  });
}
