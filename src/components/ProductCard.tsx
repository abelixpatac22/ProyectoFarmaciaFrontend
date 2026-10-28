import { useState } from 'react'
import { Link } from 'react-router'
import { useCart } from '../cart/useCart'
import { formatQuetzales } from '../lib/format'
import { getEstadoStock, getPrecio, getStockVendible, STOCK_LABEL } from '../lib/producto'
import type { Producto } from '../types/models'
import { CartIcon, RecetaIcon } from './icons'
import { ProductImage } from './ProductImage'

export function ProductCard({ producto }: { producto: Producto }) {
  const { items, agregar } = useCart()
  const nombre = producto.nombre?.trim() || 'Producto sin nombre'
  const precio = getPrecio(producto)
  const stock = getEstadoStock(producto)
  const agotado = stock === 'agotado'
  const enCarrito = items.find((i) => i.id_producto === producto.id_producto)?.cantidad ?? 0
  // El número solo "salta" al agregar, no cuando la tarjeta aparece con unidades ya en el carrito
  const [enCarritoInicial] = useState(enCarrito)
  const puedeAgregar = !agotado && precio !== null && enCarrito < getStockVendible(producto)

  return (
    <article
      className={`group relative flex w-full flex-col overflow-hidden rounded-box bg-white transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-quint)] hover:shadow-lg motion-safe:hover:-translate-y-0.5 hover:shadow-ink/5 ${agotado ? 'opacity-70' : ''}`}
    >
      <div className="relative">
        <ProductImage
          id={producto.id_producto}
          nombre={nombre}
          imagen={producto.imagen_url}
          presentacion={producto.descripcion}
          codigo={producto.codigo_barras}
        />
        {producto.requiere_receta && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-box bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <RecetaIcon className="size-3.5" />
            Requiere receta
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="line-clamp-2 text-lg leading-snug font-semibold">
          {/* "Enlace estirado": el ::after cubre toda la tarjeta, así toda es clicable sin meter un botón dentro de un enlace */}
          <Link
            to={`/productos/${producto.id_producto}`}
            className="outline-none after:absolute after:inset-0 after:rounded-box focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-600"
          >
            {nombre}
          </Link>
        </h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-ink-soft">{producto.descripcion}</p>}

        <p className={`text-sm font-medium ${STOCK_LABEL[stock].clase}`}>{STOCK_LABEL[stock].texto}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="text-2xl tracking-tight tabular-nums">
            {precio !== null ? (
              formatQuetzales(precio)
            ) : (
              <span className="text-base text-ink-soft">Precio no disponible</span>
            )}
          </p>
          {/* Con receta no se vende en línea: el detalle del producto explica cómo comprarlo */}
          {producto.requiere_receta ? (
            <span className="text-right text-xs leading-tight font-medium text-amber-900">
              Solo en
              <br />
              farmacia física
            </span>
          ) : (
            <button
              type="button"
              onClick={() => agregar(producto.id_producto)}
              disabled={!puedeAgregar}
              className="relative z-10 inline-flex h-10 items-center gap-1.5 rounded-box bg-ink px-3.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-700 active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-600 disabled:active:scale-100"
              aria-label={`Agregar ${nombre} al carrito`}
            >
              <CartIcon className="size-4" />
              {/* key: cada vez que cambia la cantidad el número "salta" para confirmar que se agregó */}
              {enCarrito > 0 ? (
                <span key={enCarrito} className={`inline-block tabular-nums ${enCarrito !== enCarritoInicial ? 'animate-bump' : ''}`}>
                  {enCarrito}
                </span>
              ) : (
                'Agregar'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
