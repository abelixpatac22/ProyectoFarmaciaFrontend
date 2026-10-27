# Cambios sugeridos para el backend

El frontend ya funciona con el backend tal como está. Algunas partes usan **soluciones temporales**
que se pueden quitar cuando el backend tenga estos cambios. Van en orden de importancia.

## 0. Urgente: credenciales expuestas

El zip del backend incluía el `.env` con la contraseña de Neon y la clave secreta de Stripe, y
`app/config/db.config.js` tiene el host de la base escrito en el código.

- Cambiar la contraseña de Neon y regenerar la clave de Stripe (modo prueba).
- Confirmar que `.env` está en `.gitignore` y nunca compartirlo en zips.

## 1. Que Stripe regrese al frontend (problema 6)

Hoy Stripe manda al usuario a una página de texto del backend. El frontend ya tiene las páginas
`/pago/exitoso` y `/pago/cancelado`.

```js
// .env del backend
FRONTEND_URL=http://localhost:5173   // en producción, la URL donde se publique el frontend

// pago.controller.js, dentro de stripe.checkout.sessions.create(...)
success_url: `${process.env.FRONTEND_URL}/pago/exitoso?factura=${id_factura}`,
cancel_url: `${process.env.FRONTEND_URL}/pago/cancelado?factura=${id_factura}`,
```

## 2. Calcular precios y totales en el servidor (problema 2) ✅ Hecho

`factura.controller.js` usa `precio_venta` de la base de datos, recalcula subtotal, IVA y total, y rechaza
productos inactivos o sin precio. `pago.controller.js` cobra en Stripe el `total` guardado en la factura,
no el que manda el navegador.

## 3. No descontar stock hasta que se pague (problema 3)

- Crear la factura con `estado_factura: "Pendiente"` y **sin** descontar stock (solo validar que alcance).
- En el webhook (`checkout.session.completed`): descontar stock y cambiar la factura a `"Pagada"`.
- Opcional: con el evento `checkout.session.expired`, pasar la factura a `"Cancelada"`.

El panel del frontend ya muestra Pendiente (ámbar), Completada/Pagada (verde) y Cancelada/Anulada (rojo).

## 4. Webhook (problema 7)

Agregar `STRIPE_WEBHOOK_SECRET` al `.env`. En local se obtiene con:

```bash
stripe listen --forward-to localhost:8080/api/pagos/webhook
```

## 5. Login y roles (problemas 4 y 5) ✅ Hecho

- Empleados: `POST /api/auth/login` (bcrypt + JWT de 8 horas), `GET /api/auth/perfil`,
  `PUT /api/auth/cambiar-password` y roles `admin` / `empleado`.
- Los datos de clientes y las facturas (`GET /api/clientes`, `GET /api/facturas`) exigen token.
- La compra web sigue sin cuenta: `POST /api/clientes/checkout` busca al cliente por NIT (con "CF", por
  NIT + correo) o lo crea, y solo devuelve `{ id_cliente }`. `POST /api/facturas` y
  `POST /api/pagos/crear-sesion` aceptan token opcional: con token, la factura registra al empleado.

Pendiente: después de `deploy` en Render, cambiar la contraseña temporal del administrador.

## 6. Arreglos pequeños

| Archivo | Cambio | Por qué |
| --- | --- | --- |
| `cliente.controller.js`, `producto.controller.js` | `estado: req.body.estado ?? true` | Hoy mandar `estado: false` guarda `true` |
| Todos los `update`/`delete` | `res.status(404).send(...)` cuando `num != 1` | Hoy responden 200 aunque fallen (el frontend lo detecta por el texto "No se pudo…") |
| Todas las rutas | Quitar `router.delete("/", ...deleteAll)` | Un clic borra la tabla entera |
| `producto.model.js` | `allowNull: false` en `nombre` y `precio_venta` | Un producto sin precio no se puede vender |
| `producto.model.js` | Agregar `imagen_url: STRING` y una categoría | El catálogo dibuja una imagen temporal con la inicial |
| `server.js` | `sync({ alter: true })` solo si `NODE_ENV !== 'production'` | Puede alterar columnas con datos |
| `server.js` | `app.use(express.json())` está dos veces | Sobra una |

El panel del frontend nunca usa `DELETE`: desactiva con `PUT { estado: false }`.
