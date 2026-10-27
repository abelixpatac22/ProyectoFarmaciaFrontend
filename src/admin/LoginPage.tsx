import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { iniciarSesion } from '../api/auth'
import { ApiError } from '../api/client'
import { guardarSesion } from '../auth/sesion'
import { useSesion } from '../auth/useSesion'
import { AlertIcon, ArrowLeftIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from '../components/icons'
import { btn, input, label } from '../components/ui'
import { useDelayedFlag } from '../hooks/useDelayedFlag'

/** A dónde volver después de entrar: la página del panel que el empleado intentó abrir. */
interface EstadoLogin {
  desde?: string
}

export function LoginPage() {
  const empleado = useSesion()
  const navigate = useNavigate()
  const { state } = useLocation()
  const destino = (state as EstadoLogin | null)?.desde ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({})

  const login = useMutation({
    mutationFn: () => iniciarSesion(email, password),
    onSuccess: ({ token, empleado }) => {
      guardarSesion(token, empleado)
      navigate(destino, { replace: true })
    },
  })

  // Render gratis duerme el backend: la primera petición puede tardar hasta un minuto
  const cargaLenta = useDelayedFlag(login.isPending, 4000)

  // Ya tiene sesión (por ejemplo, volvió con el botón Atrás): directo al panel
  if (empleado && !login.isPending) return <Navigate to={destino} replace />

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nuevos = {
      email: email.trim() ? undefined : 'Escribe tu correo.',
      password: password ? undefined : 'Escribe tu contraseña.',
    }
    setErrores(nuevos)
    if (!nuevos.email && !nuevos.password) login.mutate()
  }

  const mensajeError =
    login.error instanceof ApiError && login.error.status === 0
      ? 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
      : login.error?.message

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      {/* El mismo cierre verde de la tienda, del lado izquierdo en pantallas grandes */}
      <div className="hidden flex-col justify-between bg-brand-900 p-12 text-brand-50 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 font-semibold">
          <img src="/favicon.svg" alt="" className="size-8 motion-safe:animate-logo-flip" />
          Farmacia
        </Link>
        <div>
          <p className="text-[clamp(3rem,7vw,6.5rem)] leading-none tracking-[-0.04em]">Panel de gestión</p>
          <p className="mt-6 max-w-sm text-lg text-brand-100">
            Productos, clientes, proveedores, empleados y facturas de la farmacia.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="size-4" />
          Ir a la tienda
        </Link>

        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-page-in">
          <img src="/favicon.svg" alt="" className="size-10 lg:hidden" />
          <h1 className="mt-6 text-4xl tracking-[-0.03em] lg:mt-0">Inicia sesión</h1>
          <p className="mt-3 text-ink-soft">Solo para empleados de la farmacia.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
            <div>
              <label htmlFor="login-email" className={label}>
                Correo
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrores((prev) => ({ ...prev, email: undefined }))
                }}
                disabled={login.isPending}
                aria-invalid={errores.email ? true : undefined}
                aria-describedby={errores.email ? 'login-email-error' : undefined}
                className={input}
              />
              {errores.email && (
                <p id="login-email-error" className="mt-1.5 text-sm text-red-700">
                  {errores.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className={label}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrores((prev) => ({ ...prev, password: undefined }))
                  }}
                  disabled={login.isPending}
                  aria-invalid={errores.password ? true : undefined}
                  aria-describedby={errores.password ? 'login-password-error' : undefined}
                  className={`${input} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-box text-ink-soft transition-colors hover:text-ink"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verPassword}
                >
                  {verPassword ? <EyeOffIcon className="size-4.5" /> : <EyeIcon className="size-4.5" />}
                </button>
              </div>
              {errores.password && (
                <p id="login-password-error" className="mt-1.5 text-sm text-red-700">
                  {errores.password}
                </p>
              )}
            </div>

            {mensajeError && (
              <div role="alert" className="flex gap-2 rounded-box bg-red-50 p-3 text-sm text-red-800">
                <AlertIcon className="size-5 shrink-0" />
                {mensajeError}
              </div>
            )}

            <button type="submit" disabled={login.isPending} className={`${btn.brand} w-full`}>
              {login.isPending && <SpinnerIcon className="size-4" />}
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </button>

            {cargaLenta && (
              <p role="status" className="rounded-box bg-amber-50 px-4 py-3 text-sm text-amber-900">
                El servidor se está despertando, esto puede tardar hasta un minuto la primera vez…
              </p>
            )}
          </form>
        </main>
      </div>
    </div>
  )
}
