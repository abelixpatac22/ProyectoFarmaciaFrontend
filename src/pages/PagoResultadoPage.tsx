import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FACTURA_PENDIENTE_KEY } from '../api/checkout'
import { cancelarPago, confirmarPago } from '../api/pagos'
import { useCart } from '../cart/useCart'
import { CheckIcon, XIcon } from '../components/icons'
import { StatusMessage } from '../components/StatusMessage'
import { btn } from '../components/ui'
import { productoKeys } from '../hooks/useProductos'
import { formatQuetzales } from '../lib/format'

function leerFacturaPendiente(): { id_factura: number; total: number; id_sesion?: string } | null {
  try {
    return JSON.parse(sessionStorage.getItem(FACTURA_PENDIENTE_KEY) ?? 'null')
  } catch {
    return null
  }
}

/** Stripe redirige aquí después de pagar (success_url = <frontend>/pago/exitoso). */
export function PagoExitosoPage() {
  const { vaciar } = useCart()
  const queryClient = useQueryClient()
  // useState con función: se lee una sola vez al montar
  const [factura] = useState(leerFacturaPendiente)

  useEffect(() => {
    vaciar()
    sessionStorage.removeItem(FACTURA_PENDIENTE_KEY)
    // El backend confirma con Stripe que sí se pagó y marca la factura como Pagada
    if (factura?.id_sesion) confirmarPago(factura.id_sesion).catch(() => {})
    // El stock cambió: marcamos los productos como desactualizados para que se vuelvan a pedir
    queryClient.invalidateQueries({ queryKey: productoKeys.all })
  }, [factura, vaciar, queryClient])

  return (
    <StatusMessage
      icon={<CheckIcon />}
      title="¡Pago completado!"
      description={
        factura ? (
          <>
            Tu pedido <strong>#{factura.id_factura}</strong> por <strong>{formatQuetzales(factura.total)}</strong> fue
            pagado. Recibirás el comprobante de Stripe en tu correo.
          </>
        ) : (
          'Gracias por tu compra. Recibirás el comprobante de Stripe en tu correo.'
        )
      }
      action={
        <Link to="/" className={btn.primary}>
          Seguir comprando
        </Link>
      }
    />
  )
}

/** Stripe redirige aquí si el cliente cancela (cancel_url = <frontend>/pago/cancelado). */
export function PagoCanceladoPage() {
  const queryClient = useQueryClient()
  const [factura] = useState(leerFacturaPendiente)

  useEffect(() => {
    sessionStorage.removeItem(FACTURA_PENDIENTE_KEY)
    if (!factura?.id_sesion) return
    // El backend cancela la factura y devuelve al inventario el stock que había apartado
    cancelarPago(factura.id_sesion)
      .then(() => queryClient.invalidateQueries({ queryKey: productoKeys.all }))
      .catch(() => {})
  }, [factura, queryClient])

  return (
    <StatusMessage
      tone="danger"
      icon={<XIcon />}
      title="El pago fue cancelado"
      description="No se realizó ningún cobro. Tus productos siguen en el carrito por si quieres intentarlo de nuevo."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/carrito" className={btn.primary}>
            Volver al carrito
          </Link>
          <Link to="/" className={btn.secondary}>
            Ir al catálogo
          </Link>
        </div>
      }
    />
  )
}
