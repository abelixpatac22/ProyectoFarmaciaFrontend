import { useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useCart } from '../cart/useCart'
import { CartIcon } from './icons'

const ANIO = new Date().getFullYear()

export function Layout() {
  const { totalUnidades } = useCart()
  const { pathname } = useLocation()
  // El contador solo "salta" cuando cambia, no al abrir la página con el carrito guardado
  const [unidadesIniciales] = useState(totalUnidades)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-8 motion-safe:animate-logo-flip" />
            <span className="text-lg">Farmacia</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-box px-3 py-2 transition-colors ${isActive ? 'text-ink' : 'text-ink-soft hover:text-ink'}`
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/admin"
              className="rounded-box px-3 py-2 text-ink-soft transition-colors hover:text-ink"
            >
              Panel
            </NavLink>
            <Link
              to="/carrito"
              className="relative ml-1 grid size-10 place-items-center rounded-box text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-paper active:scale-[0.95]"
              aria-label={`Carrito, ${totalUnidades} productos`}
            >
              <CartIcon className="size-5" />
              {totalUnidades > 0 && (
                // key: el contador "salta" cada vez que cambia, así se nota que algo entró al carrito
                <span
                  key={totalUnidades}
                  className={`absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center ${totalUnidades !== unidadesIniciales ? 'animate-bump' : ''} rounded-full bg-brand-700 px-1 text-[11px] font-semibold text-white tabular-nums ring-2 ring-white`}
                >
                  {totalUnidades > 99 ? '99+' : totalUnidades}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* key: al cambiar de página el contenido entra de nuevo con una animación corta.
          Buscar u ordenar no cambia la ruta, así que el catálogo no parpadea al escribir. */}
      <main key={pathname} className="flex-1 animate-page-in">
        <Outlet />
      </main>
      <ScrollRestoration />

      <footer className="bg-brand-900 text-brand-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-14 pb-10 sm:px-6 lg:px-8">
          <p className="text-[clamp(3rem,10vw,8rem)] leading-none tracking-[-0.04em]">Farmacia</p>
          <p className="text-sm text-brand-100">© {ANIO} Farmacia</p>
        </div>
      </footer>
    </div>
  )
}
