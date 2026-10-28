import type { EntradaLoteBody, Lote, LoteConProducto, MensajeRespuesta } from '../types/models'
import { apiFetch, apiSend } from './client'

/** GET /api/lotes: todos los lotes con el nombre del producto, del que vence primero al último. */
export function getLotes(signal?: AbortSignal) {
  return apiFetch<LoteConProducto[]>('/api/lotes', { signal })
}

/** POST /api/lotes: llega mercadería; el stock del producto sube. Rechaza lotes ya vencidos. */
export function registrarEntrada(body: EntradaLoteBody) {
  return apiSend<Lote>('/api/lotes', 'POST', body)
}

/** PUT /api/lotes/:id/retirar: da de baja lo que quedaba del lote (vencido, dañado...). */
export function retirarLote(id: number, motivo: string) {
  return apiSend<MensajeRespuesta & { lote: Lote }>(`/api/lotes/${id}/retirar`, 'PUT', { motivo })
}
