import type { Proveedor } from '../types/models'
import { createCrudApi } from './crud'

export const proveedoresApi = createCrudApi<Proveedor>('proveedores')
