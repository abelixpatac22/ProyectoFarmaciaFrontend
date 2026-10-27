import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'
import { useEsAdmin } from '../auth/useSesion'
import { Badge } from '../components/Badge'
import { AlertIcon, BoxIcon, EditIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageSpinner } from '../components/Spinner'
import { StatusMessage } from '../components/StatusMessage'
import { btn, card, input } from '../components/ui'
import { normalizar } from '../lib/producto'
import { Modal } from './Modal'
import { aCuerpo, aValoresForm, type ResourceConfig, type ValoresForm } from './recurso'
import { ResourceForm } from './ResourceForm'

type Filtro = 'activos' | 'inactivos' | 'todos'

/** Edición en curso: null = modal cerrado, { fila: null } = creando, { fila } = editando. */
type Edicion<T> = { fila: T | null } | null

export function ResourcePage<T>({ config }: { config: ResourceConfig<T> }) {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [busqueda, setBusqueda] = useState('')
  const busquedaDiferida = useDeferredValue(busqueda)
  const [edicion, setEdicion] = useState<Edicion<T>>(null)
  // Ocultar botones es solo una ayuda: el backend igual rechaza con 403 a quien no tenga permiso
  const esAdmin = useEsAdmin()
  const puedeEscribir = !config.soloAdminEscribe || esAdmin

  // En el panel pedimos TODOS (GET /), también los inactivos, y filtramos aquí
  const lista = useQuery({
    queryKey: [...config.queryKey, 'todos'],
    queryFn: ({ signal }) => config.api.listar(signal),
  })

  // Después de cualquier cambio invalidamos todo lo del recurso (así también se refresca el catálogo de la tienda)
  const refrescar = () => queryClient.invalidateQueries({ queryKey: config.queryKey })

  const guardar = useMutation({
    mutationFn: async (valores: ValoresForm) => {
      const cuerpo = aCuerpo(config.campos, valores) as Partial<T>
      if (edicion?.fila) await config.api.actualizar(config.getId(edicion.fila), cuerpo)
      else await config.api.crear(cuerpo)
    },
    onSuccess: async () => {
      await refrescar()
      setEdicion(null)
    },
  })

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: boolean }) => config.api.cambiarEstado(id, estado),
    onSuccess: refrescar,
    onError: (error) => alert(error.message),
  })

  const filas = useMemo(() => {
    const termino = normalizar(busquedaDiferida)
    return (lista.data ?? []).filter((fila) => {
      const activo = config.getEstado(fila) !== false
      if (filtro === 'activos' && !activo) return false
      if (filtro === 'inactivos' && activo) return false
      return !termino || normalizar(config.textoBusqueda(fila)).includes(termino)
    })
  }, [lista.data, filtro, busquedaDiferida, config])

  function abrir(fila: T | null) {
    guardar.reset() // limpia el error de un intento anterior
    setEdicion({ fila })
  }

  function toggleEstado(fila: T) {
    const activo = config.getEstado(fila) !== false
    if (activo && !confirm(`¿Desactivar "${config.getNombre(fila)}"? Dejará de aparecer en las listas activas.`)) return
    cambiarEstado.mutate({ id: config.getId(fila), estado: !activo })
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{config.titulo}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {lista.data ? `${filas.length} de ${lista.data.length} registros` : ' '}
          </p>
        </div>
        {puedeEscribir ? (
          <button type="button" onClick={() => abrir(null)} className={btn.primary}>
            <PlusIcon className="size-4" />
            Nuevo {config.singular}
          </button>
        ) : (
          <p className="text-sm text-zinc-500">Solo un administrador puede modificar {config.titulo.toLowerCase()}.</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-zinc-100 p-1 text-sm font-medium" role="group" aria-label="Filtrar por estado">
          {(['activos', 'inactivos', 'todos'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={`rounded-lg px-3.5 py-1.5 capitalize transition ${filtro === f ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Buscar</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className={`${input} pl-10 sm:w-72`}
          />
        </label>
      </div>

      <div className={`${card} mt-4 overflow-hidden`}>
        {lista.isPending ? (
          <PageSpinner />
        ) : lista.isError ? (
          <StatusMessage
            tone="danger"
            icon={<AlertIcon />}
            title="No se pudo cargar la lista"
            description={lista.error.message}
            action={
              <button type="button" onClick={() => lista.refetch()} className={btn.primary}>
                Reintentar
              </button>
            }
          />
        ) : filas.length === 0 ? (
          <StatusMessage
            icon={<BoxIcon />}
            title={lista.data.length === 0 ? `Todavía no hay ${config.titulo.toLowerCase()}` : 'Sin resultados'}
            description={
              lista.data.length === 0
                ? puedeEscribir
                  ? `Crea el primero con “Nuevo ${config.singular}”.`
                  : undefined
                : 'Prueba con otra búsqueda o filtro.'
            }
          />
        ) : (
          // overflow-x-auto: en el celular la tabla se desplaza de lado en vez de romper la página
          // relative: contiene el texto sr-only (position: absolute) de la tabla; sin esto se "escapa" y crea scroll lateral
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <tr>
                  {config.columnas.map((col) => (
                    <th key={col.header} scope="col" className={`px-4 py-3 whitespace-nowrap ${col.className ?? ''}`}>
                      {col.header}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filas.map((fila) => {
                  const activo = config.getEstado(fila) !== false
                  const id = config.getId(fila)
                  return (
                    <tr key={id} className={`transition hover:bg-zinc-50 ${activo ? '' : 'text-zinc-400'}`}>
                      {config.columnas.map((col) => (
                        <td key={col.header} className={`px-4 py-3 ${col.className ?? ''}`}>
                          {col.render(fila)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <Badge tono={activo ? 'verde' : 'gris'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex justify-end gap-1 ${puedeEscribir ? '' : 'hidden'}`}>
                          <button type="button" onClick={() => abrir(fila)} className={btn.ghost}>
                            <EditIcon className="size-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleEstado(fila)}
                            disabled={cambiarEstado.isPending && cambiarEstado.variables?.id === id}
                            className={btn.ghost}
                          >
                            {activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={edicion !== null}
        title={edicion?.fila ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}
        onClose={() => !guardar.isPending && setEdicion(null)}
      >
        {edicion && (
          <ResourceForm
            // key: al abrir otro registro el formulario se crea de nuevo con sus valores
            key={edicion.fila ? config.getId(edicion.fila) : 'nuevo'}
            campos={config.campos}
            valoresIniciales={aValoresForm(config.campos, edicion.fila)}
            onSubmit={(valores) => guardar.mutate(valores)}
            onCancel={() => setEdicion(null)}
            isPending={guardar.isPending}
            error={guardar.error}
            textoBoton={edicion.fila ? 'Guardar cambios' : `Crear ${config.singular}`}
            creando={!edicion.fila}
          />
        )}
      </Modal>
    </div>
  )
}
