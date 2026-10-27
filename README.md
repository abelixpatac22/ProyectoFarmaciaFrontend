# Farmacia · Frontend

Tienda en línea y panel de administración de la farmacia.
React + Vite + TypeScript + Tailwind CSS v4 + React Router + TanStack Query.

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:5173
```

Necesitas el backend corriendo en `http://localhost:8080` (en su carpeta: `npm start`).
Vite reenvía todo lo que empiece con `/api` a ese puerto (ver `vite.config.ts`).

Para usar el backend desplegado en vez del local, crea un archivo `.env.local` con:

```
VITE_API_URL=https://proyect-farmacia.onrender.com
```

Otros comandos: `npm run build` (compila y revisa tipos), `npm run lint`, `npm run preview`.

## Pantallas

| Ruta | Pantalla | Endpoints |
| --- | --- | --- |
| `/` | Catálogo con búsqueda y orden | `GET /api/productos/activos/lista` |
| `/productos/:id` | Detalle de producto | `GET /api/productos/:id` |
| `/carrito` | Carrito (vive en el navegador) | Reutiliza la lista de activos para precios y stock |
| `/checkout` | Datos de factura y pago | `GET/POST /api/clientes`, `POST /api/facturas`, `POST /api/pagos/crear-sesion` |
| `/pago/exitoso`, `/pago/cancelado` | Resultado del pago | Ninguno |
| `/admin/productos` | Gestión de productos | CRUD de productos + `GET /api/proveedores/activos/lista` |
| `/admin/gestion/clientes`, `/admin/gestion/proveedores`, `/admin/gestion/empleados` | Sección Gestión, con una pestaña por recurso | CRUD de cada recurso |
| `/admin/facturas`, `/admin/facturas/:id` | Facturas y su detalle | `GET /api/facturas`, `GET /api/facturas/:id` |
| `/admin/login` | Inicio de sesión de empleados | `POST /api/auth/login` |
| `/admin/cuenta` | Mi cuenta y cambio de contraseña | `GET /api/auth/perfil`, `PUT /api/auth/cambiar-password` |

**Login de empleados.** Todo `/admin` exige sesión. El token (dura 8 horas) y el empleado se guardan en
`localStorage` (`src/auth/sesion.ts`) y `apiFetch` agrega `Authorization: Bearer <token>` a cada petición.
Si el backend responde 401 con un token, la sesión se borra y el panel manda al login. Solo un
administrador ve los botones para crear, editar y desactivar empleados; el backend lo exige igual.
Los clientes de la tienda siguen sin cuenta. Mira **BACKEND-CAMBIOS.md** para lo pendiente.

## Orden recomendado para leer el código

1. `src/types/models.ts`: qué datos manda el backend.
2. `src/api/client.ts` y `src/api/crud.ts`: cómo se habla con el backend.
3. `src/hooks/useProductos.ts` y `src/pages/CatalogoPage.tsx`: la primera pantalla completa.
4. `src/cart/`: el carrito (reducer + contexto + localStorage).
5. `src/api/checkout.ts` y `src/pages/CheckoutPage.tsx`: la compra.
6. `src/admin/recurso.ts`, `src/admin/recursos.tsx` y `src/admin/ResourcePage.tsx`: el panel.
7. `src/router.tsx`: cómo se conectan todas las pantallas.

## Estructura

```
src/
├── api/          Único lugar donde se habla con el backend
│   ├── client.ts   apiFetch(): fetch + ApiError con status; assertMensajeOk() para "No se pudo…"
│   ├── crud.ts     createCrudApi(): las 6 rutas comunes, una sola vez para 4 recursos
│   ├── productos.ts, clientes.ts, proveedores.ts, empleados.ts
│   ├── facturas.ts, pagos.ts
│   └── checkout.ts procesarCompra(): cliente -> factura -> sesión de Stripe
├── types/models.ts   Tipos idénticos a los modelos de Sequelize
├── cart/         Carrito: reducer, contexto, provider, hooks
├── hooks/        useProductos (consultas), useDelayedFlag (carga lenta)
├── lib/          Funciones puras: dinero, formato, producto, queryClient
├── components/   Piezas de interfaz reutilizables (tarjeta, badge, mensajes, íconos…)
├── pages/        Pantallas de la tienda
├── admin/        Panel: layout, página genérica, formulario genérico, facturas
├── router.tsx    Todas las rutas
└── main.tsx      Punto de entrada: providers de Query, carrito y Router
```

## Las decisiones importantes y por qué

**Capas.** Un componente nunca llama a `fetch`. El flujo es
página → hook (`useQuery`/`useMutation`) → función de `src/api` → `apiFetch`.
Si mañana cambia una URL o se agrega el token del login, se toca un solo archivo.

**Tipos = lo que llega por la red.** `precio_venta` es `string | null` porque así lo manda el backend
(DECIMAL de PostgreSQL). Se convierte al usarlo con `toNumber()`. Todos los campos son `| null` porque
ningún modelo del backend tiene `allowNull: false`, y TypeScript te obliga a manejar el caso vacío.

**`fetch` no falla con 404 ni 500.** Solo lanza error cuando no hay red. `apiFetch` revisa `res.ok`
y lanza un `ApiError` con el `status`. Además, como el backend responde 200 con "No se pudo…" cuando
un PUT falla, `assertMensajeOk` lo convierte en error para no mostrar "guardado" cuando no lo fue.

**TanStack Query** guarda en caché, reintenta, cancela peticiones y te da `isPending` / `error` / `data`
sin `useEffect` + `useState` a mano. `useMutation` hace lo mismo para crear y editar. Después de guardar,
`invalidateQueries` marca los datos como viejos y se vuelven a pedir solos. Como el panel y la tienda
comparten la clave `['productos']`, editar un producto en el panel actualiza también el catálogo.

**Cuatro estados en cada pantalla:** cargando (esqueleto o spinner), error (mensaje y botón Reintentar),
vacío y con datos. Si pasan 4 s cargando, se avisa que el servidor se está despertando: Render gratis
duerme el backend y la primera petición puede tardar unos 50 s.

**El carrito guarda solo `id_producto` y `cantidad`.** Nombre, precio y stock se leen siempre del backend,
así un precio que cambió no se queda viejo en el carrito. Si un producto se agota o se desactiva,
el carrito lo marca en rojo y no deja pagar hasta corregirlo. Se guarda en `localStorage` con un
reducer: todos los cambios posibles están en `cartReducer.ts`.

**IVA.** En Guatemala el precio al público incluye IVA, así que se desglosa: total 112 → subtotal 100 + IVA 12
(`lib/dinero.ts`). Los cálculos redondean a 2 decimales para evitar errores como `0.1 + 0.2`.

**Checkout sin login (temporal).** Se busca al cliente por NIT y se crea si no existe. Con "CF"
(consumidor final), que lo comparten muchas personas, se busca por NIT y correo. Luego se crea la factura,
se pide la sesión de Stripe y se redirige. Prueba con la tarjeta 4242 4242 4242 4242.

**Panel genérico.** Productos, clientes, proveedores y empleados usan la misma `ResourcePage`. Lo que
cambia (columnas y campos del formulario) es configuración en `admin/recursos.tsx`. Agregar un recurso
nuevo es escribir su configuración, no otra pantalla. Nunca se usa `DELETE`: se desactiva con
`PUT { estado: false }`, porque borrar un producto que ya está en facturas falla y pierde historial.

**Búsqueda y orden del catálogo en la URL** (`?q=...&orden=...`): se pueden compartir, sobreviven a
recargar y el botón Atrás funciona.

**Imágenes.** El backend no tiene `imagen_url`, así que `ProductImage` dibuja un empaque con la inicial
y un color fijo por id. Cuando exista la imagen, solo cambia ese componente.

## Cuando el backend se actualice

- **Stripe vuelve al frontend** (cambio 1 de BACKEND-CAMBIOS.md): no hay que tocar nada, las páginas ya existen.
- **Precios calculados en el servidor** (cambio 2): no hay que tocar nada.
- **Login**: borrar `buscarOCrearCliente` de `api/checkout.ts`, tomar el `id_cliente` de la sesión y
  agregar el token en `apiFetch` (un solo lugar).
- **`imagen_url`**: agregarla a `Producto` en `types/models.ts` y usarla en `ProductImage`.
