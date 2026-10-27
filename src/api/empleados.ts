import type { Empleado } from '../types/models'
import { createCrudApi } from './crud'

export const empleadosApi = createCrudApi<Empleado>('empleados')
