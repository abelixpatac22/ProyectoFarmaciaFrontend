/**
 * Clases de Tailwind que se repiten en muchos lugares. Tenerlas aquí evita copiar y pegar
 * y asegura que todos los botones e inputs se vean igual.
 */

// Al presionar, el botón se encoge un poco: se siente que respondió aunque la acción tarde.
const press =
  'transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] disabled:active:scale-100'

export const btn = {
  primary: `inline-flex h-11 items-center justify-center gap-2 rounded-box bg-ink px-5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 ${press}`,
  brand: `inline-flex h-11 items-center justify-center gap-2 rounded-box bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50 ${press}`,
  secondary: `inline-flex h-11 items-center justify-center gap-2 rounded-box border border-zinc-300 bg-white px-5 text-sm font-semibold text-ink hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 ${press}`,
  ghost:
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-box px-3 text-sm font-medium text-ink-soft transition hover:bg-zinc-100 hover:text-ink disabled:opacity-50',
}

export const input =
  'h-11 w-full rounded-box border border-zinc-300 bg-white px-3.5 text-sm outline-none transition placeholder:text-zinc-500 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15'

export const label = 'mb-1.5 block text-sm font-medium text-ink'

export const card = 'rounded-box border border-zinc-200 bg-white'
