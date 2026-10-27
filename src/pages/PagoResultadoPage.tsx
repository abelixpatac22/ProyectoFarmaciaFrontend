import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FACTURA_PENDIENTE_KEY } from '../api/checkout'
import { useCart } from '../cart/useCart'
import { CheckIcon, XIcon } from '../components/icons'
import { StatusMessage } from '../components/StatusMessage'
import { btn } from '../components/ui'
import { productoKeys } from '../hooks/useProductos'
import { formatQuetzales } from '../lib/format'

function leerFacturaPendiente(): { id_factura: number; total: number } | null {
  try {
    return JSON.parse(sessionStorage.getItem(FACTURA_PENDIENTE_KEY) ?? 'null')
  } catch {
    return null
  }
}

/**
 * Stripe redirige aquí cuando el backend configure success_url = <frontend>/pago/exitoso
 * (problema 6 del contrato; ver BACKEND-CAMBIOS.md).
 */
export function PagoExitosoPage() {
  const { vaciar } = useCart()
  const queryClient = useQueryClient()
  // useState con función: se lee una sola vez al montar
  const [factura] = useState(leerFacturaPendiente)

  useEffect(() => {
    vaciar()
    sessionStorage.removeItem(FACTURA_PENDIENTE_KEY)
    // El stock cambió: marcamos los productos como desactualizados para que se vuelvan a pedir
    queryClient.invalidateQueries({ queryKey: productoKeys.all })
  }, [vaciar, queryClient])

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

export function PagoCanceladoPage() {
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
