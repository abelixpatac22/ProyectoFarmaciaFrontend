import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durante 1 minuto los datos se consideran frescos: volver al catálogo no repite la petición.
      staleTime: 60_000,
      // Reintentar no sirve si el error es nuestro (400, 404): solo reintentamos fallas de red o del servidor.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})
