import type { Producto } from '../types/models'
import { toNumber } from './format'

export type EstadoStock = 'agotado' | 'bajo' | 'disponible'

export const STOCK_LABEL: Record<EstadoStock, { texto: string; clase: string }> = {
  disponible: { texto: 'Disponible', clase: 'text-brand-700' },
  bajo: { texto: 'Últimas unidades', clase: 'text-amber-700' },
  agotado: { texto: 'Agotado', clase: 'text-zinc-500' },
}

/**
 * Unidades que se pueden vender: las de lotes sin vencer (stock_disponible). Lo vencido sigue en bodega
 * (stock_actual) hasta que lo retiren, pero la tienda no lo ofrece.
 */
export function getStockVendible(producto: Producto): number {
  return producto.stock_disponible ?? producto.stock_actual ?? 0
}

/** Agotado si no hay unidades vendibles; "bajo" si quedan igual o menos que stock_minimo. */
export function getEstadoStock(producto: Producto): EstadoStock {
  const stock = getStockVendible(producto)
  if (stock <= 0) return 'agotado'
  if (producto.stock_minimo !== null && stock <= producto.stock_minimo) return 'bajo'
  return 'disponible'
}

export function getPrecio(producto: Producto): number | null {
  return toNumber(producto.precio_venta)
}

/** Quita mayúsculas y tildes para que "acetaminofen" encuentre "Acetaminofén". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}
