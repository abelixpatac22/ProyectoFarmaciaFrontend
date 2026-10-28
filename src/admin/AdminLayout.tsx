import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { getPerfil } from '../api/auth'
import { actualizarEmpleado, cerrarSesion } from '../auth/sesion'
import { useSesion } from '../auth/useSesion'
import { getLotes } from '../api/lotes'
import { ArrowLeftIcon, LogoutIcon } from '../components/icons'
import { loteKeys, necesitaAtencion } from './lotes'

const SECCIONES = [
  { to: '/admin/productos', texto: 'Productos' },
  { to: '/admin/lotes', texto: 'Lotes y vencimientos' },
  { to: '/admin/facturas', texto: 'Facturas' },
  { to: '/admin/gestion', texto: 'Gestión' },
]

export function AdminLayout() {
  const empleado = useSesion()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Al abrir el panel confirmamos que el token guardado sigue valiendo (dura 8 horas y se anula si
  // desactivan al empleado). Si responde 401, apiFetch cierra la sesión y este layout manda al login.
  const perfil = useQuery({
    queryKey: ['auth', 'perfil'],
    queryFn: ({ signal }) => getPerfil(signal),
    enabled: empleado !== null,
    staleTime: 5 * 60_000,
  })

  // Misma consulta que la página de lotes (comparten caché): el número rojo de la pestaña son los
  // lotes vencidos o que vencen en 30 días o menos, para que se vean desde cualquier sección
  const lotes = useQuery({
    queryKey: loteKeys.all,
    queryFn: ({ signal }) => getLotes(signal),
    enabled: empleado !== null,
  })
  const lotesUrgentes = (lotes.data ?? []).filter(necesitaAtencion).length

  // Datos frescos del servidor: si cambiaron su rol o su nombre, el panel lo refleja
  useEffect(() => {
    if (perfil.data) actualizarEmpleado(perfil.data)
  }, [perfil.data])

  if (!empleado) {
    return <Navigate to="/admin/login" replace state={{ desde: location.pathname + location.search }} />
  }

  function salir() {
    cerrarSesion()
    // Que el siguiente empleado en esta computadora no vea datos en caché del anterior
    queryClient.removeQueries({ queryKey: ['auth'] })
    queryClient.removeQueries({ queryKey: ['empleados'] })
  }

  const nombre = [empleado.nombre, empleado.apellido].filter(Boolean).join(' ') || empleado.email

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="flex items-center gap-2.5 font-bold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span>
              Farmacia <span className="font-medium text-zinc-400">/ Panel</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm sm:gap-3">
            <Link
              to="/"
              className="hidden items-center gap-1.5 font-medium text-zinc-500 hover:text-zinc-900 sm:inline-flex"
            >
              <ArrowLeftIcon className="size-4" />
              Ir a la tienda
            </Link>
            <NavLink
              to="/admin/cuenta"
              className={({ isActive }) =>
                `rounded-box px-3 py-2 text-right leading-tight transition-colors hover:bg-zinc-100 ${isActive ? 'bg-zinc-100' : ''}`
              }
              title="Mi cuenta"
            >
              <span className="block max-w-40 truncate font-medium text-zinc-900">{nombre}</span>
              <span className="block text-xs text-zinc-500">{empleado.rol === 'admin' ? 'Administrador' : 'Empleado'}</span>
            </NavLink>
            <button
              type="button"
              onClick={salir}
              className="grid size-10 place-items-center rounded-box text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogoutIcon className="size-5" />
            </button>
          </div>
        </div>
        {/* Navegación con pestañas: en el celular se desplaza de lado */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8" aria-label="Secciones del panel">
          {SECCIONES.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                `border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${isActive ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`
              }
            >
              {s.texto}
              {s.to === '/admin/lotes' && lotesUrgentes > 0 && (
                <span
                  className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white tabular-nums"
                  title={`${lotesUrgentes} lotes vencidos o por vencer en 30 días`}
                >
                  {lotesUrgentes}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
