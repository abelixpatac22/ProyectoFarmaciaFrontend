import type { ReactNode } from 'react'

const TONOS = {
  verde: 'bg-brand-50 text-brand-700 ring-brand-200',
  gris: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
}

export function Badge({ tono = 'gris', children }: { tono?: keyof typeof TONOS; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tono]}`}>
      {children}
    </span>
  )
}
