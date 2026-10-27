import type { Cliente } from '../types/models'
import { apiSend } from './client'
import { createCrudApi } from './crud'

export const clientesApi = createCrudApi<Cliente>('clientes')

/**
 * POST /api/clientes/checkout (pública): el backend busca al cliente por NIT (con "CF", por NIT + correo)
 * o lo crea. Solo devuelve el id, para que nadie pueda ver los datos de otro cliente con su NIT.
 */
export function registrarClienteCheckout(datos: Pick<Cliente, 'nit' | 'nombre' | 'apellido' | 'email' | 'telefono' | 'direccion'>) {
  return apiSend<{ id_cliente: number }>('/api/clientes/checkout', 'POST', datos)
}
