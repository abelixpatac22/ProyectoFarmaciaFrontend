import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getFacturas } from '../api/facturas'
import { Badge } from '../components/Badge'
import { AlertIcon, BoxIcon, SearchIcon } from '../components/icons'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn, card, input } from '../components/ui'
import { formatFecha, formatQuetzales, toNumber } from '../lib/format'
import { normalizar } from '../lib/producto'
import { estadoFacturaTono, facturaKeys } from './facturas'

export function FacturasPage() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const termino = normalizar(useDeferredValue(busqueda))
  const { data, isPending, error, refetch } = useQuery({
    queryKey: facturaKeys.all,
    queryFn: ({ signal }) => getFacturas(signal),
  })

  // Las más recientes primero
  const facturas = useMemo(
    () =>
      (data ?? [])
        .filter(
          (f) =>
            !termino ||
            normalizar(`${f.numero_factura} ${f.id_factura} ${f.cliente?.nombre} ${f.cliente?.apellido} ${f.cliente?.nit}`).includes(termino),
        )
        .sort((a, b) => b.id_factura - a.id_factura),
    [data, termino],
  )

  const totalVendido = facturas.reduce((suma, f) => suma + (toNumber(f.total) ?? 0), 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${facturas.length} facturas · ${formatQuetzales(totalVendido)} en total` : ' '}
          </p>
        </div>
        <label className="relative block">
          <span className="sr-only">Buscar facturas</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Número, cliente o NIT…"
            className={`${input} pl-10 sm:w-72`}
          />
        </label>
      </div>

      <div className={`${card} mt-6 overflow-hidden`}>
        {isPending ? (
          <PageSpinner />
        ) : !data ? (
          <StatusMessage
            tone="danger"
            icon={<AlertIcon />}
            title="No se pudieron cargar las facturas"
            description={error?.message}
            action={
              <button type="button" onClick={() => refetch()} className={btn.primary}>
                Reintentar
              </button>
            }
          />
        ) : facturas.length === 0 ? (
          <StatusMessage icon={<BoxIcon />} title={data.length === 0 ? 'Todavía no hay ventas' : 'Sin resultados'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {facturas.map((f) => (
                  <tr
                    key={f.id_factura}
                    onClick={() => navigate(`/admin/facturas/${f.id_factura}`)}
                    className="cursor-pointer transition hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {/* El enlace real es para teclado y lectores de pantalla; el clic en la fila es comodidad */}
                      <Link to={`/admin/facturas/${f.id_factura}`} className="hover:underline">
                        {f.numero_factura ?? `#${f.id_factura}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">{formatFecha(f.fecha)}</td>
                    <td className="px-4 py-3">
                      {f.cliente ? (
                        <>
                          {[f.cliente.nombre, f.cliente.apellido].filter(Boolean).join(' ')}
                          <span className="block text-xs text-zinc-500">NIT {f.cliente.nit ?? '—'}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{f.metodo_pago ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tono={estadoFacturaTono(f.estado_factura)}>{f.estado_factura ?? '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatQuetzales(toNumber(f.total) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
