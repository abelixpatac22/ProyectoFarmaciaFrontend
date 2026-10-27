import { Link } from 'react-router'
import { useCart } from '../cart/useCart'
import { useCartLines, type ProblemaLinea } from '../cart/useCartLines'
import { AlertIcon, CartIcon, TrashIcon } from '../components/icons'
import { ProductImage } from '../components/ProductImage'
import { QuantityInput } from '../components/QuantityInput'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn, card } from '../components/ui'
import { desglosarIva } from '../lib/dinero'
import { formatQuetzales } from '../lib/format'

const PROBLEMAS: Record<ProblemaLinea, string> = {
  'no-disponible': 'Este producto ya no está disponible. Quítalo para continuar.',
  'sin-precio': 'Este producto no tiene precio. Quítalo para continuar.',
  'stock-insuficiente': 'No hay suficientes unidades. Reduce la cantidad.',
}

export function CarritoPage() {
  const { items, cambiarCantidad, quitar, vaciar } = useCart()
  const { lineas, total, hayProblemas, isPending, error, refetch } = useCartLines()

  if (items.length === 0) {
    return (
      <StatusMessage
        icon={<CartIcon />}
        title="Tu carrito está vacío"
        description="Explora el catálogo y agrega lo que necesites."
        action={
          <Link to="/" className={btn.primary}>
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  if (isPending) return <PageSpinner texto="Actualizando precios…" />

  if (error && lineas.every((l) => !l.producto)) {
    return (
      <StatusMessage
        tone="danger"
        icon={<AlertIcon />}
        title="No pudimos cargar tu carrito"
        description={error.message}
        action={
          <button type="button" onClick={() => refetch()} className={btn.primary}>
            Reintentar
          </button>
        }
      />
    )
  }

  const { subtotal, impuesto } = desglosarIva(total)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Carrito</h1>
        <button type="button" onClick={vaciar} className={btn.ghost}>
          Vaciar carrito
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className={`${card} divide-y divide-zinc-100`}>
          {lineas.map((linea) => {
            const nombre = linea.producto?.nombre ?? `Producto #${linea.id_producto}`
            return (
              <li key={linea.id_producto} className="flex gap-4 p-4 sm:p-5">
                <div className="w-20 shrink-0 overflow-hidden rounded-xl sm:w-24">
                  <ProductImage id={linea.id_producto} nombre={nombre} compact />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/productos/${linea.id_producto}`}
                      className="line-clamp-2 font-semibold hover:text-brand-700"
                    >
                      {nombre}
                    </Link>
                    <p className="mt-0.5 text-sm text-zinc-500 tabular-nums">{formatQuetzales(linea.precio)} c/u</p>
                    {linea.problema && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <AlertIcon className="size-4 shrink-0" />
                        {PROBLEMAS[linea.problema]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <p className="font-semibold tabular-nums sm:order-first">{formatQuetzales(linea.subtotal)}</p>
                    <div className="flex items-center gap-1">
                      {linea.producto && (
                        <QuantityInput
                          value={linea.cantidad}
                          // Si hay más en el carrito que en stock, dejamos bajar pero no subir
                          max={Math.max(linea.stock, linea.cantidad)}
                          onChange={(c) => cambiarCantidad(linea.id_producto, c)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => quitar(linea.id_producto)}
                        className="grid size-11 place-items-center rounded-xl text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Quitar ${nombre}`}
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <aside className={`${card} h-fit p-6 lg:sticky lg:top-24`}>
          <h2 className="font-semibold">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <dt>Subtotal (sin IVA)</dt>
              <dd className="tabular-nums">{formatQuetzales(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-zinc-600">
              <dt>IVA (12 %)</dt>
              <dd className="tabular-nums">{formatQuetzales(impuesto)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatQuetzales(total)}</dd>
            </div>
          </dl>
          {hayProblemas ? (
            <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Corrige los productos marcados en rojo para continuar.
            </p>
          ) : (
            <Link to="/checkout" className={`${btn.brand} mt-6 w-full`}>
              Continuar con el pago
            </Link>
          )}
          <Link to="/" className={`${btn.ghost} mt-2 w-full`}>
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
