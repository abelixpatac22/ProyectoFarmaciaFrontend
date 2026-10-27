import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { cambiarPassword } from '../api/auth'
import { useSesion } from '../auth/useSesion'
import { AlertIcon, CheckIcon, SpinnerIcon } from '../components/icons'
import { btn, card, input, label } from '../components/ui'

const MINIMO = 8

type Campo = 'actual' | 'nueva' | 'confirmar'

export function CuentaPage() {
  const empleado = useSesion()
  const [valores, setValores] = useState<Record<Campo, string>>({ actual: '', nueva: '', confirmar: '' })
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({})

  const cambiar = useMutation({
    mutationFn: () => cambiarPassword(valores.actual, valores.nueva),
    onSuccess: () => setValores({ actual: '', nueva: '', confirmar: '' }),
  })

  function actualizar(campo: Campo, valor: string) {
    setValores((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
    if (cambiar.isSuccess || cambiar.isError) cambiar.reset()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos: Partial<Record<Campo, string>> = {}
    if (!valores.actual) nuevos.actual = 'Escribe tu contraseña actual.'
    if (valores.nueva.length < MINIMO) nuevos.nueva = `Debe tener al menos ${MINIMO} caracteres.`
    else if (valores.nueva === valores.actual) nuevos.nueva = 'Debe ser distinta de la actual.'
    if (valores.confirmar !== valores.nueva) nuevos.confirmar = 'No coincide con la nueva contraseña.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length === 0) cambiar.mutate()
  }

  if (!empleado) return null

  const nombre = [empleado.nombre, empleado.apellido].filter(Boolean).join(' ')

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>

      <dl className={`${card} mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 p-5 text-sm`}>
        <dt className="text-zinc-500">Nombre</dt>
        <dd className="font-medium">{nombre || '—'}</dd>
        <dt className="text-zinc-500">Correo</dt>
        <dd>{empleado.email ?? '—'}</dd>
        <dt className="text-zinc-500">Código</dt>
        <dd>{empleado.codigo_empleado ?? '—'}</dd>
        <dt className="text-zinc-500">Permisos</dt>
        <dd>{empleado.rol === 'admin' ? 'Administrador: todo el panel' : 'Empleado: todo menos gestionar empleados'}</dd>
      </dl>

      <h2 className="mt-10 text-lg font-semibold">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit} noValidate className={`${card} mt-4 space-y-4 p-5`}>
        {(
          [
            ['actual', 'Contraseña actual', 'current-password'],
            ['nueva', 'Nueva contraseña', 'new-password'],
            ['confirmar', 'Repite la nueva contraseña', 'new-password'],
          ] as const
        ).map(([campo, texto, autoComplete]) => (
          <div key={campo}>
            <label htmlFor={`cuenta-${campo}`} className={label}>
              {texto}
            </label>
            <input
              id={`cuenta-${campo}`}
              type="password"
              autoComplete={autoComplete}
              value={valores[campo]}
              onChange={(e) => actualizar(campo, e.target.value)}
              disabled={cambiar.isPending}
              aria-invalid={errores[campo] ? true : undefined}
              aria-describedby={errores[campo] ? `cuenta-${campo}-error` : campo === 'nueva' ? 'cuenta-nueva-ayuda' : undefined}
              className={input}
            />
            {errores[campo] ? (
              <p id={`cuenta-${campo}-error`} className="mt-1.5 text-sm text-red-700">
                {errores[campo]}
              </p>
            ) : (
              campo === 'nueva' && (
                <p id="cuenta-nueva-ayuda" className="mt-1.5 text-sm text-zinc-500">
                  Mínimo {MINIMO} caracteres.
                </p>
              )
            )}
          </div>
        ))}

        {cambiar.isError && (
          <div role="alert" className="flex gap-2 rounded-box bg-red-50 p-3 text-sm text-red-800">
            <AlertIcon className="size-5 shrink-0" />
            {cambiar.error.message}
          </div>
        )}
        {cambiar.isSuccess && (
          <p role="status" className="flex gap-2 rounded-box bg-brand-50 p-3 text-sm text-brand-900">
            <CheckIcon className="size-5 shrink-0" />
            Contraseña actualizada. Úsala la próxima vez que inicies sesión.
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={cambiar.isPending} className={btn.primary}>
            {cambiar.isPending && <SpinnerIcon className="size-4" />}
            Cambiar contraseña
          </button>
        </div>
      </form>
    </div>
  )
}
