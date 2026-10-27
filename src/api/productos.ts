import type { Producto } from '../types/models'
import { createCrudApi } from './crud'

export const productosApi = createCrudApi<Producto>('productos')

/** GET /api/productos/activos/lista: productos con estado: true. */
export const getProductosActivos = productosApi.listarActivos

/** GET /api/productos/:id: responde 404 si no existe. */
export const getProducto = productosApi.obtener
