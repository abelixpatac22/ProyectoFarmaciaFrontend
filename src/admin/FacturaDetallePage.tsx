import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { getFactura } from '../api/facturas'
import { Badge } from '../components/Badge'
import { AlertIcon, ArrowLeftIcon, SearchIcon } from '../components/icons'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn, card } from '../components/ui'
import { formatFecha, formatQuetzales, toNumber } from '../lib/format'
import { estadoFacturaTono, facturaKeys } from './facturas'

const q = (valor: string | null) => formatQuetzales(toNumber(valor) ?? 0)

export function FacturaDetallePage() {
  const id = Number(useParams().id)
  const { data: f, isPending, error, refetch } = useQuery({
    queryKey: facturaKeys.detalle(id),
    queryFn: ({ signal }) => getFactura(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })

  const volver = (
    <Link to="/admin/facturas" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 print:hidden">
      <ArrowLeftIcon className="size-4" />
      Facturas
    </Link>
  )

  if (!Number.isInteger(id) || id <= 0 || (error instanceof ApiError && error.status === 404)) {
    return <StatusMessage icon={<SearchIcon />} title="Esta factura no existe" action={volver} />
  }
  if (isPending) return <PageSpinner />
  if (!f) {
    return (
      <StatusMessage
        tone="danger"
        icon={<AlertIcon />}
        title="No se pudo cargar la factura"
        description={error?.message}
        action={
          <button type="button" onClick={() => refetch()} className={btn.primary}>
            Reintentar
          </button>
        }
      />
    )
  }

  return (
    <div className="max-w-4xl">
      {volver}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Factura {f.numero_factura ?? `#${f.id_factura}`}</h1>
          <p className="mt-1 text-sm text-zinc-500">{formatFecha(f.fecha)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tono={estadoFacturaTono(f.estado_factura)}>{f.estado_factura ?? '—'}</Badge>
          <button type="button" onClick={() => window.print()} className={`${btn.secondary} print:hidden`}>
            Imprimir
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Cliente</p>
          <p className="mt-2 font-medium">
            {f.cliente ? [f.cliente.nombre, f.cliente.apellido].filter(Boolean).join(' ') : '—'}
          </p>
          <p className="text-sm text-zinc-500">NIT {f.cliente?.nit ?? '—'}</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Atendió</p>
          <p className="mt-2 font-medium">{f.empleado?.nombre ?? 'Venta en línea'}</p>
          <p className="text-sm text-zinc-500">{f.empleado?.puesto ?? '—'}</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Pago</p>
          <p className="mt-2 font-medium">{f.metodo_pago ?? '—'}</p>
          <p className="text-sm text-zinc-500">ID interno {f.id_factura}</p>
        </div>
      </div>

      <div className={`${card} mt-4 overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {f.detalle_facturas.map((d) => (
              <tr key={d.id_detalle}>
                <td className="px-4 py-3 font-medium">{d.producto?.nombre ?? `Producto #${d.id_producto}`}</td>
                <td className="px-4 py-3 text-right tabular-nums">{d.cantidad ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{q(d.precio_unitario)}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{q(d.subtotal_linea)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-200 text-sm">
            <tr>
              <td colSpan={3} className="px-4 pt-3 text-right text-zinc-500">Subtotal</td>
              <td className="px-4 pt-3 text-right tabular-nums">{q(f.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-1 text-right text-zinc-500">IVA</td>
              <td className="px-4 py-1 text-right tabular-nums">{q(f.impuesto)}</td>
            </tr>
            <tr className="text-base font-bold">
              <td colSpan={3} className="px-4 pb-4 text-right">Total</td>
              <td className="px-4 pb-4 text-right tabular-nums">{q(f.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
