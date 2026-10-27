import { MinusIcon, PlusIcon } from './icons'

interface QuantityInputProps {
  value: number
  max: number
  onChange: (value: number) => void
  min?: number
}

export function QuantityInput({ value, max, onChange, min = 1 }: QuantityInputProps) {
  const cambiar = (nuevo: number) => onChange(Math.min(Math.max(nuevo, min), Math.max(max, min)))

  return (
    <div className="inline-flex h-11 items-center rounded-xl border border-zinc-300 bg-white shadow-xs">
      <button
        type="button"
        onClick={() => cambiar(value - 1)}
        disabled={value <= min}
        className="grid size-11 place-items-center text-zinc-600 transition hover:text-zinc-900 disabled:opacity-30"
        aria-label="Quitar uno"
      >
        <MinusIcon className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => cambiar(Number(e.target.value) || min)}
        className="w-10 [appearance:textfield] bg-transparent text-center text-sm font-semibold tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Cantidad"
      />
      <button
        type="button"
        onClick={() => cambiar(value + 1)}
        disabled={value >= max}
        className="grid size-11 place-items-center text-zinc-600 transition hover:text-zinc-900 disabled:opacity-30"
        aria-label="Agregar uno"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  )
}
