import type { CartItem } from './CartContext'

export type CartAction =
  | { type: 'agregar'; id_producto: number; cantidad: number }
  | { type: 'cambiarCantidad'; id_producto: number; cantidad: number }
  | { type: 'quitar'; id_producto: number }
  | { type: 'vaciar' }

/**
 * Un reducer es una función pura: recibe el estado actual y una acción, y devuelve el estado nuevo
 * SIN modificar el anterior. Así todos los cambios del carrito están en un solo lugar y son fáciles de probar.
 */
export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'agregar': {
      const existe = items.some((i) => i.id_producto === action.id_producto)
      if (!existe) return [...items, { id_producto: action.id_producto, cantidad: action.cantidad }]
      return items.map((i) =>
        i.id_producto === action.id_producto ? { ...i, cantidad: i.cantidad + action.cantidad } : i,
      )
    }
    case 'cambiarCantidad':
      if (action.cantidad <= 0) return items.filter((i) => i.id_producto !== action.id_producto)
      return items.map((i) => (i.id_producto === action.id_producto ? { ...i, cantidad: action.cantidad } : i))
    case 'quitar':
      return items.filter((i) => i.id_producto !== action.id_producto)
    case 'vaciar':
      // Devolver el MISMO arreglo si ya está vacío evita un render (y un guardado) innecesario
      return items.length === 0 ? items : []
  }
}

const STORAGE_KEY = 'farmacia:carrito'

/** Lee el carrito guardado. Nunca confíes en localStorage: el usuario puede editarlo o puede estar corrupto. */
export function cargarCarrito(): CartItem[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(data)) return []
    return data.filter(
      (i): i is CartItem =>
        typeof i === 'object' &&
        i !== null &&
        Number.isInteger(i.id_producto) &&
        Number.isInteger(i.cantidad) &&
        i.cantidad > 0,
    )
  } catch {
    return []
  }
}

export function guardarCarrito(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Modo incógnito o almacenamiento lleno: el carrito sigue funcionando en memoria
  }
}
