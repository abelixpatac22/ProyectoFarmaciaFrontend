import type { CrearSesionPagoBody, CrearSesionPagoRespuesta } from '../types/models'
import { apiSend } from './client'

/** POST /api/pagos/crear-sesion: devuelve la url de Stripe Checkout a la que hay que redirigir. */
export function crearSesionPago(body: CrearSesionPagoBody) {
  return apiSend<CrearSesionPagoRespuesta>('/api/pagos/crear-sesion', 'POST', body)
}
