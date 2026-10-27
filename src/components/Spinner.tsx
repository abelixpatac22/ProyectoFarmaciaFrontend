import { SpinnerIcon } from './icons'

export function PageSpinner({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-zinc-500">
      <SpinnerIcon className="size-5" />
      {texto}
    </div>
  )
}
