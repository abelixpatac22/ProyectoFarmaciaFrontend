import type { Empleado, LoginRespuesta, MensajeRespuesta } from '../types/models'
import { apiFetch, apiSend } from './client'

export function iniciarSesion(email: string, password: string) {
  return apiSend<LoginRespuesta>('/api/auth/login', 'POST', { email: email.trim(), password })
}

/** Sirve para saber si el token guardado sigue siendo válido al recargar la página. */
export function getPerfil(signal?: AbortSignal) {
  return apiFetch<Empleado>('/api/auth/perfil', { signal })
}

/** Si la contraseña actual es incorrecta responde 401, pero eso NO cierra la sesión (ver apiFetch). */
export function cambiarPassword(password_actual: string, password_nueva: string) {
  return apiSend<MensajeRespuesta>('/api/auth/cambiar-password', 'PUT', { password_actual, password_nueva })
}
