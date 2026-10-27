import type { Empleado } from '../types/models'

/**
 * La sesión del panel vive en localStorage (token + empleado) para sobrevivir a recargar la página.
 * No es un estado de React porque apiFetch, que no es un componente, también necesita leerla y borrarla.
 * Los componentes se enteran de los cambios con useSesion() (useSyncExternalStore).
 */
const TOKEN_KEY = 'farmacia:token'
const EMPLEADO_KEY = 'farmacia:empleado'

let empleado: Empleado | null = leerEmpleado()
const oyentes = new Set<() => void>()

function leerEmpleado(): Empleado | null {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    const guardado = localStorage.getItem(EMPLEADO_KEY)
    return guardado ? (JSON.parse(guardado) as Empleado) : null
  } catch {
    // Navegación privada o almacenamiento bloqueado: simplemente no hay sesión
    return null
  }
}

function avisar() {
  for (const oyente of oyentes) oyente()
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getEmpleado(): Empleado | null {
  return empleado
}

export function guardarSesion(token: string, nuevo: Empleado) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EMPLEADO_KEY, JSON.stringify(nuevo))
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar, pero el panel igual funciona
  }
  empleado = nuevo
  avisar()
}

/** GET /auth/perfil devuelve los datos actuales (por ejemplo, si le cambiaron el rol). */
export function actualizarEmpleado(nuevo: Empleado) {
  if (!empleado) return
  try {
    localStorage.setItem(EMPLEADO_KEY, JSON.stringify(nuevo))
  } catch {
    // Igual se actualiza en memoria
  }
  empleado = nuevo
  avisar()
}

/** Cerrar sesión solo pasa en el frontend: el backend no tiene logout, basta con olvidar el token. */
export function cerrarSesion() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMPLEADO_KEY)
  } catch {
    // Nada que borrar
  }
  if (empleado === null) return
  empleado = null
  avisar()
}

export function suscribirSesion(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
