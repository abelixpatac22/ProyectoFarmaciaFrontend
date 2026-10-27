/** Redondea a 2 decimales evitando errores como 0.1 + 0.2 = 0.30000000000000004. */
export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/** IVA de Guatemala. */
export const IVA = 0.12

/**
 * En Guatemala los precios al público ya incluyen IVA, así que lo "sacamos" del total:
 * total 112 -> subtotal 100 + impuesto 12.
 */
export function desglosarIva(total: number) {
  const subtotal = redondear(total / (1 + IVA))
  return { subtotal, impuesto: redondear(total - subtotal), total: redondear(total) }
}
