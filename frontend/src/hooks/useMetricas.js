import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useMetricas(fechaLunes) {
  return useQuery({
    queryKey: ['metricas-resumen', fechaLunes],
    queryFn: async () => {
      const { data } = await api.get(`/metricas/resumen?fecha=${fechaLunes}`);
      return data;
    },
    enabled: Boolean(fechaLunes),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
}
