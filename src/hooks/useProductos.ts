import { useQuery } from '@tanstack/react-query'
import { getProducto, getProductosActivos } from '../api/productos'

/**
 * Claves de caché en un solo lugar. Cuando el panel de administración cree o edite
 * un producto, bastará con invalidar productoKeys.all para refrescar todo.
 */
export const productoKeys = {
  all: ['productos'] as const,
  activos: () => [...productoKeys.all, 'activos'] as const,
  detalle: (id: number) => [...productoKeys.all, 'detalle', id] as const,
}

export function useProductosActivos() {
  return useQuery({
    queryKey: productoKeys.activos(),
    queryFn: ({ signal }) => getProductosActivos(signal),
  })
}

export function useProducto(id: number) {
  return useQuery({
    queryKey: productoKeys.detalle(id),
    queryFn: ({ signal }) => getProducto(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })
}
