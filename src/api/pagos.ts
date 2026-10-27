import type { CrearSesionPagoBody, CrearSesionPagoRespuesta, EstadoPagoRespuesta } from '../types/models'
import { apiSend } from './client'

/** POST /api/pagos/crear-sesion: devuelve la url de Stripe Checkout a la que hay que redirigir. */
export function crearSesionPago(body: CrearSesionPagoBody) {
  return apiSend<CrearSesionPagoRespuesta>('/api/pagos/crear-sesion', 'POST', body)
}

/** POST /api/pagos/confirmar: el backend le pregunta a Stripe si se pagó y marca la factura como Pagada. */
export function confirmarPago(id_sesion: string) {
  return apiSend<EstadoPagoRespuesta>('/api/pagos/confirmar', 'POST', { id_sesion })
}

/** POST /api/pagos/cancelar: la factura queda Cancelada y el stock apartado regresa al inventario. */
export function cancelarPago(id_sesion: string) {
  return apiSend<EstadoPagoRespuesta>('/api/pagos/cancelar', 'POST', { id_sesion })
}
