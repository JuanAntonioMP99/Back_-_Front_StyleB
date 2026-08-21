# Spec: Grid de 3 columnas y hover en las cards de producto del Home

## Metadata
- **Tipo:** feature
- **Complejidad:** S
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** FE-HOME-GRID-HOVER-2026-08-21
- **Ejecutor:** subagente frontend-builder

## Historia

Como usuario de la tienda que navega el catálogo en `Style-Busters-main`, quiero que las cards de producto del Home se muestren en filas de 3 columnas, más compactas que hoy, y que reaccionen con un efecto simple al pasar el cursor sobre ellas, para poder explorar el catálogo con una densidad visual razonable en pantallas de escritorio, manteniendo el mismo lenguaje visual ya establecido en el resto de la SPA.

- **Específica:** implementar un grid de 3 columnas en `.list-grid` (`Style-Busters-main/src/Components/List/List.css`, hoy vacío) y reducir la altura de imagen de `.product-card--vertical` en `ProductCard.css`; verificar y preservar el efecto hover ya existente en `.product-card`. Sin tocar lógica de negocio, datos, endpoints ni componentes nuevos.
- **Medible:** criterios de aceptación CA-1 a CA-6, cada uno verificable por inspección de código/CSS y, cuando aplica, por `npm test`.
- **Alcanzable:** cambios acotados a 2 archivos `.css` reales (`List.css`, `ProductCard.css`) dentro de `Style-Busters-main/src/`; no requiere cambios de backend, de contrato de API ni de props/JSX salvo que resulte estrictamente necesario.
- **Relevante:** el usuario (dueño del repo) lo pidió explícitamente como continuación directa del pendiente de maquetación anterior (`docs/specs/2026-08-20-feature-frontend-ui-consistencia-visual.md`, DONE).
- **Temporal:** complejidad S — alcance angosto, 2 archivos, sin cambios de comportamiento funcional.

## Contexto

El pedido textual del usuario fue: mostrar los productos del Home en cards más pequeñas, en filas de 3 (hoy cada card ocupa el ancho completo horizontalmente), agregar un efecto simple de hover, y mantener la estructura/paleta ya establecida.

La exploración de código real para este spec (`Style-Busters-main/src/Pages/HomePage.jsx`, `HomePage.css`, `Components/List/List.jsx`, `List.css`, `Components/ProductCard/ProductCard.jsx`, `ProductCard.css`) confirma la causa raíz y dos hallazgos que condicionan dónde debe implementarse el cambio:

1. **`Components/List/List.css` está vacío (0 bytes).** `HomePage.jsx` renderiza el catálogo vía `<List products={products} layout="grid" />`, y `List.jsx` envuelve las cards en `<div className="list-grid">`. Como `.list-grid` no tiene ninguna regla CSS hoy, cada `<div className="product-card product-card--vertical">` se comporta como un bloque por defecto y ocupa el 100% del ancho de su contenedor padre — esto es, literalmente, la causa del comportamiento que el usuario describe ("cada una abarque toda la pantalla de manera horizontal"). No hay ningún `display: grid`/`flex` activo hoy sobre el catálogo del Home.
2. **`Style-Busters-main/src/Pages/HomePage.css` es código huérfano.** Define `.home-header`, `.home-title`, `.home-subtitle` y `.products-grid` (este último con `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`, un patrón de grid responsive real, pero no de 3 columnas fijas), pero `HomePage.jsx` **no importa este archivo** (`import "./HomePage.css"` no existe) y ninguna de esas clases aparece en el JSX de `HomePage.jsx`. Es decir: hoy `HomePage.css` no tiene ningún efecto visual — es CSS muerto, con el mismo patrón que los hallazgos de código huérfano documentados en el spec anterior (`Pages/ProductDetailPage.css`, `Components/CartView/CartView.css` antes de corregirse). Implementar el grid ahí no tendría ningún efecto observable; el archivo real y activo es `List.css`.
3. **`List.jsx` pasa `className="list-item"` a `<ProductCard>`, pero `ProductCard.jsx` (`function ProductCard({ product, orientation = "vertical" })`) nunca destructura ni aplica esa prop** — construye su propio `cardClass = "product-card product-card--${orientation}"` internamente. Cualquier CSS que se agregara sobre `.list-item` no tendría ningún efecto sobre la card renderizada; los selectores reales para dimensionar la card son `.product-card` / `.product-card--vertical`.
4. **El efecto hover que pide el usuario ya existe y está activo** en `Style-Busters-main/src/Components/ProductCard/ProductCard.css`: `.product-card:hover` (`transform: translateY(-5px)`, `box-shadow` cian, `border-color: var(--color-secondary)`), `.product-card:hover .product-card-image` (zoom `scale(1.05)`) y `.product-card-title:hover` (color `--color-primary`), todos con transiciones ya declaradas y tokens de la paleta real. No hace falta inventar un efecto nuevo: el pendiente aquí es de no-regresión y verificación tras el cambio de tamaño de card, no de creación.
5. **`Components/List/List.jsx` (el componente genérico) se reutiliza en una sola otra página:** `Components/SearchResultsList/SearchResultsList.jsx` (renderizada por `Pages/SearchResults.jsx`), siempre con `layout="vertical"` (nunca `layout="grid"`). Esto activa la rama `<div className="list-vertical">` de `List.jsx` con `orientation="horizontal"` en cada `ProductCard` — una clase de contenedor distinta (`.list-vertical`, no `.list-grid`) y una variante de card distinta (`.product-card--horizontal`, no `.product-card--vertical`). Ver CA-5 para el detalle de impacto colateral.

## Criterios de Aceptación

- [x] **CA-1 — Grid de 3 columnas en escritorio sobre el selector real (`.list-grid`).** `Style-Busters-main/src/Components/List/List.css` (hoy vacío) define `.list-grid` con `display: grid` y `grid-template-columns` que produzca exactamente 3 columnas de igual ancho en viewport ≥ 769px, más `gap` (se sugiere `2rem`, valor ya usado en el mismo patrón por el `.products-grid` huérfano de `HomePage.css` y por `.cart-items` de `Pages/CartPage.css`) y una restricción de ancho máximo reutilizando `--container-width` (`1200px`, definido en `index.css`) con `margin: 0 auto`, siguiendo el mismo patrón ya usado en `Components/SearchResultsList/SearchResultsList.css` (`.search-results-fullwidth { max-width: var(--container-width); margin: 0 auto; }`) y en `Pages/CartPage.css` (`.cart { max-width: 1200px; margin: 0 auto; }`). No se implementa nada en `HomePage.css` (ver "Decisiones de Diseño" — es código muerto, fuera de alcance). Responsive: reutilizar los breakpoints ya existentes en el repo, no inventar valores nuevos — `768px` (el más repetido: `Header.css`, `Navigation.css`, `Layout.css`, `BannerCarousel.css`) reduce a 2 columnas; `480px` (usado en `LoginForm.css`/`RegisterForm.css` para el caso mobile) reduce a 1 columna. Verificable: en escritorio (`≥769px`) `.list-grid` computa 3 columnas iguales; en `≤768px`, 2; en `≤480px`, 1; inspección de código confirma que no se agregó ninguna regla en `HomePage.css`.

- [x] **CA-2 — Tamaño de card reducido de forma coherente con el nuevo ancho de columna.** `.product-card--vertical .product-card-image` (`ProductCard.css`, hoy `height: 280px`) reduce su altura a `220px` — valor ya usado en el mismo archivo (breakpoint móvil de `.product-card--horizontal .product-card-image-link`, línea ~134), reutilizado en vez de introducir un valor arbitrario nuevo. Justificación numérica: con `--container-width: 1200px`, `gap: 2rem` (32px) entre 3 columnas y el padding del contenedor, cada columna resulta en aproximadamente 350-370px de ancho — una imagen de `220px` de alto mantiene una proporción de card compacta y coherente (`object-fit: cover` ya definido evita distorsión). El resto de `.product-card--vertical` (padding `1.25rem`, tipografía, botón) no se modifica salvo que el ejecutor detecte overflow real de contenido dentro de la columna angosta, en cuyo caso debe reutilizar patrones ya existentes en el propio `ProductCard.jsx` (p. ej. el truncado de descripción con `substring(0, 60)` ya implementado) y no inventar mecanismos nuevos. Verificable: `.product-card--vertical .product-card-image { height: 220px; }` en el CSS resultante; 3 cards caben en una fila sin overflow horizontal en viewport de escritorio estándar (1280px/1440px).

- [x] **CA-3 — Efecto hover preservado y verificado (no inventado).** `ProductCard.css` ya implementa un efecto hover completo y activo (`.product-card:hover` con `translateY(-5px)` + `box-shadow` cian + `border-color: var(--color-secondary)`; `.product-card:hover .product-card-image` con `scale(1.05)`; `.product-card-title:hover` con `color: var(--color-primary)`), con transiciones ya declaradas en `.product-card`, `.product-card-image` y `.product-card-title`. Este pendiente no requiere crear un efecto nuevo: el CA exige que, tras CA-1/CA-2, ese hover se mantenga intacto y siga siendo perceptible sobre las cards más pequeñas, sin overrides contradictorios agregados en `List.css`. Si el ejecutor considera el efecto insuficientemente perceptible al reducir el tamaño de card, solo puede ajustar la magnitud de los valores ya existentes (p. ej. `translateY(-5px)` → `translateY(-6px)`), nunca introducir un color, sombra o timing de un lenguaje visual distinto al ya usado en el archivo. Verificable: `.product-card:hover`, `.product-card:hover .product-card-image` y `.product-card-title:hover` siguen presentes en `ProductCard.css` sin overrides que los anulen desde `List.css`; `npm test -- ProductCard` sigue pasando sin cambios de comportamiento funcional.

- [x] **CA-4 — Paleta sin cambios.** Ningún valor de color agregado o modificado en `List.css`/`ProductCard.css` por este pendiente introduce un color fuera de los tokens `--color-*` definidos en `:root` de `index.css` o de los valores neutros ya usados en el repo (p. ej. `rgba(255,255,255,0.1)`). Este pendiente es de dimensiones/layout, no se espera que requiera declarar ningún color nuevo. Verificable: `git diff` de los archivos tocados no contiene ningún literal hex/rgb/nombre de color fuera de la paleta documentada en `index.css`.

- [x] **CA-5 — Impacto colateral en páginas que reutilizan `List`/`ProductCard`, declarado explícitamente.** `Components/List/List.jsx` se reutiliza en `Components/SearchResultsList/SearchResultsList.jsx` (vía `Pages/SearchResults.jsx`), pero siempre con `layout="vertical"` — esto renderiza `<div className="list-vertical">` con `ProductCard orientation="horizontal"`, un selector de contenedor (`.list-vertical`) y una variante de card (`.product-card--horizontal`) distintos de los que toca este pendiente (`.list-grid`, `.product-card--vertical`). En consecuencia:
  - Sin impacto: el grid de 3 columnas de CA-1 no aplica a `SearchResults`, porque esa página nunca renderiza `.list-grid`.
  - Sin impacto: la reducción de altura de imagen de CA-2 se limita al selector `.product-card--vertical .product-card-image`; `SearchResults` usa `.product-card--horizontal .product-card-image-link { height: 100%; }`, no tocado por este spec.
  - Impacto esperado y sin cambio de comportamiento: el hover de CA-3 (`.product-card:hover`, sin sufijo de orientación) es una regla compartida entre ambas orientaciones y ya se aplicaba en `SearchResults` antes de este pendiente; como no se modifica, no hay cambio observable ahí.
  Verificable: tras el cambio, `Pages/SearchResults.jsx` no cambia visualmente salvo por el hover ya preexistente (no tocado por este pendiente).

- [x] **CA-6 — Sin contenido inventado.** Los cambios se limitan a `List.css` y `ProductCard.css`. No se agrega texto, dato, prop de negocio, componente nuevo, ruta ni llamada a servicio que no exista ya. No se reactiva ni se modifica `HomePage.css` (código huérfano, fuera de alcance — ver "Decisiones de Diseño" y "Pendientes Abiertos"). Si el ejecutor determina que es estrictamente necesario un ajuste mínimo de JSX (p. ej. algo no detectado en esta exploración), debe limitarse a lo indispensable para aplicar el CSS y registrarlo explícitamente en la entrega.

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna aplica — este pendiente es exclusivamente de presentación (2 archivos CSS), sin tocar autenticación, autorización, validación de inputs, llamadas a la API, manejo de tokens ni persistencia. Justificación por categoría:
  - **Spoofing:** N/A. No se toca `AuthContext`, `ProtectedRoute` ni `utils/auth.js`.
  - **Tampering:** N/A. No se modifican payloads enviados a la API (`Services/productService.js` no se toca) ni ninguna validación de backend.
  - **Repudiation:** N/A. No se toca logging ni auditoría.
  - **Information Disclosure:** N/A. No se agrega ni se quita ningún dato mostrado; `product.name`, `product.price`, `product.stock`, `product.description` ya se muestran hoy y siguen mostrándose igual, solo cambia su tamaño/disposición visual.
  - **Denial of Service:** N/A. Los cambios son CSS estático puro; no se agregan bucles, timers, listeners ni llamadas de red nuevas.
  - **Elevation of Privilege:** N/A. No se modifica `ProtectedRoute.jsx` ni ninguna ruta protegida; el Home es público.
- **Controles de mitigación:** ninguno adicional requerido.
- **Inputs que requieren validación:** ninguno nuevo.
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** ninguna (cambio puramente de presentación en el cliente, sin nuevas llamadas de red ni nuevo manejo de datos).

## Dependencias

- **Internas** (archivos reales, `Style-Busters-main/src/` salvo que se indique lo contrario):
  - `Components/List/List.css` — CA-1 (archivo objetivo principal, hoy vacío)
  - `Components/List/List.jsx` (solo lectura de referencia — confirma que `.list-grid` es el selector real renderizado y que la prop `className="list-item"` se descarta) — CA-1, CA-6
  - `Components/ProductCard/ProductCard.css` — CA-2, CA-3, CA-4
  - `Components/ProductCard/ProductCard.jsx` (solo lectura de referencia — confirma `cardClass` interno y el truncado de descripción ya existente) — CA-2, CA-3
  - `Pages/HomePage.jsx` (solo lectura de referencia — confirma que no importa `HomePage.css` y que renderiza `<List layout="grid" />`) — CA-1, CA-6
  - `Pages/HomePage.css` (solo lectura de referencia — confirma que es código huérfano; no se toca) — CA-1, CA-6 (fuera de alcance, ver Decisiones de Diseño)
  - `Components/SearchResultsList/SearchResultsList.jsx`, `Pages/SearchResults.jsx` (solo lectura de referencia — confirman el único otro consumidor de `List`, siempre con `layout="vertical"`) — CA-5
  - `index.css` — fuente de verdad de la paleta (`:root`) y de `--container-width`/`--spacing-md`; solo se lee, no se espera modificar
  - `Components/ProductCard/ProductCard.test.jsx` — solo lectura de referencia (confirma que ningún test actual asserta tamaños/pixeles de card ni estructura de grid, por lo que no se espera que este pendiente rompa tests existentes)
- **Externas:** ninguna librería nueva. No hay cambios de `package.json` en `Style-Busters-main`.

## Decisiones de Diseño

- **El archivo objetivo es `List.css`, no `HomePage.css`.** `HomePage.css` define `.products-grid` con un patrón de grid responsive (`repeat(auto-fill, minmax(300px, 1fr))`), pero nunca se importa desde `HomePage.jsx` ni sus clases aparecen en el JSX — es CSS muerto sin ningún efecto observable, con el mismo patrón que los hallazgos de código huérfano ya documentados en el spec anterior (`ProductDetailPage.css`, `CartView.css` antes de corregirse). Implementar el grid ahí sería no-operativo. El selector realmente renderizado por `List.jsx` cuando `HomePage.jsx` pasa `layout="grid"` es `.list-grid`, dentro de `List.css` (hoy vacío) — ese es el archivo que este pendiente modifica.
- **`.list-item` no es un selector válido para dimensionar la card.** `List.jsx` pasa `className="list-item"` a cada `<ProductCard>`, pero `ProductCard.jsx` no consume esa prop (`function ProductCard({ product, orientation = "vertical" })`, sin `className` en la firma) — construye su propio `cardClass` internamente. Cualquier regla sobre `.list-item` no tendría efecto sobre el DOM real; CA-1/CA-2 deben apuntar a `.list-grid` (contenedor, para la definición del grid) y a `.product-card`/`.product-card--vertical` (para el tamaño de la card), nunca a `.list-item`.
- **Derivación del ancho de columna y de la altura de imagen (CA-2):** con `--container-width: 1200px`, `gap: 2rem` (32px, valor ya usado en el `.products-grid` huérfano de `HomePage.css` y en `.cart-items` de `CartPage.css`) entre 3 columnas y el padding lateral del contenedor (siguiendo el patrón de `.search-results-fullwidth`/`.cart`), cada columna resulta en aproximadamente 350-370px de ancho. Se propone reducir `.product-card--vertical .product-card-image` de `280px` a `220px` de alto — valor ya presente en el mismo archivo (`.product-card--horizontal .product-card-image-link` en el breakpoint `max-width: 600px`), reutilizado en vez de introducir un número nuevo sin precedente en el repo.
- **Breakpoints reutilizados, no inventados:** `768px` (el más repetido en el repo: `Header.css`, `Navigation.css`, `Layout.css`, `BannerCarousel.css`) para pasar de 3 a 2 columnas, y `480px` (usado en `LoginForm.css`/`RegisterForm.css` para el caso mobile) para pasar a 1 columna. `List.css` no tenía ningún patrón responsive propio (estaba vacío), por lo que se sigue el patrón ya establecido en el resto del código base en vez de definir breakpoints nuevos.
- **El hover no se inventa, se verifica.** `ProductCard.css` ya contiene un efecto hover completo, activo y coherente con la paleta (`.product-card:hover`, zoom de imagen, color de título). El pedido del usuario de "agregar un efecto sencillo" ya está satisfecho por código existente; este spec lo trata como CA de no-regresión (CA-3), no de creación, evitando duplicar o reemplazar un efecto que ya cumple el objetivo.

## Riesgos y Deuda Técnica

- Riesgo bajo: es la primera vez que `.list-grid` recibe CSS real (antes no tenía ninguno); al no haber otro consumidor de esa clase (confirmado por grep, CA-5), no hay riesgo de regresión cruzada.
- Riesgo bajo: reducir `.product-card--vertical .product-card-image` a `220px` podría recortar de forma distinta imágenes con relación de aspecto muy alejada de la actual, pero `object-fit: cover` ya está declarado y absorbe ese caso sin distorsión (mismo mecanismo ya usado en el resto del archivo).
- No se genera deuda técnica nueva; es un ajuste de dimensiones sobre CSS existente/vacío, no una reestructuración.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna (este pendiente no agrega funcionalidad).
- **Comportamientos inconsistentes detectados (fuera de alcance de este spec, candidatos a backlog separado):**
  - `Pages/HomePage.css` es código huérfano: no se importa desde `HomePage.jsx`, y ninguna de sus clases (`.home-header`, `.home-title`, `.home-subtitle`, `.products-grid`) aparece en el JSX. No se corrige en este pendiente (el fix real va en `List.css`, ver CA-1/Decisiones de Diseño); se deja registrado como candidato a limpieza de código muerto, en la misma línea que `Pages/ProductDetailPage.css` (ya registrado como pendiente en el spec anterior).
  - `Components/List/List.jsx` pasa `className="list-item"` a `<ProductCard>`, prop que `ProductCard.jsx` nunca consume — prop muerta, sin efecto. No se corrige en este pendiente (no fue pedido y no bloquea el grid); se registra como hallazgo.
  - `List.jsx` recibe también una prop `titile` (typo, en vez de `title`) que nunca se usa en el render (ya documentado en `Pages/HomePage.integration.test.jsx` como nota de test) — no se corrige en este pendiente, no relacionado con el grid/hover pedido.
- **Gaps entre frontend y backend:** ninguno; este spec no toca contratos de API.
- **Persistencia pendiente de migrar:** ninguna.
- **Decisiones aplazadas:** el valor exacto de `gap`/padding lateral del `.list-grid` (se sugiere `2rem`/`var(--spacing-md)` como guía no vinculante, ver Decisiones de Diseño) se deja al ejecutor dentro de los límites de CA-1 (debe producir exactamente 3 columnas en escritorio).
- **Trabajo fuera de alcance en esta iteración:** limpieza de `HomePage.css` huérfano, corrección de la prop muerta `className="list-item"`, corrección del typo `titile` en `List.jsx`. Ninguno de los tres bloquea el cumplimiento de los CA de este spec.
- **Riesgos que requieren seguimiento:** ninguno más allá de lo listado en "Riesgos y Deuda Técnica".
- **Items que deben convertirse en backlog:** los tres puntos de "Comportamientos inconsistentes detectados" arriba, a decisión del orchestrator tras revisar este spec.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21
- **Estado final:** DONE
- **CAs cumplidos:** los 6 — CA-1, CA-2, CA-3, CA-4, CA-5, CA-6. Implementados en PR #12 (merge commit `974f59fd`, más commit de evidencia `fe77d32b`) sobre `develop`. A diferencia del pendiente anterior (`2026-08-20-feature-frontend-ui-consistencia-visual`, 4 hallazgos), la implementación fue limpia desde el primer intento: ninguna de las 4 capas de revisión (anti-hallucination-reviewer, qa-test-designer, security-reviewer, code-reviewer) reportó hallazgos que corregir; `tech-reviewer` dictaminó APTO.
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna.
- **Lecciones aprendidas:** un pendiente pequeño y bien acotado (2 archivos CSS) tuvo cero hallazgos en las 4 capas de revisión, en contraste con el pendiente anterior de mayor alcance (13 CAs, 4 hallazgos). Sugiere que acotar el alcance por pendiente reduce el ratio de correcciones necesarias.
- **Pendientes abiertos confirmados:** los 3 ya documentados en este spec bajo "Pendientes Abiertos y Gaps Detectados" — quedan fuera de alcance de este pendiente y se derivan a backlog (ver más abajo):
  1. `Pages/HomePage.css` — código huérfano, no importado por `HomePage.jsx`.
  2. `Components/List/List.jsx` pasa `className="list-item"` a `<ProductCard>`, prop muerta que `ProductCard.jsx` nunca consume.
  3. `List.jsx` recibe una prop `titile` (typo de `title`) que nunca se usa en el render.
- **Gaps no resueltos:** ninguno dentro del alcance de este spec.
- **Trabajo fuera de alcance confirmado:** los mismos 3 puntos de arriba — explícitamente NO implementados en este PR (limpieza de `HomePage.css`, corrección de la prop muerta `className="list-item"`, corrección del typo `titile`).
- **Backlog derivado creado:** sí — 3 entradas nuevas en [`docs/backlog.md`](../backlog.md), épica E5 (Arranque y coherencia del frontend):
  - `FE-DEAD-CSS-HOMEPAGE-2026-08-21`
  - `FE-DEAD-PROP-LISTITEM-2026-08-21`
  - `FE-TYPO-TITILE-2026-08-21`
- **Referencias a historias/tareas creadas:**
  - PR #12 — https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/12
  - Spec: [`docs/specs/2026-08-21-feature-home-product-grid-hover.md`](2026-08-21-feature-home-product-grid-hover.md) (este documento)
  - Plan de prueba: [`docs/test-plans/2026-08-21-feature-home-product-grid-hover.md`](../test-plans/2026-08-21-feature-home-product-grid-hover.md)
  - Backlog: [`docs/backlog.md`](../backlog.md)

## Matriz de cierre
| Item detectado | Detectado por | Estado | Acción |
|---|---|---|---|
| Implementado sin hallazgos (CA-1 a CA-6) | anti-hallucination-reviewer, qa-test-designer, security-reviewer, code-reviewer, tech-reviewer (APTO) | Confirmado | Cerrar |
