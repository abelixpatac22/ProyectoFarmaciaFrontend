import type { MensajeRespuesta } from '../types/models'
import { apiFetch, apiSend, assertMensajeOk } from './client'

/**
 * clientes, productos, proveedores y empleados comparten exactamente las mismas rutas,
 * así que en vez de escribir 4 veces lo mismo creamos las funciones con una "fábrica".
 * T es el tipo del registro (Producto, Cliente...).
 */
export interface CrudApi<T> {
  listar: (signal?: AbortSignal) => Promise<T[]>
  listarActivos: (signal?: AbortSignal) => Promise<T[]>
  obtener: (id: number, signal?: AbortSignal) => Promise<T>
  crear: (body: Partial<T>) => Promise<T>
  actualizar: (id: number, body: Partial<T>) => Promise<MensajeRespuesta>
  /** En vez de DELETE (que borra de verdad y falla si hay facturas), desactivamos con estado: false. */
  cambiarEstado: (id: number, estado: boolean) => Promise<MensajeRespuesta>
}

export function createCrudApi<T>(recurso: string): CrudApi<T> {
  const base = `/api/${recurso}`

  return {
    listar: (signal) => apiFetch<T[]>(base, { signal }),
    listarActivos: (signal) => apiFetch<T[]>(`${base}/activos/lista`, { signal }),
    obtener: (id, signal) => apiFetch<T>(`${base}/${id}`, { signal }),
    crear: (body) => apiSend<T>(base, 'POST', body),
    actualizar: async (id, body) => assertMensajeOk(await apiSend<MensajeRespuesta>(`${base}/${id}`, 'PUT', body)),
    cambiarEstado: async (id, estado) =>
      assertMensajeOk(await apiSend<MensajeRespuesta>(`${base}/${id}`, 'PUT', { estado })),
  }
}
