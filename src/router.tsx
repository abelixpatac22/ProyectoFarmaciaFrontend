import { createBrowserRouter, Navigate } from 'react-router'
import { AdminLayout } from './admin/AdminLayout'
import { CuentaPage } from './admin/CuentaPage'
import { FacturaDetallePage } from './admin/FacturaDetallePage'
import { FacturasPage } from './admin/FacturasPage'
import { GestionLayout } from './admin/GestionLayout'
import { LoginPage } from './admin/LoginPage'
import { clientesConfig, empleadosConfig, productosConfig, proveedoresConfig } from './admin/recursos'
import { ResourcePage } from './admin/ResourcePage'
import { Layout } from './components/Layout'
import { CarritoPage } from './pages/CarritoPage'
import { CatalogoPage } from './pages/CatalogoPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PagoCanceladoPage, PagoExitosoPage } from './pages/PagoResultadoPage'
import { ProductoPage } from './pages/ProductoPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

export const router = createBrowserRouter([
  // Tienda: todas comparten el encabezado y pie de Layout (se dibujan dentro de su <Outlet />)
  {
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <CatalogoPage /> },
      { path: 'productos/:id', element: <ProductoPage /> },
      { path: 'carrito', element: <CarritoPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'pago/exitoso', element: <PagoExitosoPage /> },
      { path: 'pago/cancelado', element: <PagoCanceladoPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Inicio de sesión de empleados: fuera de AdminLayout porque ese layout exige sesión
  { path: 'admin/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  // Panel de administración: otro layout. Sin sesión, AdminLayout manda a /admin/login
  {
    path: 'admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="productos" replace /> },
      // key distinta: al cambiar de sección React crea la página de cero (se limpian búsqueda y filtros)
      { path: 'productos', element: <ResourcePage key="productos" config={productosConfig} /> },
      // Gestión: clientes, proveedores y empleados comparten las pestañas de GestionLayout
      {
        path: 'gestion',
        element: <GestionLayout />,
        children: [
          { index: true, element: <Navigate to="clientes" replace /> },
          { path: 'clientes', element: <ResourcePage key="clientes" config={clientesConfig} /> },
          { path: 'proveedores', element: <ResourcePage key="proveedores" config={proveedoresConfig} /> },
          { path: 'empleados', element: <ResourcePage key="empleados" config={empleadosConfig} /> },
        ],
      },
      { path: 'facturas', element: <FacturasPage /> },
      { path: 'facturas/:id', element: <FacturaDetallePage /> },
      { path: 'cuenta', element: <CuentaPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
