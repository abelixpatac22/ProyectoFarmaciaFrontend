import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'
import { getLotes, registrarEntrada, retirarLote } from '../api/lotes'
import { productosApi } from '../api/productos'
import { Badge } from '../components/Badge'
import { AlertIcon, BoxIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn, card, input } from '../components/ui'
import { productoKeys } from '../hooks/useProductos'
import { formatFecha } from '../lib/format'
import { normalizar } from '../lib/producto'
import type { LoteConProducto } from '../types/models'
import { ALERTA, alertaLote, loteKeys, textoDias, type Alerta } from './lotes'
import { Modal } from './Modal'
import { aValoresForm, type Campo } from './recurso'
import { ResourceForm } from './ResourceForm'

// Campos del formulario "Registrar entrada": los mismos nombres que espera POST /api/lotes
const camposEntrada: Campo[] = [
  {
    name: 'id_producto',
    label: 'Producto',
    tipo: 'select',
    requerido: true,
    completo: true,
    opciones: {
      queryKey: [...productoKeys.all, 'opciones-lote'],
      queryFn: async (signal) =>
        (await productosApi.listarActivos(signal)).map((p) => ({
          value: p.id_producto,
          label: p.nombre ?? `Producto #${p.id_producto}`,
        })),
    },
  },
  { name: 'numero_lote', label: 'Número de lote', tipo: 'texto', requerido: true, placeholder: 'Viene impreso en la caja' },
  { name: 'cantidad', label: 'Cantidad que llegó', tipo: 'entero', requerido: true },
  {
    name: 'fecha_vencimiento',
    label: 'Fecha de vencimiento',
    tipo: 'fecha',
    requerido: true,
    completo: true,
    ayuda: 'El día que vence ya no se vende en la tienda.',
  },
]

const camposRetiro: Campo[] = [
  {
    name: 'motivo',
    label: 'Motivo',
    tipo: 'lista',
    completo: true,
    valores: [
      { value: 'Vencido', label: 'Vencido' },
      { value: 'Dañado', label: 'Dañado o en mal estado' },
      { value: 'Retiro del fabricante', label: 'Retiro del fabricante' },
      { value: 'Otro', label: 'Otro' },
    ],
  },
]

type Filtro = 'activos' | 'vencido' | 'urgente' | 'atencion' | 'retirados' | 'todos'

const FILTROS: Array<{ id: Filtro; texto: string; cumple: (a: Alerta) => boolean }> = [
  { id: 'activos', texto: 'Con unidades', cumple: (a) => a !== 'agotado' && a !== 'retirado' },
  { id: 'vencido', texto: 'Vencidos', cumple: (a) => a === 'vencido' },
  { id: 'urgente', texto: 'Vencen en 30 días', cumple: (a) => a === 'urgente' },
  { id: 'atencion', texto: 'Vencen en 90 días', cumple: (a) => a === 'atencion' },
  { id: 'retirados', texto: 'Retirados', cumple: (a) => a === 'retirado' },
  { id: 'todos', texto: 'Todos', cumple: () => true },
]

export function LotesPage() {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [busqueda, setBusqueda] = useState('')
  const termino = normalizar(useDeferredValue(busqueda))
  const [entradaAbierta, setEntradaAbierta] = useState(false)
  const [aRetirar, setARetirar] = useState<LoteConProducto | null>(null)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: loteKeys.all,
    queryFn: ({ signal }) => getLotes(signal),
  })

  // Un lote cambia el stock: se refrescan los lotes y también los productos (panel y tienda)
  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: loteKeys.all }),
      queryClient.invalidateQueries({ queryKey: productoKeys.all }),
    ])

  const entrada = useMutation({
    mutationFn: (v: Record<string, string | boolean>) =>
      registrarEntrada({
        id_producto: Number(v.id_producto),
        numero_lote: String(v.numero_lote).trim(),
        fecha_vencimiento: String(v.fecha_vencimiento),
        cantidad: Number(v.cantidad),
      }),
    onSuccess: async () => {
      await refrescar()
      setEntradaAbierta(false)
    },
  })

  const retiro = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => retirarLote(id, motivo),
    onSuccess: async () => {
      await refrescar()
      setARetirar(null)
    },
  })

  // Cuántos lotes hay en cada filtro (para los números de los botones)
  const conteos = useMemo(() => {
    const alertas = (data ?? []).map(alertaLote)
    return Object.fromEntries(FILTROS.map((f) => [f.id, alertas.filter(f.cumple).length])) as Record<Filtro, number>
  }, [data])

  const lotes = useMemo(() => {
    const cumple = FILTROS.find((f) => f.id === filtro)!.cumple
    return (data ?? []).filter(
      (l) =>
        cumple(alertaLote(l)) &&
        (!termino || normalizar(`${l.producto?.nombre} ${l.producto?.codigo_barras} ${l.numero_lote}`).includes(termino)),
    )
  }, [data, filtro, termino])

  const unidadesVencidas = (data ?? [])
    .filter((l) => alertaLote(l) === 'vencido')
    .reduce((suma, l) => suma + l.cantidad_actual, 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lotes y vencimientos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cada entrada de mercadería es un lote. Se vende primero el que vence primero.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            entrada.reset()
            setEntradaAbierta(true)
          }}
          className={btn.primary}
        >
          <PlusIcon className="size-4" />
          Registrar entrada
        </button>
      </div>

      {unidadesVencidas > 0 && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-box border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertIcon className="mt-0.5 size-5 shrink-0" />
          <p>
            Hay <strong>{unidadesVencidas} unidades vencidas</strong> en {conteos.vencido}{' '}
            {conteos.vencido === 1 ? 'lote' : 'lotes'}. Ya no se venden en la tienda: retíralas del estante y
            márcalas como retiradas.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar lotes">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`h-9 rounded-full px-3.5 text-sm font-medium transition ${filtro === f.id ? 'bg-ink text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 ring-inset hover:bg-zinc-50'}`}
            >
              {f.texto}
              {data && <span className={`ml-1.5 tabular-nums ${filtro === f.id ? 'text-white/70' : 'text-zinc-400'}`}>{conteos[f.id]}</span>}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Buscar lotes</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Producto o número de lote…"
            className={`${input} pl-10 sm:w-72`}
          />
        </label>
      </div>

      <div className={`${card} mt-4 overflow-hidden`}>
        {isPending ? (
          <PageSpinner />
        ) : !data ? (
          <StatusMessage
            tone="danger"
            icon={<AlertIcon />}
            title="No se pudieron cargar los lotes"
            description={error?.message}
            action={
              <button type="button" onClick={() => refetch()} className={btn.primary}>
                Reintentar
              </button>
            }
          />
        ) : lotes.length === 0 ? (
          <StatusMessage
            icon={<BoxIcon />}
            title={data.length === 0 ? 'Todavía no hay lotes' : 'No hay lotes en este filtro'}
            description={data.length === 0 ? 'Registra la primera entrada de mercadería.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Quedan</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lotes.map((l) => {
                  const alerta = ALERTA[alertaLote(l)]
                  const retirado = l.estado === 'Retirado'
                  return (
                    <tr key={l.id_lote} className={retirado ? 'text-zinc-500' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{l.producto?.nombre ?? `Producto #${l.id_producto}`}</p>
                        <p className="text-xs text-zinc-500">Ingresó {formatFecha(l.fecha_ingreso, true)}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{l.numero_lote}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p>{formatFecha(l.fecha_vencimiento, true)}</p>
                        {!retirado && <p className="text-xs text-zinc-500">{textoDias(l.fecha_vencimiento)}</p>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                        {retirado ? (
                          <span title="Unidades dadas de baja">−{l.cantidad_retirada}</span>
                        ) : (
                          <>
                            <span className="font-semibold">{l.cantidad_actual}</span>
                            <span className="text-zinc-400"> de {l.cantidad_inicial}</span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tono={alerta.tono}>{alerta.texto}</Badge>
                        {retirado && l.motivo_retiro && (
                          <p className="mt-1 text-xs">
                            {l.motivo_retiro} · {formatFecha(l.fecha_retiro, true)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!retirado && l.cantidad_actual > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              retiro.reset()
                              setARetirar(l)
                            }}
                            className={`${btn.ghost} ${alertaLote(l) === 'vencido' ? 'text-red-700 hover:bg-red-50 hover:text-red-800' : ''}`}
                          >
                            Retirar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={entradaAbierta} title="Registrar entrada de mercadería" onClose={() => !entrada.isPending && setEntradaAbierta(false)}>
        {entradaAbierta && (
          <ResourceForm
            campos={camposEntrada}
            valoresIniciales={aValoresForm(camposEntrada)}
            onSubmit={(v) => entrada.mutate(v)}
            onCancel={() => setEntradaAbierta(false)}
            isPending={entrada.isPending}
            error={entrada.error}
            textoBoton="Registrar entrada"
            creando
          />
        )}
      </Modal>

      <Modal
        open={aRetirar !== null}
        title={`Retirar lote ${aRetirar?.numero_lote ?? ''}`}
        onClose={() => !retiro.isPending && setARetirar(null)}
      >
        {aRetirar && (
          <div className="space-y-5">
            <p className="text-sm text-zinc-600">
              Se darán de baja las <strong className="text-ink">{aRetirar.cantidad_actual} unidades</strong> que quedan de{' '}
              <strong className="text-ink">{aRetirar.producto?.nombre}</strong> y saldrán del stock. Esto no se puede deshacer.
            </p>
            <ResourceForm
              key={aRetirar.id_lote}
              campos={camposRetiro}
              valoresIniciales={aValoresForm(camposRetiro)}
              onSubmit={(v) => retiro.mutate({ id: aRetirar.id_lote, motivo: String(v.motivo) })}
              onCancel={() => setARetirar(null)}
              isPending={retiro.isPending}
              error={retiro.error}
              textoBoton="Retirar lote"
              creando
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
