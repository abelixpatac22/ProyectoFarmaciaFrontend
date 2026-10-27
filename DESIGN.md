# Design

Dirección visual de la tienda (catálogo y detalle de producto). El panel `/admin` hereda los tokens pero sigue siendo utilitario.

## Idea

**El empaque es la imagen.** No hay fotos de producto, así que cada producto se dibuja como su propia caja de farmacia: un campo de color plano con una etiqueta blanca que lleva el nombre real, la presentación y el código de barras que manda el backend. Es honesto (todo sale de los datos) y en el detalle se vuelve el "escenario fijo": la caja queda quieta a un lado mientras la información corre al otro.

**Lo vivo:** en el detalle, al cambiar la cantidad se recalcula a la vista el desglose de la factura guatemalteca (subtotal + IVA 12 % = total), con las mismas funciones de `lib/dinero.ts` que usa el checkout.

Decisiones: la tipografía es Archivo y no una serif tipo Garamond, porque una farmacia debe leerse clara y confiable. No se usan fotos decorativas que no muestren nada del negocio. El acento es el verde de la cruz de farmacia.

## Color

Un fondo, una tinta, un acento y campos de color para los empaques. Las superficies se separan con un cambio de tono, nunca con líneas ni sombras en reposo.

| Rol | Token | Valor | Uso |
| --- | --- | --- | --- |
| Fondo | `--color-paper` | `#f3f4f1` | Fondo de la página |
| Superficie | `white` | `#ffffff` | Tarjetas, encabezado y etiqueta del empaque |
| Tinta | `--color-ink` | `#1b1f1d` | Todo el texto corrido |
| Tinta suave | `--color-ink-soft` | `#4d5652` | Notas secundarias (≥ 4.5:1 sobre papel y blanco) |
| Acento | `brand-700` | verde farmacia | El botón principal y el estado "Disponible" |
| Campos | `--color-field-sage/slate/blush/mint` | `#b7c8be` `#a6b3bc` `#d6c4b8` `#c9d8cf` | Color de cada empaque (fijo por id) |
| Cierre | `brand-900` | verde profundo | El pie de página |

Receta y "últimas unidades" usan ámbar. Ese color tiene significado y no decora.

## Tipografía

**Archivo** (Google Fonts, 400 y 600). Una sola familia.

- Títulos en peso 400, tracking -0.02em, interlineado 1.0. Nunca en negrita.
- Texto de 16–18px, interlineado 1.5. Botones y énfasis en 600.
- Cifras con `tabular-nums`.
- Pasos: small 13–14px · body 16–18px · lead 20–26px · head 32–64px · display (solo el h1 del catálogo) hasta ~88px.

## Forma

- Un radio para todo: `--radius-box` de 6px. Los botones son rectángulos con ese radio, no píldoras.
- Sin gradientes, glass, sombras en reposo, etiquetas pequeñas sobre títulos (eyebrows) ni palabras de acento coloreadas en los títulos.
- Las sombras solo aparecen en lo que de verdad flota, como una tarjeta en hover.

## Movimiento

Sutil y con propósito. Todo se desactiva con `prefers-reduced-motion`.

- Entrada de página: fade y 8px hacia arriba, 220ms, ease-out.
- Tarjeta: se eleva 2px en hover (solo en dispositivos con puntero) y el empaque escala 1.03.
- Botón: `scale(0.97)` al presionar. "Agregar" confirma con un cambio de ícono y el contador del carrito da un pequeño salto.

## Composición

- **Catálogo:** un h1 grande a la izquierda y, a la derecha, lo que la tienda realmente ofrece (precios con IVA, pago con tarjeta, receta marcada). Debajo, búsqueda y orden, y luego la cuadrícula de empaques.
- **Detalle:** dos columnas. El empaque es sticky y ocupa el alto de la pantalla en escritorio; a la derecha, el nombre, la presentación, el precio, la cantidad con su desglose en vivo, la acción y los datos (código, tipo de venta, existencias). En el teléfono, el empaque va arriba y luego todo en una columna.
