import { Link } from 'react-router'
import { SearchIcon } from '../components/icons'
import { StatusMessage } from '../components/StatusMessage'

export function NotFoundPage() {
  return (
    <StatusMessage
      icon={<SearchIcon />}
      title="Página no encontrada"
      description="La dirección que buscas no existe o fue movida."
      action={
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Volver al catálogo
        </Link>
      }
    />
  )
}
