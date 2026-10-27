/**
 * El backend todavía no tiene imagen_url, así que dibujamos el empaque del producto:
 * un campo de color (fijo por id: el mismo producto siempre se ve igual) con una etiqueta
 * que lleva el nombre, la presentación y el código de barras reales.
 * Cuando exista la imagen, este componente es el único que hay que cambiar.
 */
const CAMPOS = ['bg-field-sage', 'bg-field-slate', 'bg-field-blush', 'bg-field-mint']

interface ProductImageProps {
  id: number
  nombre: string
  /** Presentación del producto (la descripción), impresa bajo el nombre. */
  presentacion?: string | null
  codigo?: string | null
  /** Versión pequeña para miniaturas (carrito, resumen del pedido). */
  compact?: boolean
  /** Ocupa toda la altura de su contenedor en vez de usar proporción 4:3 (detalle de producto). */
  stage?: boolean
}

export function ProductImage({ id, nombre, presentacion, codigo, compact = false, stage = false }: ProductImageProps) {
  const campo = CAMPOS[id % CAMPOS.length]

  if (compact) {
    const inicial = nombre.match(/\p{L}/u)?.[0]?.toUpperCase() ?? '+'
    return (
      <div className={`grid aspect-[4/3] place-items-center ${campo}`}>
        <span className="text-2xl font-semibold text-ink/70">{inicial}</span>
      </div>
    )
  }

  // --u es la unidad de la etiqueta: en la tarjeta escala con el ancho; en el escenario del detalle
  // escala con el lado menor, para que la etiqueta quepa también en pantallas anchas y bajas.
  return (
    <div
      aria-hidden="true"
      className={`relative grid place-items-center overflow-hidden ${campo} ${stage ? 'h-full [--u:1.25cqmin] [container-type:size]' : '@container aspect-[4/3] [--u:1cqw]'}`}
    >
      <div className="w-[calc(var(--u)*62)] max-w-md rounded-box bg-white px-[calc(var(--u)*5)] pt-[calc(var(--u)*4.5)] pb-[calc(var(--u)*4)] text-ink transition-transform duration-250 ease-[var(--ease-out-quint)] motion-safe:group-hover:scale-[1.03]">
        <CruzIcon className="size-[max(14px,calc(var(--u)*5))] text-brand-700" />
        <p className="mt-[calc(var(--u)*3)] line-clamp-2 text-[max(15px,calc(var(--u)*6))] leading-[1.05] font-semibold tracking-tight">
          {nombre}
        </p>
        {presentacion && (
          <p className="mt-[calc(var(--u)*1.5)] line-clamp-1 text-[max(11px,calc(var(--u)*3.6))] text-ink-soft">{presentacion}</p>
        )}
        <CodigoBarras
          valor={codigo || String(id).padStart(8, '0')}
          className="mt-[calc(var(--u)*4)] h-[calc(var(--u)*8)] min-h-5 w-full"
        />
        {codigo && (
          <p className="mt-[calc(var(--u)*1)] text-[max(10px,calc(var(--u)*2.8))] tracking-[0.2em] text-ink-soft tabular-nums">
            {codigo}
          </p>
        )}
      </div>
    </div>
  )
}

function CruzIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
    </svg>
  )
}

/** Barras dibujadas a partir de los dígitos: es una ilustración, el número real va impreso debajo. */
function CodigoBarras({ valor, className }: { valor: string; className?: string }) {
  const barras: Array<{ x: number; w: number }> = []
  let x = 0
  for (const c of valor) {
    const d = c.charCodeAt(0)
    const ancho = (d % 3) + 1
    barras.push({ x, w: ancho })
    x += ancho + ((d >> 1) % 2) + 1
    barras.push({ x, w: 1 })
    x += 2
  }

  return (
    <svg viewBox={`0 0 ${x} 10`} preserveAspectRatio="none" className={className}>
      {barras.map((b) => (
        <rect key={b.x} x={b.x} width={b.w} height="10" fill="currentColor" />
      ))}
    </svg>
  )
}
