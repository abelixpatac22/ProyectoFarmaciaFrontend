import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, Navigate } from 'react-router'
import { procesarCompra, type DatosComprador } from '../api/checkout'
import { ApiError } from '../api/client'
import { useCartLines } from '../cart/useCartLines'
import { AlertIcon, ArrowLeftIcon, LockIcon, SpinnerIcon } from '../components/icons'
import { ProductImage } from '../components/ProductImage'
import { PageSpinner } from '../components/Spinner'
import { btn, card, input, label } from '../components/ui'
import { desglosarIva } from '../lib/dinero'
import { formatQuetzales } from '../lib/format'

type Errores = Partial<Record<keyof DatosComprador, string>>

const VACIO: DatosComprador = { nit: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '' }

/** Validamos en el navegador para dar respuesta inmediata. El backend igual debe validar (nunca confíes en el frontend). */
function validar(datos: DatosComprador): Errores {
  const errores: Errores = {}
  if (!datos.nit.trim()) errores.nit = 'Escribe tu NIT o "CF".'
  else if (!/^(CF|[0-9]{1,12}-?[0-9K])$/i.test(datos.nit.trim().replace(/\s/g, '')))
    errores.nit = 'NIT inválido. Ejemplo: 1234567-8 o CF.'
  if (!datos.nombre.trim()) errores.nombre = 'Escribe tu nombre.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Escribe un correo válido.'
  return errores
}

export function CheckoutPage() {
  const { lineas, total, hayProblemas, isPending } = useCartLines()
  const [datos, setDatos] = useState<DatosComprador>(VACIO)
  const [errores, setErrores] = useState<Errores>({})

  // useMutation es el "useQuery" de las acciones que cambian datos (POST, PUT).
  // Nos da isPending y error sin manejar estados a mano.
  const compra = useMutation({
    mutationFn: () => procesarCompra(datos, lineas),
    // Stripe es otra página: salimos de nuestra app con una redirección normal
    onSuccess: ({ url }) => window.location.assign(url),
  })

  if (isPending) return <PageSpinner />
  // Navigate redirige mientras se renderiza: sin productos válidos no hay nada que pagar
  if (lineas.length === 0 || hayProblemas) return <Navigate to="/carrito" replace />

  const { subtotal, impuesto } = desglosarIva(total)

  function actualizar(campo: keyof DatosComprador, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault() // sin esto el navegador recarga la página
    const nuevosErrores = validar(datos)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return
    compra.mutate()
  }

  const errorCompra = compra.error
  const mensajeError =
    errorCompra instanceof ApiError && errorCompra.detalle ? errorCompra.detalle : errorCompra?.message

  // Pequeño componente local para no repetir label + input + error 6 veces
  const campo = (
    nombre: keyof DatosComprador,
    texto: string,
    props: InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label htmlFor={nombre} className={label}>
        {texto}
      </label>
      <input
        id={nombre}
        name={nombre}
        value={datos[nombre]}
        onChange={(e) => actualizar(nombre, e.target.value)}
        aria-invalid={errores[nombre] ? true : undefined}
        aria-describedby={errores[nombre] ? `${nombre}-error` : undefined}
        disabled={compra.isPending}
        className={input}
        {...props}
      />
      {errores[nombre] && (
        <p id={`${nombre}-error`} className="mt-1.5 text-sm text-red-600">
          {errores[nombre]}
        </p>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/carrito" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeftIcon className="size-4" />
        Volver al carrito
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Datos para tu factura</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} noValidate className={`${card} space-y-5 p-6 sm:p-8`}>
          <div className="grid gap-5 sm:grid-cols-2">
            {campo('nit', 'NIT', { placeholder: '1234567-8 o CF', autoComplete: 'off' })}
            {campo('email', 'Correo electrónico', { type: 'email', autoComplete: 'email', placeholder: 'tu@correo.com' })}
            {campo('nombre', 'Nombre', { autoComplete: 'given-name' })}
            {campo('apellido', 'Apellido (opcional)', { autoComplete: 'family-name' })}
            {campo('telefono', 'Teléfono (opcional)', { type: 'tel', autoComplete: 'tel' })}
            {campo('direccion', 'Dirección (opcional)', { autoComplete: 'street-address' })}
          </div>

          {mensajeError && (
            <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertIcon className="size-5 shrink-0" />
              <div>
                <p className="font-semibold">No se pudo completar la compra</p>
                <p className="mt-0.5">{mensajeError}</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={compra.isPending} className={`${btn.brand} h-12 w-full text-base`}>
            {compra.isPending ? <SpinnerIcon className="size-5" /> : <LockIcon className="size-5" />}
            {compra.isPending ? 'Procesando…' : `Pagar ${formatQuetzales(total)}`}
          </button>
          <p className="text-center text-xs text-zinc-500">
            Serás redirigido a Stripe para pagar con tarjeta de forma segura.
          </p>
        </form>

        <aside className={`${card} h-fit p-6`}>
          <h2 className="font-semibold">Tu pedido</h2>
          <ul className="mt-4 space-y-3">
            {lineas.map((l) => (
              <li key={l.id_producto} className="flex items-center gap-3 text-sm">
                <div className="w-12 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage id={l.id_producto} nombre={l.producto?.nombre ?? ''} imagen={l.producto?.imagen_url} compact />
                </div>
                <span className="flex-1 line-clamp-2">
                  {l.producto?.nombre} <span className="text-zinc-500">× {l.cantidad}</span>
                </span>
                <span className="font-medium tabular-nums">{formatQuetzales(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between text-zinc-600">
              <dt>Subtotal (sin IVA)</dt>
              <dd className="tabular-nums">{formatQuetzales(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-zinc-600">
              <dt>IVA (12 %)</dt>
              <dd className="tabular-nums">{formatQuetzales(impuesto)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatQuetzales(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
