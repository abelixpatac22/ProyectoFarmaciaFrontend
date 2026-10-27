import type { ReactNode } from 'react'

interface StatusMessageProps {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'danger'
}

/** Bloque centrado para los estados de error y vacío: misma estructura, distinto tono. */
export function StatusMessage({ icon, title, description, action, tone = 'neutral' }: StatusMessageProps) {
  const iconStyles =
    tone === 'danger' ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-brand-50 text-brand-700 ring-brand-100'

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
    >
      <div className={`grid size-14 place-items-center rounded-2xl ring-8 ${iconStyles} [&>svg]:size-7`}>{icon}</div>
      <h2 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
      {description && <p className="mt-2 text-pretty text-zinc-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
