import type { Lote } from '../types/models'

export const loteKeys = {
  all: ['lotes'] as const,
}

/** Fecha de hoy en Guatemala como "2026-10-27" (la misma regla que usa el backend). */
export function hoyGT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' })
}

/** Días que faltan para la fecha "2027-06-30". 0 = vence hoy (ya no se vende); negativo = venció hace N días. */
export function diasParaVencer(fecha: string): number {
  const unDia = 24 * 60 * 60 * 1000
  return Math.round((Date.parse(fecha) - Date.parse(hoyGT())) / unDia)
}

export type Alerta = 'vencido' | 'urgente' | 'atencion' | 'ok' | 'agotado' | 'retirado'

/**
 * El semáforo de los lotes:
 * vencido (rojo) · vence en 30 días o menos (naranja) · en 90 días o menos (amarillo) · más de 90 (verde).
 * Un lote sin unidades o retirado ya no necesita atención (gris).
 */
export function alertaLote(lote: Lote): Alerta {
  if (lote.estado === 'Retirado') return 'retirado'
  if (lote.cantidad_actual <= 0) return 'agotado'
  const dias = diasParaVencer(lote.fecha_vencimiento)
  if (dias <= 0) return 'vencido'
  if (dias <= 30) return 'urgente'
  if (dias <= 90) return 'atencion'
  return 'ok'
}

export const ALERTA: Record<Alerta, { texto: string; tono: 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'gris' }> = {
  vencido: { texto: 'Vencido', tono: 'rojo' },
  urgente: { texto: 'Vence pronto', tono: 'naranja' },
  atencion: { texto: 'Atención', tono: 'amarillo' },
  ok: { texto: 'Vigente', tono: 'verde' },
  agotado: { texto: 'Agotado', tono: 'gris' },
  retirado: { texto: 'Retirado', tono: 'gris' },
}

/** "vence en 12 días", "vence hoy", "venció hace 3 días" */
export function textoDias(fecha: string): string {
  const dias = diasParaVencer(fecha)
  if (dias === 0) return 'vence hoy'
  if (dias === 1) return 'vence mañana'
  if (dias > 0) return `vence en ${dias} días`
  if (dias === -1) return 'venció ayer'
  return `venció hace ${-dias} días`
}

/** Lotes que piden acción: vencidos o que vencen en 30 días o menos (para el aviso del menú). */
export function necesitaAtencion(lote: Lote): boolean {
  const alerta = alertaLote(lote)
  return alerta === 'vencido' || alerta === 'urgente'
}
