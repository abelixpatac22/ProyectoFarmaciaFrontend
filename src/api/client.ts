import { cerrarSesion, getToken } from '../auth/sesion'
import type { ErrorRespuesta, MensajeRespuesta } from '../types/models'

/**
 * URL base del backend.
 * - En desarrollo queda vacía y las peticiones van a "/api/...", que el proxy de Vite reenvía a localhost:8080.
 * - En producción se define VITE_API_URL (ver .env.example).
 */
const API_URL = import.meta.env.VITE_API_URL ?? ''

/** Error con el código HTTP, para que la interfaz distinga "no encontrado" de "servidor caído". */
export class ApiError extends Error {
  readonly status: number
  readonly detalle?: string

  constructor(message: string, status: number, detalle?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detalle = detalle
  }
}

/**
 * En estas rutas un 401 significa "datos incorrectos", no "sesión vencida":
 * el login con contraseña equivocada y el cambio de contraseña con la actual equivocada.
 */
const RUTAS_401_SIN_CERRAR_SESION = ['/api/auth/login', '/api/auth/cambiar-password']

/**
 * Único lugar donde se llama a fetch. Todas las funciones de src/api lo usan.
 * fetch NO lanza error con 404 o 500 (solo cuando no hay red), por eso revisamos res.ok a mano.
 */
export async function apiFetch<T>(path: string, init?: RequestInit & { sinSesion?: boolean }): Promise<T> {
  // Si hay sesión de empleado, las peticiones llevan el token (el backend ignora el header donde no lo pide).
  // sinSesion: la compra de la tienda nunca lo lleva; si no, con el panel abierto en el mismo navegador
  // el backend la tomaría como venta de un empleado en la farmacia física (Completada, sin cobrar)
  const { sinSesion, ...opciones } = init ?? {}
  init = opciones
  const token = sinSesion ? null : getToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init?.headers,
      },
    })
  } catch (error) {
    // Si nosotros cancelamos la petición (por ejemplo, al salir de la página), no es un error de red
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    // status 0 = no hubo respuesta (sin internet, backend apagado, URL incorrecta)
    throw new ApiError('No se pudo conectar con el servidor.', 0)
  }

  const body: unknown = await res.json().catch(() => null)

  // Token vencido (dura 8 horas) o empleado desactivado: se borra la sesión y el panel manda al login.
  // Solo si enviamos un token: un cliente de la tienda sin sesión no tiene nada que cerrar.
  if (res.status === 401 && token && !RUTAS_401_SIN_CERRAR_SESION.includes(path)) {
    cerrarSesion()
    throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', 401)
  }

  if (!res.ok) {
    const error = body as Partial<ErrorRespuesta> | null
    throw new ApiError(
      error?.message ?? `El servidor respondió con un error (${res.status}).`,
      res.status,
      error?.detalle,
    )
  }

  return body as T
}

/** Atajo para enviar JSON con POST o PUT. */
export function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  opciones?: { sinSesion?: boolean },
): Promise<T> {
  return apiFetch<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body), ...opciones })
}

/**
 * PUT y DELETE del backend responden 200 aunque el id no exista, con "No se pudo..." en el mensaje.
 * Aquí lo convertimos en un error de verdad para que la interfaz no muestre "guardado" cuando no lo fue.
 */
export function assertMensajeOk(respuesta: MensajeRespuesta): MensajeRespuesta {
  if (respuesta.message.startsWith('No se pudo')) {
    throw new ApiError(respuesta.message, 404)
  }
  return respuesta
}
