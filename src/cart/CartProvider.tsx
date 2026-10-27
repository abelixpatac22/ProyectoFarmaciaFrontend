import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { CartContext, type CartContextValue } from './CartContext'
import { cargarCarrito, cartReducer, guardarCarrito } from './cartReducer'

export function CartProvider({ children }: { children: ReactNode }) {
  // El tercer argumento de useReducer inicializa el estado una sola vez, leyendo localStorage
  const [items, dispatch] = useReducer(cartReducer, undefined, cargarCarrito)

  // Cada vez que cambia el carrito, lo guardamos
  useEffect(() => guardarCarrito(items), [items])

  // dispatch nunca cambia, así que las acciones se crean una sola vez ([] como dependencias).
  // Funciones estables = se pueden usar sin miedo dentro de useEffect.
  const acciones = useMemo(
    () => ({
      agregar: (id_producto: number, cantidad = 1) => dispatch({ type: 'agregar', id_producto, cantidad }),
      cambiarCantidad: (id_producto: number, cantidad: number) =>
        dispatch({ type: 'cambiarCantidad', id_producto, cantidad }),
      quitar: (id_producto: number) => dispatch({ type: 'quitar', id_producto }),
      vaciar: () => dispatch({ type: 'vaciar' }),
    }),
    [],
  )

  const value = useMemo<CartContextValue>(
    () => ({ items, totalUnidades: items.reduce((suma, i) => suma + i.cantidad, 0), ...acciones }),
    [items, acciones],
  )

  return <CartContext value={value}>{children}</CartContext>
}
