import { useSyncExternalStore } from 'react'
import { getEmpleado, suscribirSesion } from './sesion'

/** El empleado con sesión iniciada, o null. Se vuelve a dibujar al iniciar o cerrar sesión. */
export function useSesion() {
  return useSyncExternalStore(suscribirSesion, getEmpleado)
}

export function useEsAdmin() {
  return useSesion()?.rol === 'admin'
}
