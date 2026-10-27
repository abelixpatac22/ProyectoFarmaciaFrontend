import type { ReactNode } from 'react'
import type { CrudApi } from '../api/crud'

/** Tipos de campo que sabe dibujar ResourceForm. */
export type TipoCampo =
  | 'texto'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'entero'
  | 'decimal'
  | 'fecha'
  | 'checkbox'
  | 'select'
  | 'lista'
  | 'password'

/** Mínimo que exige el backend para las contraseñas de empleados. */
export const PASSWORD_MINIMO = 8

export interface Opcion {
  value: number
  label: string
}

export interface Campo {
  name: string
  label: string
  tipo: TipoCampo
  requerido?: boolean
  /** Obligatorio solo al crear (por ejemplo la contraseña: al editar, vacía significa "no cambiarla"). */
  requeridoAlCrear?: boolean
  placeholder?: string
  /** Texto de ayuda bajo el campo. */
  ayuda?: string
  /** Ocupa las dos columnas del formulario. */
  completo?: boolean
  /** Solo para tipo "lista": opciones fijas que se envían como texto. */
  valores?: Array<{ value: string; label: string }>
  /** Solo para tipo "select": de dónde salen las opciones (se envían como número). */
  opciones?: {
    queryKey: readonly unknown[]
    queryFn: (signal: AbortSignal) => Promise<Opcion[]>
  }
}

export interface Columna<T> {
  header: string
  render: (fila: T) => ReactNode
  className?: string
}

/**
 * Todo lo que una pantalla de administración necesita saber de un recurso.
 * Con esto, ResourcePage sirve igual para productos, clientes, proveedores y empleados.
 */
export interface ResourceConfig<T> {
  recurso: string
  titulo: string
  singular: string
  queryKey: readonly unknown[]
  api: CrudApi<T>
  getId: (fila: T) => number
  getNombre: (fila: T) => string
  getEstado: (fila: T) => boolean | null
  /** Texto en el que busca el buscador. */
  textoBusqueda: (fila: T) => string
  columnas: Columna<T>[]
  campos: Campo[]
  /** Solo un administrador puede crear, editar o desactivar (el backend responde 403 a los demás). */
  soloAdminEscribe?: boolean
}

export type ValoresForm = Record<string, string | boolean>

/** Registro del backend -> valores del formulario (los inputs siempre trabajan con texto). */
export function aValoresForm(campos: Campo[], fila?: unknown): ValoresForm {
  const datos = (fila ?? {}) as Record<string, unknown>
  const valores: ValoresForm = {}
  for (const campo of campos) {
    const v = datos[campo.name]
    if (campo.tipo === 'checkbox') valores[campo.name] = Boolean(v)
    // El backend nunca devuelve la contraseña: el campo siempre empieza vacío
    else if (campo.tipo === 'password') valores[campo.name] = ''
    // Una lista sin valor muestra su primera opción: el valor tiene que coincidir con lo que se ve
    else if (campo.tipo === 'lista') valores[campo.name] = typeof v === 'string' && v ? v : (campo.valores?.[0]?.value ?? '')
    else if (campo.tipo === 'fecha') valores[campo.name] = typeof v === 'string' ? v.slice(0, 10) : ''
    else valores[campo.name] = v === null || v === undefined ? '' : String(v)
  }
  return valores
}

/** Valores del formulario -> cuerpo JSON para el backend (números como número, vacío como null). */
export function aCuerpo(campos: Campo[], valores: ValoresForm): Record<string, unknown> {
  const cuerpo: Record<string, unknown> = {}
  for (const campo of campos) {
    const v = valores[campo.name]
    if (campo.tipo === 'checkbox') {
      cuerpo[campo.name] = Boolean(v)
      continue
    }
    if (campo.tipo === 'password') {
      // Vacía = no cambiarla: no se envía (null la borraría). Sin trim: los espacios son parte de la contraseña
      if (v) cuerpo[campo.name] = v
      continue
    }
    const texto = String(v ?? '').trim()
    if (texto === '') cuerpo[campo.name] = null
    else if (['entero', 'decimal', 'select'].includes(campo.tipo)) cuerpo[campo.name] = Number(texto)
    else cuerpo[campo.name] = texto
  }
  return cuerpo
}

export function validarForm(campos: Campo[], valores: ValoresForm, creando: boolean): Record<string, string> {
  const errores: Record<string, string> = {}
  for (const campo of campos) {
    if (campo.tipo === 'checkbox') continue
    const texto = String(valores[campo.name] ?? '').trim()
    if (!texto) {
      if (campo.requerido || (creando && campo.requeridoAlCrear)) errores[campo.name] = 'Este campo es obligatorio.'
      continue
    }
    if (campo.tipo === 'password' && String(valores[campo.name]).length < PASSWORD_MINIMO)
      errores[campo.name] = `Debe tener al menos ${PASSWORD_MINIMO} caracteres.`
    if (campo.tipo === 'decimal' && !(Number(texto) >= 0)) errores[campo.name] = 'Escribe un número válido (0 o más).'
    if (campo.tipo === 'entero' && !(Number.isInteger(Number(texto)) && Number(texto) >= 0))
      errores[campo.name] = 'Escribe un número entero (0 o más).'
    if (campo.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) errores[campo.name] = 'Correo inválido.'
  }
  return errores
}
