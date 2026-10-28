import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useCart } from '../cart/useCart'
import { AlertIcon, ArrowLeftIcon, CartIcon, CheckIcon, RecetaIcon, SearchIcon } from '../components/icons'
import { ProductImage } from '../components/ProductImage'
import { QuantityInput } from '../components/QuantityInput'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn } from '../components/ui'
import { useProducto } from '../hooks/useProductos'
import { desglosarIva, redondear } from '../lib/dinero'
import { formatQuetzales } from '../lib/format'
import { getEstadoStock, getPrecio, getStockVendible, STOCK_LABEL } from '../lib/producto'

export function ProductoPage() {
  // useParams lee la parte variable de la ruta "/productos/:id". Siempre llega como texto.
  const { id } = useParams()
  const idNumero = Number(id)
  const { data: producto, isPending, error, refetch } = useProducto(idNumero)
  const { items, agregar } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const volver = (
    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
      <ArrowLeftIcon className="size-4" />
      Volver al catálogo
    </Link>
  )

  // Un id que no es número (por ejemplo /productos/abc) es lo mismo que un producto inexistente
  const noExiste =
    !Number.isInteger(idNumero) ||
    idNumero <= 0 ||
    (error instanceof ApiError && error.status === 404) ||
    producto?.estado === false

  if (noExiste) {
    return (
      <StatusMessage
        icon={<SearchIcon />}
        title="Este producto no existe"
        description="Puede que lo hayan retirado del catálogo."
        action={volver}
      />
    )
  }

  if (isPending) return <PageSpinner texto="Cargando producto…" />

  if (!producto) {
    return (
      <StatusMessage
        tone="danger"
        icon={<AlertIcon />}
        title="No pudimos cargar el producto"
        description={error?.message}
        action={
          <button type="button" onClick={() => refetch()} className={btn.primary}>
            Reintentar
          </button>
        }
      />
    )
  }

  const nombre = producto.nombre?.trim() || 'Producto sin nombre'
  const precio = getPrecio(producto)
  const estadoStock = getEstadoStock(producto)
  const stock = getStockVendible(producto)
  const enCarrito = items.find((i) => i.id_producto === producto.id_producto)?.cantidad ?? 0
  const disponibles = Math.max(stock - enCarrito, 0)
  const puedeAgregar = precio !== null && disponibles > 0

  function handleAgregar() {
    agregar(producto!.id_producto, cantidad)
    setCantidad(1)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const cantidadVisible = Math.min(cantidad, disponibles)
  const desglose = precio !== null && puedeAgregar ? desglosarIva(redondear(precio * cantidadVisible)) : null

  return (
    <div className="bg-white lg:grid lg:grid-cols-2">
      {/* El empaque se queda quieto mientras la información corre a su lado */}
      <div className="h-[38svh] min-h-64 lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:max-h-none">
        <ProductImage
          id={producto.id_producto}
          nombre={nombre}
          imagen={producto.imagen_url}
          presentacion={producto.descripcion}
          codigo={producto.codigo_barras}
          stage
        />
      </div>

      <div className="px-4 pt-6 pb-16 sm:px-10 lg:px-14 lg:pt-12 lg:pb-24">
        <div className="max-w-xl">
          {volver}

          <h1 className="mt-8 text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.03em] text-balance">{nombre}</h1>
          <p className="mt-4 text-xl text-pretty">
            {producto.descripcion || (producto.requiere_receta ? 'Medicamento con receta médica' : 'Venta libre')}
          </p>

          <p className="mt-8 text-5xl tracking-tight tabular-nums">
            {precio !== null ? formatQuetzales(precio) : 'Precio no disponible'}
          </p>
          <p className="mt-2 text-sm text-ink-soft">Precio por unidad, con IVA incluido</p>

          {producto.requiere_receta && (
            <div className="mt-8 flex gap-3 rounded-box bg-amber-50 p-4 text-amber-900">
              <RecetaIcon className="mt-0.5 size-5 shrink-0" />
              <p>
                <strong className="font-semibold">Requiere receta médica.</strong> Deberás presentarla al recoger o
                recibir tu pedido.
              </p>
            </div>
          )}

          <p className={`mt-8 text-sm font-semibold ${STOCK_LABEL[estadoStock].clase}`}>
            {STOCK_LABEL[estadoStock].texto}
            {estadoStock !== 'agotado' && <span className="font-normal text-ink-soft"> · {stock} en existencia</span>}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {puedeAgregar && <QuantityInput value={cantidadVisible} max={disponibles} onChange={setCantidad} />}
            <button type="button" onClick={handleAgregar} disabled={!puedeAgregar} className={`${btn.brand} flex-1 sm:flex-none`}>
              {agregado ? <CheckIcon key="ok" className="size-4 animate-bump" /> : <CartIcon className="size-4" />}
              {agregado ? 'Agregado' : 'Agregar al carrito'}
            </button>
          </div>

          {/* Lo mismo que dirá la factura: el IVA ya va dentro del precio, aquí solo se desglosa */}
          {desglose && (
            <dl className="mt-4 max-w-sm space-y-1.5 rounded-box bg-paper p-4 text-sm tabular-nums" aria-live="polite">
              <div className="flex justify-between gap-4 text-ink-soft">
                <dt>Subtotal sin IVA</dt>
                <dd>{formatQuetzales(desglose.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-ink-soft">
                <dt>IVA (12 %)</dt>
                <dd>{formatQuetzales(desglose.impuesto)}</dd>
              </div>
              <div className="flex justify-between gap-4 pt-1.5 text-base font-semibold">
                <dt>
                  Total por {cantidadVisible} {cantidadVisible === 1 ? 'unidad' : 'unidades'}
                </dt>
                <dd>{formatQuetzales(desglose.total)}</dd>
              </div>
            </dl>
          )}

          {enCarrito > 0 && (
            <p className="mt-4 text-sm">
              Tienes {enCarrito} en tu carrito.{' '}
              <Link to="/carrito" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                Ver carrito
              </Link>
            </p>
          )}
          {!puedeAgregar && enCarrito > 0 && disponibles === 0 && (
            <p className="mt-1 text-sm text-ink-soft">Ya agregaste todas las unidades disponibles.</p>
          )}

          <dl className="mt-14 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            {producto.codigo_barras && (
              <>
                <dt className="text-ink-soft">Código de barras</dt>
                <dd className="tabular-nums">{producto.codigo_barras}</dd>
              </>
            )}
            <dt className="text-ink-soft">Venta</dt>
            <dd>{producto.requiere_receta ? 'Con receta médica' : 'Libre'}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}
