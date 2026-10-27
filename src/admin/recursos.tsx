import { clientesApi } from '../api/clientes'
import { empleadosApi } from '../api/empleados'
import { productosApi } from '../api/productos'
import { proveedoresApi } from '../api/proveedores'
import { Badge } from '../components/Badge'
import { productoKeys } from '../hooks/useProductos'
import { formatFecha, formatQuetzales, toNumber } from '../lib/format'
import type { Cliente, Empleado, Producto, Proveedor } from '../types/models'
import type { ResourceConfig } from './recurso'

/*
 * Cada pantalla del panel es solo configuración: qué columnas mostrar y qué campos editar.
 * Los campos y sus nombres son exactamente los del backend; "requerido" sigue lo que valida el backend
 * (más nombre y precio_venta en productos, que el backend debería exigir y no lo hace).
 * El campo "estado" no está en los formularios: se cambia con el botón Activar/Desactivar.
 */

const nombreCompleto = (p: { nombre: string | null; apellido: string | null }) =>
  [p.nombre, p.apellido].filter(Boolean).join(' ') || '—'

const dinero = (valor: string | null) => {
  const n = toNumber(valor)
  return n === null ? '—' : formatQuetzales(n)
}

export const proveedoresConfig: ResourceConfig<Proveedor> = {
  recurso: 'proveedores',
  titulo: 'Proveedores',
  singular: 'proveedor',
  queryKey: ['proveedores'],
  api: proveedoresApi,
  getId: (p) => p.id_proveedor,
  getNombre: (p) => p.nombre_empresa ?? `Proveedor #${p.id_proveedor}`,
  getEstado: (p) => p.estado,
  textoBusqueda: (p) => `${p.nombre_empresa} ${p.nit_proveedor} ${p.contacto_nombre} ${p.email}`,
  columnas: [
    { header: 'Empresa', render: (p) => <span className="font-medium">{p.nombre_empresa ?? '—'}</span> },
    { header: 'NIT', render: (p) => p.nit_proveedor ?? '—' },
    { header: 'Contacto', render: (p) => p.contacto_nombre ?? '—' },
    { header: 'Teléfono', render: (p) => p.telefono ?? '—', className: 'whitespace-nowrap' },
    { header: 'Correo', render: (p) => p.email ?? '—' },
  ],
  campos: [
    { name: 'nombre_empresa', label: 'Nombre de la empresa', tipo: 'texto', requerido: true, completo: true },
    { name: 'nit_proveedor', label: 'NIT', tipo: 'texto' },
    { name: 'contacto_nombre', label: 'Persona de contacto', tipo: 'texto' },
    { name: 'telefono', label: 'Teléfono', tipo: 'tel' },
    { name: 'email', label: 'Correo', tipo: 'email' },
    { name: 'direccion', label: 'Dirección', tipo: 'textarea' },
  ],
}

export const productosConfig: ResourceConfig<Producto> = {
  recurso: 'productos',
  titulo: 'Productos',
  singular: 'producto',
  // Misma clave base que usa la tienda: al guardar aquí, el catálogo también se actualiza
  queryKey: productoKeys.all,
  api: productosApi,
  getId: (p) => p.id_producto,
  getNombre: (p) => p.nombre ?? `Producto #${p.id_producto}`,
  getEstado: (p) => p.estado,
  textoBusqueda: (p) => `${p.nombre} ${p.codigo_barras} ${p.descripcion}`,
  columnas: [
    {
      header: 'Producto',
      render: (p) => (
        <div>
          <p className="font-medium">{p.nombre ?? '—'}</p>
          {p.codigo_barras && <p className="font-mono text-xs text-zinc-500">{p.codigo_barras}</p>}
        </div>
      ),
    },
    { header: 'Costo', render: (p) => dinero(p.precio_costo), className: 'text-right tabular-nums whitespace-nowrap' },
    { header: 'Precio', render: (p) => dinero(p.precio_venta), className: 'text-right tabular-nums whitespace-nowrap font-medium' },
    {
      header: 'Stock',
      className: 'text-right tabular-nums',
      render: (p) => {
        const bajo = p.stock_minimo !== null && (p.stock_actual ?? 0) <= p.stock_minimo
        return (
          <span className={bajo ? 'font-semibold text-red-600' : ''} title={`Mínimo: ${p.stock_minimo ?? '—'}`}>
            {p.stock_actual ?? 0}
          </span>
        )
      },
    },
    { header: 'Receta', render: (p) => (p.requiere_receta ? <Badge tono="ambar">Sí</Badge> : 'No') },
  ],
  campos: [
    { name: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, completo: true },
    { name: 'descripcion', label: 'Descripción', tipo: 'textarea' },
    {
      name: 'imagen_url',
      label: 'Imagen (enlace)',
      tipo: 'texto',
      placeholder: 'https://...',
      ayuda: 'Clic derecho en una imagen de internet, "Copiar dirección de la imagen" y pégala aquí. Vacío: se dibuja el empaque.',
      completo: true,
    },
    { name: 'codigo_barras', label: 'Código de barras', tipo: 'texto', placeholder: 'Debe ser único' },
    {
      name: 'id_proveedor',
      label: 'Proveedor',
      tipo: 'select',
      opciones: {
        queryKey: ['proveedores', 'activos'],
        queryFn: async (signal) =>
          (await proveedoresApi.listarActivos(signal)).map((p) => ({
            value: p.id_proveedor,
            label: p.nombre_empresa ?? `Proveedor #${p.id_proveedor}`,
          })),
      },
    },
    { name: 'precio_costo', label: 'Precio de costo (Q)', tipo: 'decimal' },
    { name: 'precio_venta', label: 'Precio de venta (Q)', tipo: 'decimal', requerido: true },
    { name: 'stock_actual', label: 'Stock actual', tipo: 'entero', requerido: true },
    { name: 'stock_minimo', label: 'Stock mínimo', tipo: 'entero' },
    { name: 'requiere_receta', label: 'Requiere receta médica', tipo: 'checkbox', completo: true },
  ],
}

export const clientesConfig: ResourceConfig<Cliente> = {
  recurso: 'clientes',
  titulo: 'Clientes',
  singular: 'cliente',
  queryKey: ['clientes'],
  api: clientesApi,
  getId: (c) => c.id_cliente,
  getNombre: (c) => nombreCompleto(c),
  getEstado: (c) => c.estado,
  textoBusqueda: (c) => `${c.nombre} ${c.apellido} ${c.nit} ${c.email}`,
  columnas: [
    { header: 'Nombre', render: (c) => <span className="font-medium">{nombreCompleto(c)}</span> },
    { header: 'NIT', render: (c) => c.nit ?? '—', className: 'whitespace-nowrap' },
    { header: 'Correo', render: (c) => c.email ?? '—' },
    { header: 'Teléfono', render: (c) => c.telefono ?? '—', className: 'whitespace-nowrap' },
    { header: 'Registro', render: (c) => formatFecha(c.fecha_creacion, true), className: 'whitespace-nowrap' },
  ],
  campos: [
    { name: 'nit', label: 'NIT', tipo: 'texto', requerido: true, placeholder: '1234567-8 o CF' },
    { name: 'email', label: 'Correo', tipo: 'email' },
    { name: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
    { name: 'apellido', label: 'Apellido', tipo: 'texto' },
    { name: 'telefono', label: 'Teléfono', tipo: 'tel' },
    { name: 'direccion', label: 'Dirección', tipo: 'textarea' },
  ],
}

export const empleadosConfig: ResourceConfig<Empleado> = {
  recurso: 'empleados',
  titulo: 'Empleados',
  singular: 'empleado',
  queryKey: ['empleados'],
  api: empleadosApi,
  getId: (e) => e.id_empleado,
  getNombre: (e) => nombreCompleto(e),
  getEstado: (e) => e.estado,
  textoBusqueda: (e) => `${e.codigo_empleado} ${e.nombre} ${e.apellido} ${e.puesto} ${e.email}`,
  columnas: [
    { header: 'Código', render: (e) => <span className="font-mono text-xs">{e.codigo_empleado ?? '—'}</span> },
    { header: 'Nombre', render: (e) => <span className="font-medium">{nombreCompleto(e)}</span> },
    { header: 'Puesto', render: (e) => e.puesto ?? '—' },
    { header: 'Correo', render: (e) => e.email ?? '—' },
    { header: 'Permisos', render: (e) => (e.rol === 'admin' ? 'Administrador' : 'Empleado') },
    { header: 'Ingreso', render: (e) => formatFecha(e.fecha_ingreso, true), className: 'whitespace-nowrap' },
  ],
  soloAdminEscribe: true,
  campos: [
    { name: 'codigo_empleado', label: 'Código de empleado', tipo: 'texto', requerido: true },
    { name: 'puesto', label: 'Puesto', tipo: 'texto' },
    { name: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true },
    { name: 'apellido', label: 'Apellido', tipo: 'texto' },
    { name: 'telefono', label: 'Teléfono', tipo: 'tel' },
    // Correo y contraseña son el acceso al panel
    { name: 'email', label: 'Correo', tipo: 'email', requerido: true, ayuda: 'Con este correo inicia sesión en el panel.' },
    {
      name: 'password',
      label: 'Contraseña',
      tipo: 'password',
      requeridoAlCrear: true,
      ayuda: 'Mínimo 8 caracteres. Al editar, déjala vacía para no cambiarla.',
    },
    {
      name: 'rol',
      label: 'Permisos',
      tipo: 'lista',
      requerido: true,
      valores: [
        { value: 'empleado', label: 'Empleado: todo menos gestionar empleados' },
        { value: 'admin', label: 'Administrador: todo el panel' },
      ],
    },
    { name: 'fecha_ingreso', label: 'Fecha de ingreso', tipo: 'fecha' },
  ],
}
