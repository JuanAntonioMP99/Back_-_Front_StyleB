# Spec: Consistencia visual y maquetación de la SPA (Style-Busters-main)

## Metadata
- **Tipo:** feature
- **Complejidad:** L (cercana a XL — ver nota de complejidad al final del documento; se recomienda al orchestrator evaluar si se divide)
- **Fecha:** 2026-08-20
- **Estado:** DRAFT
- **ID de backlog:** FE-UI-CONSISTENCY-2026-08-20
- **Ejecutor:** subagente frontend-builder

## Historia

Como usuario de la tienda (comprador que navega `Style-Busters-main`), quiero que todas las páginas con ruta de la SPA (Home, ficha de producto, carrito, checkout, resultados de búsqueda, login, registro, perfil y confirmación de pedido) se vean visualmente coherentes entre sí — misma paleta de colores, mismo lenguaje de "card", sin paneles de tema claro apareciendo sobre el fondo oscuro de la app y sin páginas sin estilo — para poder entender y completar el flujo de compra sin fricción visual.

- **Específica:** corregir el CSS/maquetación de las páginas listadas en CA-5, quitar 4 enlaces del header a rutas inexistentes, y verificar el estado del bug histórico de imagen de producto — sin tocar lógica de negocio, endpoints ni datos.
- **Medible:** criterios de aceptación CA-1 a CA-7, cada uno verificable por inspección de código/CSS y, cuando aplica, por `npm test`.
- **Alcanzable:** cambios acotados a archivos `.css` existentes y ajustes JSX estructurales mínimos (imports de CSS, className, eliminación de bloques `<Link>`) dentro de `Style-Busters-main/src/`; no requiere cambios de backend ni de contrato de API.
- **Relevante:** el usuario (dueño del repo) lo pidió explícitamente como tarea de maquetación/UX sobre la SPA existente.
- **Temporal:** complejidad L, ver desglose de archivos en "Dependencias".

## Contexto

El dueño del repo, actuando como desarrollador front-end especialista en maquetación, pidió revisar y corregir el CSS de todas las páginas con ruta de la SPA para mejorar la experiencia visual, sin inventar contenido ni cambiar la paleta de colores. Dio ejemplos explícitos (carrito, checkout, resultados de búsqueda) y dos puntos concretos: quitar del header cuatro enlaces a páginas que no existen, y mostrar los productos de Home/ProductDetails en tarjetas.

La exploración de código real (hecha para este spec, ver evidencia en cada CA) encontró la causa raíz común a la mayoría de los ejemplos que el usuario señaló como "feos": **el proyecto tiene tres familias de custom properties CSS coexistiendo, pero solo una está realmente definida.**

- `Style-Busters-main/src/index.css` define en `:root` únicamente: `--color-primary`, `--color-secondary`, `--color-bg-dark`, `--color-bg-card`, `--color-accent-pink`, `--color-accent-orange`, `--color-accent-lime`, `--color-text-main`, `--color-text-muted`, más `--spacing-*` y `--container-width`. Esta es la paleta real y vigente (fondo casi negro, tarjetas gris oscuro, amarillo neón como color primario, cian como secundario).
- Varios archivos (`Header.css`, `Navigation.css`, `Layout.css`, `ErrorMessage.css`, `Loading.css`, `ProfileCard.css`, `ProductDetails.css`) usan una segunda familia nunca definida en ningún `:root` ni bajo ningún selector `[data-theme]`: `--surface`, `--border`, `--bg`, `--text`, `--accent`, `--accent-contrast`, `--muted`, `--radius`, `--elev-1`, `--gap*`, `--danger`, `--content-max-width`, y variantes tipo `--color-strong-blue`, `--color-white`, `--color-blue`, `--color-dark`, `--color-gray`, `--color-strong-gray`, `--color-light-gray`, `--color-purple`, `--color-pink`, `--color-red`, `--color-primary-light`. Al no existir, esas propiedades quedan sin valor: los `background`/`border`/`border-radius` que dependen de ellas no se aplican (o quedan en su valor inicial), por lo que esos bloques se ven sin fondo, sin borde y sin radio.
- Otros archivos (`SearchResultsList.css`, `Components/Checkout/Address/Address.css`, `Components/Checkout/PaymentMethods/Payment.css`, `Components/Checkout/Shared/SummarySection.css`) usan una tercera familia también no definida (`--border-color`, `--bg-color-main`, `--bg-color-secondary`, `--text-color-main`, `--text-color-secondary`, `--color-primary-dark`), pero **con un fallback CSS explícito en tema claro** (`var(--bg-color-main, #fff)`, `var(--text-color-main, #111)`, etc.). Como la variable nunca existe, el navegador siempre usa el fallback: esto es exactamente por qué "resultados de búsqueda" y las secciones de dirección/pago/resumen del checkout se ven como paneles blancos con texto oscuro flotando sobre el fondo negro del resto de la app — es la causa raíz concreta y verificable de los ejemplos que dio el usuario.

Sobre el punto 6 (imágenes de producto sin mostrarse), el código actual ya contiene la corrección: `Style-Busters-main/src/utils/productImage.js` documenta en su propio comentario que el bug histórico era leer `imagesUrl` (campo que la API nunca devuelve) en vez de `imageURL` (el campo real del modelo `Product`, documentado en `CLAUDE.md` §3), y expone `getProductImage(product)` + `PRODUCT_IMAGE_PLACEHOLDER` como único punto de resolución, ya usado por `ProductCard.jsx`, `ProductDetails.jsx` y `CartView.jsx`, con manejo `onError` y tests dedicados. Este hallazgo se documenta como CA-7 de verificación, no de corrección de código nuevo.

## Criterios de Aceptación

- [ ] **CA-1 — Header sin enlaces a páginas inexistentes.** En `Style-Busters-main/src/Layout/Navigation/Navigation.jsx` se eliminan los cuatro `<Link>` "Ofertas del día" (`/offers`), "Novedades" (`/new`), "Más vendidos" (`/bestsellers`) y "Flash sale" (`/flash-sale`), tanto en el bloque de navegación de escritorio (`<nav className="categories-nav">`, líneas ~142-155) como en el bloque de navegación móvil (líneas ~39-71). El resto de la navegación (categorías dinámicas desde `Data/categories.json`) queda intacto. `Style-Busters-main/src/Layout/Navigation/Navigation.test.jsx` se actualiza para no depender de esos enlaces (los dos `it(...)` actuales asertan explícitamente `href="/offers"` y `href="/new"`, y deben reescribirse). Verificable: `npm test -- Navigation` pasa; ninguno de los cuatro `to="..."` queda en `Navigation.jsx`.

- [ ] **CA-2 — Home mantiene el catálogo en tarjetas.** `Style-Busters-main/src/Pages/HomePage.jsx` sigue mostrando el catálogo a través de `Components/List/List.jsx` → `Components/ProductCard/ProductCard.jsx` (ya implementado como card real, con imagen, título, precio, badges de stock y botón "Agregar al carrito" en `ProductCard.css`, usando la paleta real `--color-*`). Este CA es de no-regresión: no se sustituye el layout de card por otro, y cualquier ajuste de estilo sobre `ProductCard.css` debe mantenerse dentro de los tokens `--color-*` ya definidos (ver CA-4).

- [ ] **CA-3 — ProductDetails con estilo de card coherente.** `Style-Busters-main/src/Components/ProductDetails/ProductDetails.css` deja de referenciar las custom properties no definidas `--surface`, `--radius`, `--border`, `--bg`, `--muted` (usadas hoy en `.product-details-container`, `.product-details-main`, `.product-details-image`) y pasa a usar los tokens reales de `index.css` (p. ej. fondo `--color-bg-card`, bordes/colores de texto consistentes con `--color-text-main`/`--color-text-muted`), de modo que el bloque de producto (imagen + info) se vea como una card con el mismo lenguaje visual que `ProductCard`/`.cart-item` (fondo oscuro sólido, borde y radio visibles, no transparente). Verificable: `ProductDetails.css` no contiene ninguna custom property que no exista en `:root` de `index.css`.

- [ ] **CA-4 — Ningún color nuevo fuera de la paleta existente.** Toda declaración de color (`background`, `color`, `border-color`, etc.) en los archivos tocados por este pendiente debe resolver a uno de los tokens ya definidos en `:root` de `index.css` (`--color-primary`, `--color-secondary`, `--color-bg-dark`, `--color-bg-card`, `--color-accent-pink`, `--color-accent-orange`, `--color-accent-lime`, `--color-text-main`, `--color-text-muted`) o a valores neutros ya usados en el repo sobre fondo oscuro (p. ej. `rgba(255,255,255,0.1)`), nunca a un hex/rgb de tema claro. Esto implica resolver, sin introducir colores nuevos, las custom properties no definidas identificadas en:
  - `Style-Busters-main/src/Layout/Header/Header.css`
  - `Style-Busters-main/src/Layout/Navigation/Navigation.css`
  - `Style-Busters-main/src/Layout/Layout.css`
  - `Style-Busters-main/src/Components/Common/ErrorMessage/ErrorMessage.css`
  - `Style-Busters-main/src/Components/Common/Loading/Loading.css`
  - `Style-Busters-main/src/Components/ProfileCard/ProfileCard.css`
  - `Style-Busters-main/src/Components/ProductDetails/ProductDetails.css` (cubierto también por CA-3)
  - `Style-Busters-main/src/Components/SearchResultsList/SearchResultsList.css`
  - `Style-Busters-main/src/Components/Checkout/Address/Address.css`
  - `Style-Busters-main/src/Components/Checkout/PaymentMethods/Payment.css`
  - `Style-Busters-main/src/Components/Checkout/Shared/SummarySection.css`

  Además, `Style-Busters-main/src/Components/ProfileCard/ProfileCard.jsx` reemplaza los colores inline hardcodeados de `ROLE_COLORS` (`admin: "#2563eb"`, `customer: "#22c55e"`, ninguno perteneciente a la paleta) por tokens de la paleta existente (p. ej. `--color-accent-*`). Verificable: ningún archivo de los listados usa `var(--x, <hex-fuera-de-paleta>)` ni un literal hex/rgb ajeno a la paleta documentada en `index.css` para declarar color.

- [ ] **CA-5 — Cobertura completa de páginas con ruta.** Se revisan y corrigen, según lo detectado en cada una, todas las páginas bajo `Style-Busters-main/src/Pages/` referenciadas desde `App/App.jsx`: `HomePage.jsx`, `CartPage.jsx`, `Login.jsx`, `Register.jsx`, `SearchResults.jsx`, `ProductDetailsPage.jsx`, `Profile.jsx`, `CheckoutPage.jsx`, `ConfirmationPage.jsx` (la ruta `*` de "no encontrada" en `App.jsx` es un `<div>` inline, no un archivo bajo `Pages/`, y queda fuera de este CA). En concreto:
  - **CA-5a (SearchResults):** `Components/SearchResultsList/SearchResultsList.css` deja de caer en sus fallbacks de tema claro (`#FFFF33`, `#666`, `#f9fafb`, `#fff`, `#333`, `#555`, `#e5e5e5`, `#ddd`, `#777`, `blue`) y pasa a la paleta oscura real (cubierto también por CA-4).
  - **CA-5b (Checkout):** `Components/Checkout/Address/Address.css`, `Components/Checkout/PaymentMethods/Payment.css`, `Components/Checkout/Shared/SummarySection.css` dejan de caer en sus fallbacks de tema claro (`#fff`, `#fafafa`, `#f4f4f5`, `#f9f9f9`, `#111`, `#666`, `#eee`, `#ddd`) y pasan a la paleta oscura real (cubierto también por CA-4).
  - **CA-5c (Cart/CartView reutilizado en Checkout):** `Components/CartView/CartView.jsx` no importa ningún CSS propio hoy; sus estilos (`.cart-item`, `.cart-item-image`, etc.) viven duplicados en `Pages/CartPage.css`, mientras que `Components/CartView/CartView.css` existe pero está huérfano (nadie lo importa) y casi duplica 1:1 a `CartPage.css`. Como `<CartView />` también se renderiza dentro de `CheckoutPage.jsx` (sección "3. Revisa tu pedido"), si el chunk lazy de `/cart` no fue cargado antes en la sesión, esas filas del resumen de checkout se ven sin estilo. Se corrige haciendo que `CartView.jsx` importe `./CartView.css`, y `Pages/CartPage.css` deja de duplicar las reglas de `.cart-item`/`.cart-view`/`.cart-summary`/`.cart-empty`, quedándose solo con lo propio de la página (`.cart`, `.cart-header*`). Verificable: con productos en el carrito, entrar directo a `/checkout` sin haber visitado `/cart` antes en la sesión muestra el resumen de pedido con el mismo estilo que en `/cart`.
  - **CA-5d (Login):** se elimina la colisión de nombres de clase global `.login-container`/`.login-card`/`.login-form`, definidas simultáneamente en `Pages/CheckoutPage.css` (líneas 1-53, bloque sin relación con Checkout, aparentemente copiado por error) y en el archivo huérfano `Pages/Login.css` (no importado por ningún componente — `Pages/Login.jsx` solo renderiza `<LoginForm />` sin CSS propio), frente a las reglas realmente activas en `Components/LoginForm/LoginForm.css`. Verificable: tras el cambio, ninguna clase `.login-*` queda declarada fuera de `LoginForm.css`, y `Pages/CheckoutPage.css` ya no contiene reglas `.login-*`.
  - **CA-5e (Register):** `Components/RegisterForm/RegisterForm.css` está vacío (0 bytes) pese a que `RegisterForm.jsx` usa las clases `register-container`, `register-card`, `register-form`, `field-error`, `register-footer` sin ningún estilo propio (solo hereda `body`/`button` de `index.css`). Se le da un estilo de card coherente con `LoginForm.css` (mismo lenguaje visual y misma paleta), sin inventar campos ni textos nuevos —los `<input>`/labels ya existentes en el JSX no cambian—. Verificable: `RegisterForm.css` deja de estar vacío y define esas clases.
  - **CA-5f (Profile):** cubierto por CA-4 (tokens indefinidos de `ProfileCard.css` + colores de rol fuera de paleta en `ProfileCard.jsx`).
  - **CA-5g (Home, ConfirmationPage):** ya usan la paleta real (`--color-*`) correctamente; este CA exige verificar que no se rompan visualmente por los cambios de CA-3/CA-4/CA-5a-e (no se detectó bug propio en `HomePage.css` ni `ConfirmationPage.css` durante la exploración de este spec).

- [ ] **CA-6 — Sin contenido inventado.** Los cambios de este pendiente se limitan a CSS y a JSX estructural estrictamente necesario para aplicarlo (agregar el `import "./CartView.css"` faltante en CA-5c, mover/renombrar un `className`, eliminar los bloques `<Link>` de CA-1, dar estilo a clases ya existentes en CA-5e). No se agregan textos, datos, props de negocio, campos de formulario, rutas nuevas ni llamadas a servicios/endpoints que no existan ya en el JSX actual.

- [ ] **CA-7 — Diagnóstico del bug de imagen de producto (verificación, sin código nuevo esperado).** Se confirma que el bug histórico "producto sin imagen" (causado por leer `imagesUrl`, campo que la API nunca devuelve, en vez de `imageURL`, el campo real de `Product` documentado en `CLAUDE.md` §3) ya está corregido en el código actual: `Style-Busters-main/src/utils/productImage.js` centraliza la resolución vía `getProductImage(product)` leyendo `product.imageURL`, con fallback `PRODUCT_IMAGE_PLACEHOLDER = "/img/products/placeholder.svg"` (el asset existe en `Style-Busters-main/public/img/products/placeholder.svg`), consumido por `ProductCard.jsx`, `ProductDetails.jsx` y `CartView.jsx`, todos con `onError` para URLs externas rotas, y cubierto por tests (`utils/productImage.test.js`, `ProductCard.test.jsx`, `ProductDetails.test.jsx`, `CartView.test.jsx`). No se encontró ningún otro punto de la SPA que renderice imagen de producto sin pasar por este helper. Este CA se da por cumplido con la verificación documentada arriba; si el ejecutor detecta durante la implementación un caso residual no cubierto, debe registrarlo en "Pendientes Abiertos y Gaps Detectados" del spec, no inventar una imagen de producto para "tapar" el caso.

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna aplica de forma directa — este pendiente es exclusivamente de presentación (CSS y ajustes estructurales de JSX para aplicar CSS), sin tocar autenticación, autorización, validación de inputs, llamadas a la API, manejo de tokens ni persistencia. Justificación por categoría:
  - **Spoofing:** N/A. No se modifica `AuthContext`, `LoginForm`/`RegisterForm` (lógica de envío), `ProtectedRoute` ni el manejo de tokens (`utils/auth.js`).
  - **Tampering:** N/A. No se modifican payloads enviados a la API (`Services/*`), ni el guard `authMiddleware`/`isAdminMiddleware` del backend, ni ninguna validación de `express-validator`.
  - **Repudiation:** N/A. No se toca logging ni auditoría.
  - **Information Disclosure:** N/A. No se agregan campos nuevos a la UI que expongan datos que hoy no se muestran (p. ej. `ProfileCard` sigue mostrando exactamente los mismos campos de usuario, solo cambia su color de fondo/borde).
  - **Denial of Service:** N/A. Los cambios son CSS estático y un `import` de CSS adicional en `CartView.jsx`; no se agregan bucles, timers ni llamadas de red nuevas. No se toca el manejo de LCP/lazy-loading ya optimizado de `BannerCarousel`.
  - **Elevation of Privilege:** N/A. No se modifica `ProtectedRoute.jsx` ni las rutas protegidas (`/profile`, `/checkout` siguen envueltas en `ProtectedRoute` exactamente igual).
- **Controles de mitigación:** ninguno adicional requerido.
- **Inputs que requieren validación:** ninguno nuevo.
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** ninguna (cambio puramente de presentación en el cliente).

## Dependencias

- **Internas** (archivos reales a tocar, `Style-Busters-main/src/` salvo que se indique lo contrario):
  - `Layout/Navigation/Navigation.jsx`, `Layout/Navigation/Navigation.test.jsx`, `Layout/Navigation/Navigation.css` — CA-1, CA-4
  - `Layout/Header/Header.css` — CA-4
  - `Layout/Layout.css` — CA-4
  - `Pages/HomePage.jsx`, `Pages/HomePage.css` — CA-2, CA-5g (verificación)
  - `Components/List/List.jsx`, `Components/ProductCard/ProductCard.jsx`, `Components/ProductCard/ProductCard.css` — CA-2 (no-regresión)
  - `Components/ProductDetails/ProductDetails.jsx`, `Components/ProductDetails/ProductDetails.css` — CA-3
  - `Components/Common/ErrorMessage/ErrorMessage.css` — CA-4
  - `Components/Common/Loading/Loading.css` — CA-4
  - `Components/ProfileCard/ProfileCard.jsx`, `Components/ProfileCard/ProfileCard.css` — CA-4, CA-5f
  - `Components/SearchResultsList/SearchResultsList.jsx` (solo lectura de referencia), `Components/SearchResultsList/SearchResultsList.css` — CA-4, CA-5a
  - `Components/Checkout/Address/Address.css` — CA-4, CA-5b
  - `Components/Checkout/PaymentMethods/Payment.css` — CA-4, CA-5b
  - `Components/Checkout/Shared/SummarySection.css` — CA-4, CA-5b
  - `Components/CartView/CartView.jsx`, `Components/CartView/CartView.css` — CA-5c
  - `Pages/CartPage.jsx` (solo lectura de referencia), `Pages/CartPage.css` — CA-5c
  - `Pages/CheckoutPage.jsx` (solo lectura de referencia), `Pages/CheckoutPage.css` — CA-5d (eliminar líneas 1-53)
  - `Pages/Login.jsx` (solo lectura de referencia), `Pages/Login.css` — CA-5d
  - `Components/LoginForm/LoginForm.jsx` (solo lectura de referencia), `Components/LoginForm/LoginForm.css` — CA-5d (referencia del estilo real vigente)
  - `Components/RegisterForm/RegisterForm.jsx` (solo lectura de referencia), `Components/RegisterForm/RegisterForm.css` — CA-5e
  - `Pages/ConfirmationPage.jsx`, `Pages/ConfirmationPage.css` — CA-5g (verificación)
  - `utils/productImage.js`, `utils/productImage.test.js` — CA-7 (solo verificación, no se espera tocar)
  - `index.css` — fuente de verdad de la paleta (`:root`); solo se lee, no se espera modificar salvo que el ejecutor decida centralizar ahí algún token adicional (ver Decisiones de Diseño)
- **Externas:** ninguna librería nueva. No hay cambios de `package.json` en `Style-Busters-main`.

## Decisiones de Diseño

- **Una sola fuente de verdad de paleta:** se consolida todo el CSS tocado sobre los tokens `--color-*` ya definidos en `index.css`, en vez de definir un `:root` paralelo para las familias `--surface/--border/--bg/--text/--accent/--muted/--radius/...` o `--border-color/--bg-color-main/...` que hoy aparecen referenciadas pero nunca declaradas. Esto respeta la restricción explícita del usuario ("mantener la misma paleta existente, no introducir colores nuevos") y `CLAUDE.md` §8 ("no inventar... campos ni comportamiento que no exista"): los únicos valores de color reales y vigentes en el proyecto son los de `index.css`.
- **Mapeo sugerido (no vinculante, guía para el ejecutor)** entre las custom properties indefinidas encontradas y los tokens reales más cercanos ya usados de forma consistente en el resto del código (`ProductCard.css`, `CartView.css`, `Pages/CartPage.css`, `LoginForm.css`):
  - `--surface` / `--bg-color-main` → `--color-bg-card`
  - `--bg` / `--bg-color-secondary` → `--color-bg-dark`
  - `--text` / `--text-color-main` → `--color-text-main`
  - `--muted` / `--text-color-secondary` → `--color-text-muted`
  - `--border` / `--border-color` → `rgba(255, 255, 255, 0.1)` (patrón ya usado en `CartPage.css`/`CartView.css`) o `#333` (patrón ya usado en `ProductCard.css`/`ProductDetailPage.css`, ver hallazgo abajo)
  - `--accent` → `--color-secondary` (acento cian, usado para focus/hover) o `--color-primary` (amarillo, usado para CTAs), según el uso puntual en cada regla
  - `--danger` → `--color-accent-pink`
  - `--radius` → valor literal (`8px`/`12px`/`16px`, siguiendo la magnitud ya usada en el bloque equivalente de `ProductCard.css`/`CartPage.css`)
  - El ejecutor decide el mapeo exacto por bloque siguiendo el patrón visual ya usado en el componente análogo real (p. ej. una card de dirección/pago debe verse como `.cart-item`, no inventar un estilo nuevo).
- **Hallazgo de referencia útil:** `Pages/ProductDetailPage.css` es un archivo huérfano (no importado por ningún `.jsx`, con clases `product-detail-*` en singular, distintas de las reales `product-details-*` en plural de `ProductDetails.css`) que sí usa correctamente los tokens `--color-*`. Aunque no causa ningún bug visible (nadie lo referencia), es evidencia de que el estilo correcto para la ficha de producto ya existió antes de un refactor y se perdió; puede usarse como referencia de valores (radios, sombras) al implementar CA-3, y se recomienda eliminarlo por ser código muerto detectado durante esta misma exploración (no es obligatorio para cumplir los CA de este spec).
- **No se reintroduce el sistema de theming claro/oscuro como funcionalidad:** el botón de tema (`ThemeContext`, ícono sol/luna en el Header) ya existe en el código y no se toca su lógica; los CA de este spec solo corrigen que las páginas se vean coherentes en el tema oscuro (el único que hoy renderiza contenido real, dado que ninguna custom property de `[data-theme="light"]` existe). Ver "Pendientes Abiertos" sobre el theming como posible pendiente aparte.

## Riesgos y Deuda Técnica

- El volumen de archivos CSS a tocar (11+ archivos con custom properties indefinidas, más 2 archivos de código muerto, más deduplicación de `CartView.css`/`CartPage.css`) hace que un solo PR sea grande incluso siendo "solo CSS"; el riesgo principal es de revisión (difícil de revisar un diff tan disperso), no técnico.
- El `[data-theme="dark"]` en `Header.css`/`Navigation.css` depende de las mismas custom properties indefinidas que se resuelven en este pendiente; al resolverlas, ese bloque `[data-theme="dark"]` empieza a tener efecto real por primera vez. El ejecutor debe verificar que no introduce un comportamiento visual distinto entre el estado "sin tema aplicado" (por defecto, `isDarkMode = false` en `ThemeContext`) y el bloque base de esas reglas, ya que hoy ambos caminos son indistinguibles (ninguno resolvía nada).

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna (este pendiente no agrega funcionalidad).
- **Comportamientos inconsistentes detectados (fuera de alcance de este spec, candidatos a backlog separado):**
  - El toggle de tema claro/oscuro del Header (`ThemeContext.jsx`, botón sol/luna) escribe `document.documentElement.dataset.theme` pero no existe ningún selector `[data-theme="light"]` en el CSS (solo `[data-theme="dark"]`, cubierto por este spec de forma incidental); en modo claro (`isDarkMode = false`, valor por defecto) la app simplemente no cambia de apariencia. Es un bug funcional del toggle, no puramente de CSS/maquetación — se recomienda escalarlo como pendiente aparte.
  - `Components/SearchResultsList/SearchResultsList.jsx` línea 115 enlaza `to="/offers"` ("ofertas destacadas") en el estado "sin resultados", apuntando a una ruta inexistente igual que los 4 enlaces del header — pero el pendiente original solo pidió limpiar el header. Se deja fuera de alcance de CA-1 y se registra aquí como candidato a backlog.
  - `Pages/ProductDetailPage.css` es código muerto (no importado por ningún componente); no es obligatorio eliminarlo para cumplir los CA de este spec, pero se detectó durante la exploración (ver "Decisiones de Diseño").
- **Gaps entre frontend y backend:** ninguno; este spec no toca contratos de API.
- **Persistencia pendiente de migrar:** ninguna.
- **Decisiones aplazadas:** el mapeo exacto de valores numéricos (`--radius`, tonos de `rgba`) se deja al ejecutor dentro de la guía no vinculante de "Decisiones de Diseño", para no prescribir píxeles que no existen hoy en ningún lado del código.
- **Trabajo fuera de alcance en esta iteración:** theming claro/oscuro funcional (ver arriba), enlace roto en `SearchResultsList.jsx`, eliminación de `Pages/ProductDetailPage.css`.
- **Riesgos que requieren seguimiento:** tamaño del diff (ver "Riesgos y Deuda Técnica").
- **Items que deben convertirse en backlog:** los tres puntos listados en "Comportamientos inconsistentes detectados" arriba, a decisión del orchestrator tras revisar este spec.

## Resultados (se completa al cerrar)
- Fecha de cierre: _pendiente_
- CAs cumplidos: _pendiente_
- CAs no cumplidos: _pendiente_
- Deuda técnica generada: _pendiente_
- Lecciones aprendidas: _pendiente_
- Pendientes abiertos confirmados: _pendiente_
- Gaps no resueltos: _pendiente_
- Trabajo fuera de alcance confirmado: _pendiente_
- Backlog derivado creado: _pendiente_
- Referencias a historias/tareas creadas: _pendiente_

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| _pendiente de completar al cierre_ | | |

---

## Nota de complejidad para el orchestrator

Este pendiente toca prácticamente todas las páginas con ruta de la SPA porque la causa raíz (custom properties CSS nunca definidas) está dispersa en al menos 11 archivos, más 2 archivos de código muerto y una deduplicación de componente (`CartView`). Se marca **complejidad L, cercana a XL**. Si se prefiere una unidad de trabajo más pequeña por PR, se sugiere dividir en sub-pendientes, por ejemplo:

1. Header (CA-1) + Home/ProductCard/ProductDetails (CA-2, CA-3) — el más alineado con lo que el usuario pidió primero.
2. Checkout + Cart + SearchResults (CA-5a, CA-5b, CA-5c) — los tres ejemplos explícitos del usuario.
3. Login + Register + Profile (CA-5d, CA-5e, CA-5f) + limpieza de paleta general (CA-4 para el resto de archivos).

Esta división es una sugerencia, no una decisión tomada por este subagente; queda a criterio del orchestrator aprobar el spec como una sola unidad o pedir que se re-despache dividido.
