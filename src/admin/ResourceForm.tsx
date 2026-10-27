import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { AlertIcon, SpinnerIcon } from '../components/icons'
import { btn, input, label } from '../components/ui'
import { validarForm, type Campo, type ValoresForm } from './recurso'

interface ResourceFormProps {
  campos: Campo[]
  valoresIniciales: ValoresForm
  onSubmit: (valores: ValoresForm) => void
  onCancel: () => void
  isPending: boolean
  error: Error | null
  textoBoton: string
  /** Creando un registro nuevo (algunos campos solo son obligatorios al crear). */
  creando: boolean
}

/** Formulario que se arma solo a partir de la lista de campos de cada recurso. */
export function ResourceForm({
  campos,
  valoresIniciales,
  onSubmit,
  onCancel,
  isPending,
  error,
  textoBoton,
  creando,
}: ResourceFormProps) {
  const [valores, setValores] = useState(valoresIniciales)
  const [errores, setErrores] = useState<Record<string, string>>({})

  function cambiar(nombre: string, valor: string | boolean) {
    setValores((prev) => ({ ...prev, [nombre]: valor }))
    setErrores((prev) => ({ ...prev, [nombre]: '' }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos = validarForm(campos, valores, creando)
    setErrores(nuevos)
    if (Object.keys(nuevos).length === 0) onSubmit(valores)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.name} className={campo.completo || campo.tipo === 'textarea' ? 'sm:col-span-2' : ''}>
            <CampoInput
              campo={campo}
              valor={valores[campo.name]}
              error={errores[campo.name]}
              onChange={(v) => cambiar(campo.name, v)}
              disabled={isPending}
              creando={creando}
            />
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertIcon className="size-5 shrink-0" />
          {error.message}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
        <button type="button" onClick={onCancel} className={btn.secondary} disabled={isPending}>
          Cancelar
        </button>
        <button type="submit" className={btn.primary} disabled={isPending}>
          {isPending && <SpinnerIcon className="size-4" />}
          {textoBoton}
        </button>
      </div>
    </form>
  )
}

interface CampoInputProps {
  campo: Campo
  valor: string | boolean | undefined
  error?: string
  onChange: (valor: string | boolean) => void
  disabled: boolean
  creando: boolean
}

function CampoInput({ campo, valor, error, onChange, disabled, creando }: CampoInputProps) {
  const id = `campo-${campo.name}`
  const comunes = {
    id,
    name: campo.name,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : campo.ayuda ? `${id}-ayuda` : undefined,
  }
  const requerido = campo.requerido || (creando && campo.requeridoAlCrear)
  const etiqueta = (
    <>
      {campo.label}
      {requerido && <span className="text-red-600"> *</span>}
    </>
  )

  if (campo.tipo === 'checkbox') {
    return (
      <label className="flex h-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium">
        <input
          type="checkbox"
          {...comunes}
          checked={Boolean(valor)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-brand-600"
        />
        {etiqueta}
      </label>
    )
  }

  let control
  if (campo.tipo === 'textarea') {
    control = (
      <textarea
        {...comunes}
        rows={3}
        value={String(valor ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        className={`${input} h-auto py-2.5`}
      />
    )
  } else if (campo.tipo === 'lista') {
    control = (
      <select {...comunes} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} className={input}>
        {campo.valores?.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    )
  } else if (campo.tipo === 'password') {
    control = (
      <input
        {...comunes}
        type="password"
        autoComplete="new-password"
        value={String(valor ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={creando ? campo.placeholder : 'Déjala vacía para no cambiarla'}
        className={input}
      />
    )
  } else if (campo.tipo === 'select') {
    control = <SelectRemoto campo={campo} comunes={comunes} valor={String(valor ?? '')} onChange={onChange} />
  } else {
    const tipoHtml = { texto: 'text', email: 'email', tel: 'tel', entero: 'number', decimal: 'number', fecha: 'date' }[
      campo.tipo
    ]
    control = (
      <input
        {...comunes}
        type={tipoHtml}
        step={campo.tipo === 'decimal' ? '0.01' : campo.tipo === 'entero' ? '1' : undefined}
        min={campo.tipo === 'decimal' || campo.tipo === 'entero' ? 0 : undefined}
        inputMode={campo.tipo === 'decimal' ? 'decimal' : campo.tipo === 'entero' ? 'numeric' : undefined}
        value={String(valor ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        className={input}
      />
    )
  }

  return (
    <>
      <label htmlFor={id} className={label}>
        {etiqueta}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        campo.ayuda && (
          <p id={`${id}-ayuda`} className="mt-1.5 text-sm text-zinc-500">
            {campo.ayuda}
          </p>
        )
      )}
    </>
  )
}

function SelectRemoto({
  campo,
  comunes,
  valor,
  onChange,
}: {
  campo: Campo
  comunes: Record<string, unknown>
  valor: string
  onChange: (v: string) => void
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: campo.opciones?.queryKey ?? ['sin-opciones'],
    queryFn: ({ signal }) => campo.opciones?.queryFn(signal) ?? Promise.resolve([]),
  })

  return (
    <select {...comunes} value={valor} onChange={(e) => onChange(e.target.value)} className={input}>
      <option value="">{isPending ? 'Cargando…' : isError ? 'No se pudieron cargar las opciones' : '— Ninguno —'}</option>
      {data?.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  )
}
