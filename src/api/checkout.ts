import type { CartLine } from '../cart/useCartLines'
import { desglosarIva } from '../lib/dinero'
import { registrarClienteCheckout } from './clientes'
import { crearFactura } from './facturas'
import { crearSesionPago } from './pagos'

export interface DatosComprador {
  nit: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
}

/** Guardamos la factura en curso para mostrarla en la página de pago exitoso o cancelado. */
export const FACTURA_PENDIENTE_KEY = 'farmacia:factura-pendiente'

/**
 * El flujo completo de compra, en orden:
 * 1. Cliente  2. Factura (descuenta stock)  3. Sesión de Stripe  -> devuelve la url para redirigir.
 */
export async function procesarCompra(comprador: DatosComprador, lineas: CartLine[]) {
  // El backend busca al cliente por NIT o lo crea (sin login, los compradores no tienen cuenta)
  const cliente = await registrarClienteCheckout({
    nit: comprador.nit,
    nombre: comprador.nombre,
    apellido: comprador.apellido || null,
    email: comprador.email,
    telefono: comprador.telefono || null,
    direccion: comprador.direccion || null,
  })

  // El backend recalcula precios y totales con su base de datos; estos valores solo sirven para
  // guardar el total que se muestra al volver de Stripe (son los mismos precios de useCartLines).
  const totalBruto = lineas.reduce((suma, l) => suma + l.subtotal, 0)
  const { subtotal, impuesto, total } = desglosarIva(totalBruto)

  const factura = await crearFactura({
    id_cliente: cliente.id_cliente,
    numero_factura: `WEB-${Date.now()}`,
    subtotal,
    impuesto,
    total,
    metodo_pago: 'Tarjeta',
    detalles: lineas.map((l) => ({
      id_producto: l.id_producto,
      cantidad: l.cantidad,
      precio_unitario: l.precio,
    })),
  })

  sessionStorage.setItem(FACTURA_PENDIENTE_KEY, JSON.stringify({ id_factura: factura.id_factura, total }))

  const { url } = await crearSesionPago({
    id_factura: factura.id_factura,
    total,
    email_cliente: comprador.email,
  })

  return { url, id_factura: factura.id_factura }
}
