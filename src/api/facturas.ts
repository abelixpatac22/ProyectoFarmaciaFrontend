import type { CrearFacturaBody, CrearFacturaRespuesta, FacturaCompleta, FacturaConCliente } from '../types/models'
import { apiFetch, apiSend } from './client'

/** GET /api/facturas: todas, con { nombre, apellido, nit } del cliente. */
export function getFacturas(signal?: AbortSignal) {
  return apiFetch<FacturaConCliente[]>('/api/facturas', { signal })
}

/** GET /api/facturas/:id: con cliente, empleado y cada línea con el nombre del producto. */
export function getFactura(id: number, signal?: AbortSignal) {
  return apiFetch<FacturaCompleta>(`/api/facturas/${id}`, { signal })
}

/** POST /api/facturas: crea la venta y descuenta stock. Si falta stock responde 500 con el motivo en `detalle`. */
export function crearFactura(body: CrearFacturaBody) {
  return apiSend<CrearFacturaRespuesta>('/api/facturas', 'POST', body)
}
