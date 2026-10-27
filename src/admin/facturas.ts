export const facturaKeys = {
  all: ['facturas'] as const,
  detalle: (id: number) => ['facturas', id] as const,
}

export function estadoFacturaTono(estado: string | null) {
  if (estado === 'Completada' || estado === 'Pagada') return 'verde'
  if (estado === 'Pendiente') return 'ambar'
  if (estado === 'Anulada' || estado === 'Cancelada') return 'rojo'
  return 'gris'
}
