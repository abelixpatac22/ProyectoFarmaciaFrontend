import { useRouteError } from 'react-router'
import { AlertIcon } from '../components/icons'
import { StatusMessage } from '../components/StatusMessage'

/** Red de seguridad: si un componente lanza un error al renderizar, se muestra esto en vez de una pantalla en blanco. */
export function RouteErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <StatusMessage
      tone="danger"
      icon={<AlertIcon />}
      title="Algo salió mal"
      description="Ocurrió un error inesperado. Recarga la página para intentarlo de nuevo."
      action={
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Recargar
        </button>
      }
    />
  )
}
