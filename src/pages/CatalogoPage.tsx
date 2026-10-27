import { useDeferredValue, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { AlertIcon, BoxIcon, RefreshIcon, SearchIcon } from '../components/icons'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductGridSkeleton'
import { StatusMessage } from '../components/StatusMessage'
import { btn, input } from '../components/ui'
import { useDelayedFlag } from '../hooks/useDelayedFlag'
import { useProductosActivos } from '../hooks/useProductos'
import { getPrecio, normalizar } from '../lib/producto'
import type { Producto } from '../types/models'

type Orden = 'nombre' | 'precio-asc' | 'precio-desc'

const ORDENES: Record<Orden, string> = {
  nombre: 'Nombre (A-Z)',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
}

const GARANTIAS = [
  ['Precios en quetzales', 'Con IVA incluido. El desglose aparece al pagar.'],
  ['Pago con tarjeta', 'El cobro se hace en la página segura de Stripe.'],
  ['Receta marcada', 'Los medicamentos que la piden lo dicen antes de comprar.'],
] as const

function ordenar(productos: Producto[], orden: Orden): Producto[] {
  const copia = [...productos]
  if (orden === 'nombre') {
    return copia.sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'))
  }
  // Los productos sin precio van al final en ambos sentidos
  const signo = orden === 'precio-asc' ? 1 : -1
  return copia.sort((a, b) => {
    const pa = getPrecio(a)
    const pb = getPrecio(b)
    if (pa === null) return 1
    if (pb === null) return -1
    return (pa - pb) * signo
  })
}

export function CatalogoPage() {
  const { data, isPending, error, refetch, isRefetching } = useProductosActivos()

  // La búsqueda y el orden viven en la URL (?q=...&orden=...): se pueden compartir y sobreviven a recargar.
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const ordenParam = searchParams.get('orden')
  const orden: Orden = ordenParam && ordenParam in ORDENES ? (ordenParam as Orden) : 'nombre'

  // useDeferredValue mantiene el input fluido aunque filtrar sea costoso
  const qDiferida = useDeferredValue(q)

  const productos = useMemo(() => {
    if (!data) return []
    const termino = normalizar(qDiferida)
    const filtrados = termino
      ? data.filter((p) => normalizar(`${p.nombre ?? ''} ${p.descripcion ?? ''}`).includes(termino))
      : data
    return ordenar(filtrados, orden)
  }, [data, qDiferida, orden])

  // El backend en Render (plan gratis) se duerme: la primera petición puede tardar ~50 s.
  const cargaLenta = useDelayedFlag(isPending, 4000)

  function actualizarParam(clave: string, valor: string, valorPorDefecto = '') {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (valor === valorPorDefecto) next.delete(clave)
        else next.set(clave, valor)
        return next
      },
      // preventScrollReset: buscar u ordenar no debe subir la página (ScrollRestoration lo haría en cada letra)
      { replace: true, preventScrollReset: true },
    )
  }

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-14 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:items-end lg:px-8 lg:pt-24 lg:pb-20">
          <div className="lg:col-span-7">
            <h1 className="text-[clamp(2.25rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.03em] text-balance">
              Tu salud, a un clic de distancia.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty">
              Medicamentos y productos de cuidado personal con precios en quetzales y pago seguro con tarjeta.
            </p>
          </div>
          {/* Lo que la tienda realmente hace, para quien desconfía de comprar medicina en línea */}
          <dl className="grid gap-6 sm:grid-cols-3 lg:col-span-4 lg:col-start-9 lg:grid-cols-1">
            {GARANTIAS.map(([titulo, texto]) => (
              <div key={titulo}>
                <dt className="font-semibold">{titulo}</dt>
                <dd className="mt-1 text-ink-soft">{texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8" aria-labelledby="titulo-catalogo">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="titulo-catalogo" className="text-3xl tracking-tight">
              Catálogo
            </h2>
            <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
              {isPending
                ? 'Cargando productos…'
                : data
                  ? `${productos.length} de ${data.length} productos`
                  : ' '}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Buscar productos</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-ink-soft" />
              <input
                type="search"
                value={q}
                onChange={(e) => actualizarParam('q', e.target.value)}
                placeholder="Buscar medicamento…"
                disabled={!data}
                className={`${input} pl-10 sm:w-72`}
              />
            </label>
            <label className="block">
              <span className="sr-only">Ordenar por</span>
              <select
                value={orden}
                onChange={(e) => actualizarParam('orden', e.target.value, 'nombre')}
                disabled={!data}
                className={`${input} sm:w-auto`}
              >
                {Object.entries(ORDENES).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {isPending ? (
          <div aria-busy="true">
            {cargaLenta && (
              <p className="mb-5 rounded-box bg-amber-50 px-4 py-3 text-sm text-amber-900">
                El servidor se está despertando, esto puede tardar hasta un minuto la primera vez…
              </p>
            )}
            <ProductGridSkeleton />
          </div>
        ) : !data ? (
          // Sin datos y sin carga = falló. Si ya había datos y solo falló un refresco
          // en segundo plano, seguimos mostrando los datos viejos en vez del error.
          <StatusMessage
            tone="danger"
            icon={<AlertIcon />}
            title="No pudimos cargar los productos"
            description={
              error instanceof ApiError && error.status === 0
                ? 'Parece que el servidor no está disponible o no tienes conexión. Inténtalo de nuevo en un momento.'
                : (error?.message ?? 'Error desconocido.')
            }
            action={
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className={btn.primary}
              >
                <RefreshIcon className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Reintentando…' : 'Reintentar'}
              </button>
            }
          />
        ) : data.length === 0 ? (
          <StatusMessage
            icon={<BoxIcon />}
            title="Todavía no hay productos"
            description="Cuando la farmacia agregue productos al inventario aparecerán aquí."
          />
        ) : productos.length === 0 ? (
          <StatusMessage
            icon={<SearchIcon />}
            title={`Sin resultados para “${q}”`}
            description="Revisa la ortografía o prueba con el nombre genérico del medicamento."
            action={
              <button
                type="button"
                onClick={() => actualizarParam('q', '')}
                className={btn.secondary}
              >
                Limpiar búsqueda
              </button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((producto, i) => (
              // Las primeras tarjetas entran en cascada (40 ms entre una y otra, máximo 8 pasos)
              <li
                key={producto.id_producto}
                className="flex animate-rise"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <ProductCard producto={producto} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
