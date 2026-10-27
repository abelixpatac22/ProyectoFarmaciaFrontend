import { useMemo } from 'react'
import { useProductosActivos } from '../hooks/useProductos'
import { redondear } from '../lib/dinero'
import { getPrecio } from '../lib/producto'
import type { Producto } from '../types/models'
import { useCart } from './useCart'

export type ProblemaLinea = 'no-disponible' | 'sin-precio' | 'stock-insuficiente'

export interface CartLine {
  id_producto: number
  cantidad: number
  producto: Producto | null
  precio: number
  subtotal: number
  stock: number
  problema: ProblemaLinea | null
}

/**
 * Une el carrito (id + cantidad) con los datos actuales del backend.
 * Reutiliza la misma consulta del catálogo, así que casi siempre ya está en caché.
 */
export function useCartLines() {
  const { items } = useCart()
  const query = useProductosActivos()

  const resultado = useMemo(() => {
    const porId = new Map((query.data ?? []).map((p) => [p.id_producto, p]))

    const lineas: CartLine[] = items.map((item) => {
      const producto = porId.get(item.id_producto) ?? null
      const precio = producto ? (getPrecio(producto) ?? 0) : 0
      const stock = producto?.stock_actual ?? 0
      let problema: ProblemaLinea | null = null
      if (!producto) problema = 'no-disponible'
      else if (getPrecio(producto) === null) problema = 'sin-precio'
      else if (item.cantidad > stock) problema = 'stock-insuficiente'

      return { ...item, producto, precio, stock, subtotal: redondear(precio * item.cantidad), problema }
    })

    return {
      lineas,
      total: redondear(lineas.reduce((suma, l) => suma + l.subtotal, 0)),
      hayProblemas: lineas.some((l) => l.problema !== null),
    }
  }, [items, query.data])

  return { ...resultado, isPending: query.isPending, error: query.error, refetch: query.refetch }
}
