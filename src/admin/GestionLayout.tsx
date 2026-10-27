import { NavLink, Outlet } from 'react-router'

const PESTANAS = [
  { to: 'clientes', texto: 'Clientes' },
  { to: 'proveedores', texto: 'Proveedores' },
  { to: 'empleados', texto: 'Empleados' },
]

/**
 * Sección "Gestión": agrupa clientes, proveedores y empleados.
 * Es un layout anidado: las pestañas quedan fijas y cada página se dibuja en el <Outlet />.
 */
export function GestionLayout() {
  return (
    <div>
      <nav className="mb-6 inline-flex rounded-xl bg-zinc-100 p-1 text-sm font-medium" aria-label="Secciones de gestión">
        {PESTANAS.map((p) => (
          <NavLink
            key={p.to}
            to={p.to}
            className={({ isActive }) =>
              `rounded-lg px-4 py-1.5 transition ${isActive ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`
            }
          >
            {p.texto}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
