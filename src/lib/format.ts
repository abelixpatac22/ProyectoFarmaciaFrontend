import type { Decimal } from '../types/models'

/** Convierte un DECIMAL del backend ("25.50") a número. Devuelve null si viene vacío o no es válido. */
export function toNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })

/** 25.5 -> "Q25.50" */
export function formatQuetzales(value: number): string {
  return quetzales.format(value)
}

const fechaHora = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
// Las fechas sin hora (fecha_ingreso) se guardan como medianoche UTC: si las mostramos en hora de
// Guatemala (UTC-6) saldrían un día antes. Por eso las formateamos en UTC.
const soloFecha = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: 'UTC' })

/** "2026-10-21T15:30:00.000Z" -> "21 oct 2026, 9:30". Con soloDia: "21 oct 2026". */
export function formatFecha(iso: string | null, soloDia = false): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return (soloDia ? soloFecha : fechaHora).format(fecha)
}
