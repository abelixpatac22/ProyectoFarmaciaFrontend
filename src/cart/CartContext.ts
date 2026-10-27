import { createContext } from 'react'

/**
 * El carrito guarda SOLO id y cantidad. El nombre, el precio y el stock se leen siempre
 * del backend (ver useCartLines): si el precio cambia, el carrito no queda con un precio viejo.
 */
export interface CartItem {
  id_producto: number
  cantidad: number
}

export interface CartContextValue {
  items: CartItem[]
  totalUnidades: number
  agregar: (id_producto: number, cantidad?: number) => void
  cambiarCantidad: (id_producto: number, cantidad: number) => void
  quitar: (id_producto: number) => void
  vaciar: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
