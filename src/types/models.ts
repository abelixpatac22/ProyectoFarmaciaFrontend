/**
 * Tipos que reflejan EXACTAMENTE lo que el backend devuelve en JSON
 * (app/models/*.model.js del backend, con Sequelize + PostgreSQL).
 *
 * Reglas que vienen del backend:
 * - Ningún campo tiene `allowNull: false`, así que todos (menos el id) pueden llegar como null.
 * - DECIMAL(10,2) llega como string ("25.50"): usa toNumber() de src/lib/format.ts antes de operar.
 * - DATE llega como string ISO ("2026-10-21T15:30:00.000Z").
 * - Las claves foráneas (id_proveedor, id_cliente...) las agrega Sequelize por las relaciones de models/index.js.
 */

/** Un DECIMAL de PostgreSQL serializado por Sequelize, p. ej. "25.50". */
export type Decimal = string

/** Una fecha DATE serializada en formato ISO 8601. */
export type FechaISO = string

export interface Producto {
  id_producto: number
  codigo_barras: string | null
  nombre: string | null
  descripcion: string | null
  /** Enlace a una imagen en internet; sin ella la tienda dibuja el empaque. */
  imagen_url: string | null
  precio_costo: Decimal | null
  precio_venta: Decimal | null
  stock_actual: number | null
  stock_minimo: number | null
  requiere_receta: boolean | null
  estado: boolean | null
  id_proveedor: number | null
}

export interface Proveedor {
  id_proveedor: number
  nombre_empresa: string | null
  nit_proveedor: string | null
  contacto_nombre: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  estado: boolean | null
}

export interface Cliente {
  id_cliente: number
  nit: string | null
  nombre: string | null
  apellido: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  estado: boolean | null
  fecha_creacion: FechaISO | null
}

/** "admin" puede además crear, editar y desactivar empleados. */
export type Rol = 'admin' | 'empleado'

export interface Empleado {
  id_empleado: number
  codigo_empleado: string | null
  nombre: string | null
  apellido: string | null
  puesto: string | null
  telefono: string | null
  email: string | null
  rol: Rol | null
  estado: boolean | null
  fecha_ingreso: FechaISO | null
}

export interface Factura {
  id_factura: number
  numero_factura: string | null
  fecha: FechaISO | null
  subtotal: Decimal | null
  impuesto: Decimal | null
  total: Decimal | null
  metodo_pago: string | null
  estado_factura: string | null
  id_cliente: number | null
  id_empleado: number | null
}

export interface DetalleFactura {
  id_detalle: number
  cantidad: number | null
  precio_unitario: Decimal | null
  subtotal_linea: Decimal | null
  id_factura: number | null
  id_producto: number | null
}

export interface TransaccionPago {
  id_transaccion: number
  pasarela: string | null
  id_transaccion_externa: string | null
  monto: Decimal | null
  estado_pago: string | null
  fecha_registro: FechaISO | null
  id_factura: number | null
}

/* ---------- Respuestas con relaciones incluidas (include de Sequelize) ---------- */

/** GET /api/facturas: cada factura trae su cliente (solo 3 campos). */
export interface FacturaConCliente extends Factura {
  cliente: Pick<Cliente, 'nombre' | 'apellido' | 'nit'> | null
}

/** GET /api/facturas/:id: factura con cliente, empleado y detalle con el nombre del producto. */
export interface FacturaCompleta extends FacturaConCliente {
  empleado: Pick<Empleado, 'nombre' | 'puesto'> | null
  detalle_facturas: Array<DetalleFactura & { producto: Pick<Producto, 'nombre'> | null }>
}

/* ---------- Respuestas genéricas del backend ---------- */

/** PUT y DELETE responden { message } (¡también 200 cuando el id no existe!). */
export interface MensajeRespuesta {
  message: string
}

/** Forma de los errores: siempre trae message; POST /api/facturas agrega detalle. */
export interface ErrorRespuesta {
  message: string
  detalle?: string
}

/* ---------- Autenticación (/api/auth) ---------- */

/** POST /api/auth/login responde con el token (dura 8 horas) y el empleado, nunca con su contraseña. */
export interface LoginRespuesta {
  token: string
  empleado: Empleado
}

/* ---------- Cuerpos de petición ---------- */

export interface CrearFacturaBody {
  id_cliente: number
  id_empleado?: number
  numero_factura?: string
  subtotal?: number
  impuesto?: number
  total?: number
  metodo_pago?: string
  estado_factura?: string
  detalles: Array<{ id_producto: number; cantidad: number; precio_unitario: number }>
}

/** POST /api/facturas responde 201 con esto. */
export interface CrearFacturaRespuesta {
  message: string
  id_factura: number
}

export interface CrearSesionPagoBody {
  id_factura: number
  total: number
  email_cliente: string
}

export interface CrearSesionPagoRespuesta {
  url: string
  id_sesion: string
}

/** POST /api/pagos/confirmar y /api/pagos/cancelar responden el estado final de la factura. */
export interface EstadoPagoRespuesta {
  id_factura: number
  estado_factura: string
}
