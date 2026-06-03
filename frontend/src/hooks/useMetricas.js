import { useQuery } from '@tanstack/react-query'
import api from '../config/axios'

export function useMetricasResumen(fechaLunes) {
  return useQuery({
    queryKey: ['metricas-resumen', fechaLunes],
    queryFn: async () => {
      const { data } = await api.get(`/metricas/resumen?fecha=${fechaLunes}`)
      return data
    },
    enabled: Boolean(fechaLunes),
    refetchInterval: 15000,
  })
}

export function useMetricasAnalisis(tipo, fecha) {
  return useQuery({
    queryKey: ['metricas-analisis', tipo, fecha],
    queryFn: async () => {
      const { data } = await api.get(`/metricas/analisis?tipo=${tipo}&fecha=${fecha}`)
      return data
    },
    enabled: Boolean(tipo) && Boolean(fecha),
    staleTime: 60000,
    retry: 1,
  })
}
