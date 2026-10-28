# Farmacia Bendición · Frontend

Tienda en línea y panel de administración de la farmacia.

- **Tienda publicada:** https://farmaciabendiciontienda.onrender.com
- **Panel:** https://farmaciabendiciontienda.onrender.com/admin
- **Backend:** repositorio [ProyectoFarmaciaRealista](https://github.com/abelixpatac22/ProyectoFarmaciaRealista)

## Tecnologías

React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router + TanStack Query.

## Qué se puede hacer

**En la tienda (sin cuenta):**

- Ver el catálogo, buscar y ordenar productos, y ver el detalle de cada uno.
- Agregar al carrito, que se guarda en el navegador.
- Comprar: llenar los datos de la factura y pagar con tarjeta en Stripe.
- Los medicamentos con receta se muestran, pero no se pueden comprar en línea: el producto explica que
  hay que presentar la receta en la farmacia física.

**En el panel (empleados con sesión):**

- **Productos:** crear, editar y desactivar; con imagen, proveedor, precios y stock mínimo.
- **Lotes y vencimientos:** registrar entradas de mercadería, ver los lotes con un semáforo de
  vencimiento (vencido, vence en 30 días, en 90 días, vigente) y retirar lotes vencidos o dañados.
  La pestaña muestra cuántos lotes necesitan atención.
- **Facturas:** listado y detalle, incluido de qué lote salió cada unidad.
- **Gestión:** clientes, proveedores y empleados. Solo un administrador puede crear o editar empleados.
- **Mi cuenta:** cambiar la contraseña.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
```

Necesitas el backend corriendo en `http://localhost:8080` (en su carpeta: `npm start`).
Vite reenvía todo lo que empiece con `/api` a ese puerto (ver `vite.config.ts`).

Para usar el backend publicado en vez del local, crea un archivo `.env.local` con:

```
VITE_API_URL=https://proyectofarmaciarealista.onrender.com
```

Otros comandos: `npm run build` (revisa tipos y compila a `dist/`), `npm run lint`, `npm run preview`.

## Publicarlo en Render

New → Static Site, conectado a este repositorio:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL` = la URL del backend publicado
- Redirects/Rewrites: origen `/*`, destino `/index.html`, acción **Rewrite** (para que al recargar
  `/admin/lotes` o `/productos/3` no salga 404)

El backend debe tener la URL de la tienda en su variable `FRONTEND_URL`.

## Pantallas

| Ruta | Pantalla | Endpoints |
| --- | --- | --- |
| `/` | Catálogo con búsqueda y orden | `GET /api/productos/activos/lista` |
| `/productos/:id` | Detalle de producto | `GET /api/productos/:id` |
| `/carrito` | Carrito | Reutiliza la lista de activos para precios y stock |
| `/checkout` | Datos de factura y pago | `POST /api/clientes/checkout`, `POST /api/facturas`, `POST /api/pagos/crear-sesion` |
| `/pago/exitoso`, `/pago/cancelado` | Resultado del pago | `POST /api/pagos/confirmar`, `POST /api/pagos/cancelar` |
| `/admin/login` | Inicio de sesión de empleados | `POST /api/auth/login` |
| `/admin/productos` | Productos | CRUD de productos |
| `/admin/lotes` | Lotes y vencimientos | `GET /api/lotes`, `POST /api/lotes`, `PUT /api/lotes/:id/retirar` |
| `/admin/facturas`, `/admin/facturas/:id` | Facturas y su detalle | `GET /api/facturas`, `GET /api/facturas/:id` |
| `/admin/gestion/clientes`, `/proveedores`, `/empleados` | Gestión, una pestaña por recurso | CRUD de cada recurso |
| `/admin/cuenta` | Mi cuenta | `GET /api/auth/perfil`, `PUT /api/auth/cambiar-password` |

## Estructura

```
src/
├── api/          Único lugar donde se habla con el backend
│   ├── client.ts   apiFetch(): fetch + token + ApiError con el código HTTP
│   ├── crud.ts     createCrudApi(): las rutas comunes, una sola vez para 4 recursos
│   ├── checkout.ts procesarCompra(): cliente -> factura -> sesión de Stripe
│   └── productos.ts, lotes.ts, facturas.ts, pagos.ts, clientes.ts...
├── types/models.ts   Tipos iguales a lo que responde el backend
├── auth/         Sesión del empleado (token en localStorage)
├── cart/         Carrito: reducer, contexto y líneas con datos del backend
├── hooks/        Consultas de productos y avisos de carga lenta
├── lib/          Funciones puras: dinero e IVA, formato, stock
├── components/   Piezas reutilizables: tarjeta, imagen, badge, mensajes, íconos
├── pages/        Pantallas de la tienda
├── admin/        Panel: layout, página y formulario genéricos, lotes, facturas
├── router.tsx    Todas las rutas
└── main.tsx      Punto de entrada
```

## Decisiones de diseño

**Capas.** Un componente nunca llama a `fetch`. El flujo es
página → hook (`useQuery` / `useMutation`) → función de `src/api` → `apiFetch`.
Si cambia una URL o la forma de enviar el token, se toca un solo archivo.

**Errores de red.** `fetch` no falla con 404 ni 500, solo cuando no hay conexión. `apiFetch` revisa la
respuesta y lanza un `ApiError` con el código HTTP. Si llega un 401 con sesión, la sesión se borra y el
panel manda al login.

**La compra va sin sesión.** Las peticiones del panel llevan el token del empleado, pero la factura de la
tienda nunca lo lleva. Así, con el panel abierto en el mismo navegador, una compra web sigue siendo una
compra web (Pendiente, por pagar) y no una venta de mostrador.

**TanStack Query** guarda en caché, reintenta y entrega `isPending` / `error` / `data` sin `useEffect`
a mano. Después de guardar, `invalidateQueries` vuelve a pedir los datos. El panel y la tienda comparten
la clave `['productos']`, así que registrar un lote o editar un producto actualiza también el catálogo.

**Cuatro estados en cada pantalla:** cargando, error (con botón Reintentar), vacío y con datos. Si la
carga tarda, se avisa que el servidor se está despertando: el plan gratis de Render duerme el backend.

**Stock vendible.** La tienda usa `stock_disponible`, que no cuenta los lotes vencidos. El panel muestra
además cuántas unidades vencidas quedan por retirar.

**El carrito guarda solo `id_producto` y `cantidad`.** Nombre, precio y stock se leen siempre del backend,
así un precio que cambió no se queda viejo. Si un producto se agota, se desactiva o requiere receta, el
carrito lo marca y no deja pagar hasta corregirlo.

**IVA.** En Guatemala el precio al público incluye IVA, así que se desglosa: total 112 → subtotal 100 +
IVA 12 (`lib/dinero.ts`). Los montos se redondean a 2 decimales.

**Panel genérico.** Productos, clientes, proveedores y empleados usan la misma `ResourcePage`; lo que
cambia (columnas y campos) es configuración en `admin/recursos.tsx`. Los registros se desactivan con
`estado: false` en vez de borrarse, para no perder el historial de las facturas.

**Imágenes.** Cada producto puede tener el enlace de una imagen. Si no tiene o el enlace no carga,
`ProductImage` dibuja un empaque con el nombre y el código de barras.

**Búsqueda y orden del catálogo en la URL** (`?q=...&orden=...`): se pueden compartir y el botón Atrás
funciona.
