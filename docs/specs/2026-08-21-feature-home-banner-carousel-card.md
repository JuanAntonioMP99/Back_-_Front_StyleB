# Spec: Carrusel principal del Home contenido en tratamiento tipo "card grande"

## Metadata
- **Tipo:** feature
- **Complejidad:** XS
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** FE-HOME-BANNER-CARD-2026-08-21
- **Ejecutor:** subagente frontend-builder

## Historia

Como usuario de la tienda que visita el Home de `Style-Busters-main`, quiero que el carrusel principal (`BannerCarousel`) deje de ocupar el ancho completo de la pantalla de borde a borde y en su lugar se muestre contenido dentro de un marco tipo "card grande" (con margen respecto a los bordes del viewport en escritorio y un tratamiento visual de borde/radio/sombra coherente con el resto del sitio), para que la portada del Home se perciba más elegante y consistente con el lenguaje visual ya usado en el resto de la SPA.

- **Específica:** modificar únicamente `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css` para que `.banner-carousel` pase de edge-to-edge (`width: 100%` sin límite) a un contenedor centrado con `max-width` y tratamiento visual de card, reutilizando valores ya existentes en el repo (ver CA-1/CA-2 y "Decisiones de Diseño"). Sin tocar `BannerCarousel.jsx`, `HomePage.jsx` ni ningún dato/prop.
- **Medible:** criterios de aceptación CA-1 a CA-5, cada uno verificable por inspección de código/CSS y, cuando aplica, por `npm test`.
- **Alcanzable:** cambio acotado a un único archivo CSS real (`BannerCarousel.css`) dentro de `Style-Busters-main/src/`; no requiere cambios de backend, de contrato de API, de props/JSX ni de datos (`Data/homeImages.json`).
- **Relevante:** el usuario (dueño del repo) lo pidió explícitamente, como continuación directa de los pendientes de maquetación ya cerrados (`2026-08-20-feature-frontend-ui-consistencia-visual`, `2026-08-21-feature-home-product-grid-hover`), con la misma restricción de "no inventar, reutilizar patrones existentes".
- **Temporal:** complejidad XS — un solo archivo CSS, sin cambios estructurales de JSX, sin cambios de lógica ni de datos.

## Contexto

El pedido textual del usuario fue: que el carrusel principal del Home deje de abarcar toda la pantalla horizontalmente y se vea contenido dentro de un marco tipo "card grande", con borde hacia las orillas del viewport, para una apariencia más elegante.

La exploración de código real para este spec confirma la causa raíz y el punto exacto de intervención:

1. **`Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css` (`.banner-carousel`, líneas 11-18) declara `width: 100%; height: var(--carousel-height); background-color: #000; overflow: hidden; margin-bottom: 2rem;` — sin `max-width` ni `margin: 0 auto` horizontal.** No hay ningún `border-radius` ni `border` ni `box-shadow` en el contenedor raíz hoy.
2. **`Style-Busters-main/src/Pages/HomePage.jsx` renderiza `<BannerCarousel banners={homeImages} />` como primer hijo directo del `<div>` raíz de la página**, sin ningún wrapper con `max-width`.
3. **`Style-Busters-main/src/Layout/Layout.jsx` (`<div className="layout"><Header />{children}<Footer /></div>`) tampoco envuelve `{children}` en ningún contenedor con ancho limitado.** `Style-Busters-main/src/Layout/Layout.css` sí define una clase `.main-content` con `max-width: 1400px; margin: 0 auto; padding: clamp(16px, 3vw, 32px);` (líneas 10-16), pero **esa clase nunca se aplica en ningún JSX del repo** (confirmado por búsqueda: `.main-content` solo aparece en `Layout.css`, en ningún `.jsx`) — es CSS huérfano, con el mismo patrón de código muerto ya documentado en specs anteriores (`Pages/HomePage.css`, `Pages/ProductDetailPage.css`). Esto confirma que la única vía real y con efecto observable para contener el carrusel es actuar directamente sobre `.banner-carousel` en `BannerCarousel.css` — no sobre `Layout.css` (fuera de alcance, ver "Decisiones de Diseño").
4. **El patrón "`max-width: var(--container-width); margin: 0 auto;`" ya está establecido y repetido en el repo** para contener elementos que hoy son edge-to-edge: `.cart` (`Pages/CartPage.css`, `max-width: 1200px; margin: 0 auto;`), `.search-results-fullwidth` (`Components/SearchResultsList/SearchResultsList.css`, `max-width: var(--container-width); margin: 0 auto;`), y `.list-grid` (`Components/List/List.css`, implementado en el spec `2026-08-21-feature-home-product-grid-hover.md`, mismo patrón). `--container-width: 1200px` está definido en `:root` de `Style-Busters-main/src/index.css`.
5. **El lenguaje visual de "card" (borde + radio + sombra) ya está establecido y repetido en el repo** con valores concretos reutilizables (ver CA-2 y "Decisiones de Diseño" para el detalle exacto de cada archivo de referencia).
6. **`BannerCarousel.jsx` ya tiene `overflow: hidden` en `.banner-carousel`** (línea 16 de `BannerCarousel.css`), y todo el contenido visual del carrusel (imágenes, overlay, texto, controles, indicadores, barra de progreso, contador) está posicionado de forma absoluta dentro de ese contenedor. Esto significa que añadir `border-radius` a `.banner-carousel` recorta correctamente todo el contenido sin necesidad de tocar ningún elemento hijo — el mismo mecanismo ya usado en `.product-card` (`ProductCard.css`, `overflow: hidden` + `border-radius: 12px` recortando `.product-card-image`).
7. **`BannerCarousel.test.jsx` (3 tests: estado vacío, render de contenido, controles con varios banners) no hace ninguna aserción sobre estilos, clases CSS ni dimensiones** — solo sobre texto/roles accesibles (`getByText`, `getByRole`). Esto confirma que un cambio puramente de `BannerCarousel.css` no puede romper esos tests.

## Criterios de Aceptación

- [x] **CA-1 — El carrusel deja de ser edge-to-edge en escritorio.** `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css`, regla `.banner-carousel`, agrega `max-width: var(--container-width);` (reutilizando el token `--container-width: 1200px` de `index.css`, el mismo usado por `.cart`, `.search-results-fullwidth` y `.list-grid`) y cambia `margin-bottom: 2rem;` por `margin: 0 auto 2rem;` (centra horizontalmente preservando el margen inferior existente). `width: 100%` se conserva sin cambios (permite que el elemento use hasta `max-width` y se comprima en viewports menores). Verificable: en un viewport de escritorio estándar mayor a 1200px (p. ej. 1440px o 1920px), `.banner-carousel` computa un ancho de 1200px centrado, con espacio visible a ambos lados respecto al borde del viewport; `git diff` de `BannerCarousel.css` muestra únicamente la adición de `max-width` y el cambio de `margin-bottom` a `margin` shorthand, sin otras propiedades de layout alteradas.

- [x] **CA-2 — Tratamiento visual tipo "card" coherente con el resto del repo, sin colores nuevos.** La misma regla `.banner-carousel` agrega, reutilizando valores literales ya presentes en el repo (sin inventar ningún número ni color nuevo):
  - `border-radius: 12px;` — mismo valor ya usado en `Components/ProductCard/ProductCard.css` (línea 3, `.product-card`), `Layout/Header/Header.css` (línea 303, panel desplegable), `Components/Common/Loading/Loading.css` (línea 8) y `Pages/ProductDetailPage.css` (línea 19).
  - `border: 1px solid rgba(255, 255, 255, 0.1);` — mismo valor ya usado en `Components/Common/Loading/Loading.css` (línea 9), `Pages/CartPage.css` (línea 13, borde de `.cart-header`) y `Components/SearchResultsList/SearchResultsList.css` (línea 61, borde de `.search-results-controls select`).
  - `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);` — mismo valor ya usado (como sombra estática, no solo de `:hover`) en `Components/ProfileCard/ProfileCard.css` (línea 12) y `Components/Common/Loading/Loading.css` (línea 10).
  El `overflow: hidden;` ya existente en `.banner-carousel` (línea 16, sin cambios) garantiza que el `border-radius` recorte correctamente todo el contenido interno (imágenes, overlay, controles, barra de progreso, contador) sin necesidad de modificar ningún elemento hijo ni ninguna otra regla del archivo. `background-color: #000;` (línea 15, preexistente, no introducido por este pendiente) se mantiene sin cambios — es la capa de respaldo detrás de las imágenes del carrusel, no la superficie visible de la "card" (que queda cubierta por las imágenes en todo momento salvo micro-instantes de carga), por lo que no se considera un color nuevo introducido por este spec. Verificable: `git diff` de `BannerCarousel.css` no contiene ningún literal hex/rgb/rgba distinto de los tres arriba, y los tres coinciden carácter por carácter con los valores citados de los archivos de referencia.

- [x] **CA-3 — El carrusel sigue siendo funcional (no-regresión).** Auto-avance cada 5000ms, navegación con flechas prev/next, indicadores (`role="tablist"`), barra de progreso, contador numérico, precarga de slide siguiente (`mountedSlides`) y atributos de accesibilidad (`aria-label`, `aria-hidden`, `aria-selected`) de `BannerCarousel.jsx` no se modifican: este pendiente no toca ningún archivo `.jsx`. Verificable: `npm test -- BannerCarousel` (dentro de `Style-Busters-main/`) sigue pasando sin ninguna modificación a `BannerCarousel.test.jsx` ni a `BannerCarousel.jsx`.

- [x] **CA-4 — Responsive razonable, sin introducir valores nuevos de breakpoint.** No se agrega ningún breakpoint ni valor de margen lateral nuevo específico para móvil. Por debajo de `max-width: var(--container-width)` (1200px), el carrusel ocupa el 100% del ancho disponible igual que hoy (comportamiento sin regresión, sin margen lateral "absurdo" añadido ni quitado respecto al comportamiento actual); el breakpoint ya existente `@media (max-width: 768px)` (líneas 219-232 de `BannerCarousel.css`, que reduce `--carousel-height` a `400px` y ajusta `.banner-title`/`.carousel-btn`) no se modifica ni se le agregan reglas nuevas. El `border-radius`/`border`/`box-shadow` de CA-2 se aplican de forma uniforme en todos los tamaños de viewport (mismo patrón que `.product-card`, que no varía su radio por breakpoint). Verificable: `git diff` de `BannerCarousel.css` no agrega ningún bloque `@media` nuevo ni modifica el bloque `@media (max-width: 768px)` existente.

- [x] **CA-5 — Sin contenido inventado.** El cambio se limita a `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css`. No se agrega texto, dato, prop, componente nuevo, ruta ni llamada a servicio. No se modifica `BannerCarousel.jsx`, `HomePage.jsx`, `Data/homeImages.json` ni `Layout.css` (el hallazgo de `.main-content` huérfano en `Layout.css`, ver "Contexto" punto 3, queda explícitamente fuera de alcance — ver "Pendientes Abiertos y Gaps Detectados"). Verificable: `git diff` del PR resultante solo contiene cambios en `BannerCarousel.css`.

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna aplica — este pendiente es exclusivamente de presentación (un único archivo CSS), sin tocar autenticación, autorización, validación de inputs, llamadas a la API, manejo de tokens ni persistencia. Justificación por categoría:
  - **Spoofing:** N/A. No se toca `AuthContext`, `ProtectedRoute` ni `utils/auth.js`.
  - **Tampering:** N/A. No se modifica ningún payload enviado a la API; `BannerCarousel` no consume ningún servicio (`banners` llega como prop estática desde `Data/homeImages.json`, no tocado).
  - **Repudiation:** N/A. No se toca logging ni auditoría.
  - **Information Disclosure:** N/A. No se agrega ni se quita ningún dato mostrado; el contenido de cada banner (`title`, `subtitle`, `buttonText`, `image`) sigue siendo exactamente el mismo, solo cambia su tamaño/marco visual.
  - **Denial of Service:** N/A. El cambio es CSS estático puro; no se agregan bucles, timers, listeners ni llamadas de red nuevas. No se toca el mecanismo de precarga de slides (`mountedSlides`) ni `loading`/`fetchPriority` de las imágenes.
  - **Elevation of Privilege:** N/A. El Home y su carrusel son públicos; no se modifica `ProtectedRoute.jsx` ni ninguna ruta protegida.
- **Controles de mitigación:** ninguno adicional requerido.
- **Inputs que requieren validación:** ninguno nuevo.
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** ninguna (cambio puramente de presentación en el cliente, sin nuevas llamadas de red ni nuevo manejo de datos).

## Dependencias

- **Internas** (archivos reales, `Style-Busters-main/src/` salvo que se indique lo contrario):
  - `Components/BannerCarousel/BannerCarousel.css` — archivo objetivo único de este pendiente (CA-1, CA-2, CA-4).
  - `Components/BannerCarousel/BannerCarousel.jsx` (solo lectura de referencia — confirma que todo el contenido está posicionado de forma absoluta dentro de `.banner-carousel`, y que ninguna prop ni handler necesita cambiar) — CA-3, CA-5.
  - `Components/BannerCarousel/BannerCarousel.test.jsx` (solo lectura de referencia — confirma que no hay aserciones de CSS/clases que puedan romperse) — CA-3.
  - `Pages/HomePage.jsx` (solo lectura de referencia — confirma que `BannerCarousel` se renderiza sin wrapper propio) — CA-1, CA-5.
  - `Layout/Layout.jsx`, `Layout/Layout.css` (solo lectura de referencia — confirman que `.main-content` con `max-width` existe en CSS pero nunca se aplica en JSX, es decir, no es una vía válida de intervención) — CA-1 (justifica por qué el fix va en `BannerCarousel.css`, no en `Layout.css`).
  - `index.css` — fuente de verdad de `--container-width` (1200px); solo se lee, no se espera modificar — CA-1.
  - `Components/ProductCard/ProductCard.css`, `Layout/Header/Header.css`, `Components/Common/Loading/Loading.css`, `Pages/ProductDetailPage.css`, `Pages/CartPage.css`, `Components/SearchResultsList/SearchResultsList.css`, `Components/ProfileCard/ProfileCard.css` (solo lectura de referencia — fuente de los valores exactos de `border-radius`/`border`/`box-shadow` reutilizados en CA-2) — CA-2.
- **Externas:** ninguna librería nueva. No hay cambios de `package.json` en `Style-Busters-main`.

## Decisiones de Diseño

- **El archivo objetivo es `BannerCarousel.css`, no `Layout.css`.** `Layout.css` define `.main-content` con `max-width: 1400px; margin: 0 auto;`, un patrón similar al que se busca, pero esa clase nunca se aplica en ningún JSX del repo (confirmado por búsqueda de texto) — es CSS huérfano, con el mismo patrón de código muerto ya documentado en specs anteriores. Aplicarla no tendría ningún efecto observable; además, aplicarla afectaría a *todas* las páginas del Layout (no solo al carrusel), lo cual excede el alcance pedido por el usuario ("el diseño del carrusel principal"). El punto de intervención correcto y mínimo es `.banner-carousel` en `BannerCarousel.css`.
- **`--container-width` (1200px), no 1400px de `.main-content`.** Se reutiliza `--container-width` de `index.css` (1200px) en vez del `1400px` hardcodeado en el `.main-content` huérfano, porque `--container-width` es el token real y activo ya usado de forma consistente en `.cart`, `.search-results-fullwidth` y `.list-grid` — es la "unidad de ancho de contenido" vigente del repo, mientras que `1400px` en `Layout.css` nunca tuvo efecto real y no es un valor validado en producción.
- **Sin wrapper JSX adicional.** Se descartó envolver `<BannerCarousel>` en un `<div>` contenedor nuevo dentro de `HomePage.jsx` (alternativa considerada): aplicar `max-width`/`margin: 0 auto` directamente sobre `.banner-carousel` logra el mismo resultado visual sin tocar ningún archivo `.jsx`, siguiendo el principio de mínimo cambio y coherente con cómo `.cart`/`.search-results-fullwidth` aplican el mismo patrón directamente sobre su contenedor raíz existente, sin wrapper adicional.
- **Sin margen lateral adicional en viewports menores a 1200px (mobile incluido).** Se consideró añadir `padding` horizontal a `.banner-carousel` para garantizar un margen mínimo también en viewports intermedios/móviles, pero se descartó porque: (a) el usuario acotó el pedido a la apariencia "de pantalla" general sin mencionar mobile explícitamente, y el orchestrator acotó CA-1 a escritorio; (b) `padding` sobre `.banner-carousel` empujaría el contenido (imágenes con `width:100%; height:100%` relativas al contenedor) hacia adentro del borde de forma asimétrica respecto al patrón vertical existente, requiriendo tocar los elementos hijos posicionados de forma absoluta — cambio no solicitado y fuera del alcance mínimo; (c) el comportamiento resultante en mobile (edge-to-edge, igual que hoy) es una no-regresión explícita, no un empeoramiento, y sigue el mismo patrón que `.cart`/`.search-results-fullwidth`/`.list-grid`, ninguno de los cuales introduce un margen lateral adicional específico para mobile más allá de su propio `padding` interno de contenido (que en el caso del carrusel no aplica, por ser una "card" con borde visible, no un contenedor de texto).
- **`border-radius: 12px` uniforme en todos los breakpoints.** Se descartó reducir o quitar el radio en mobile: `.product-card` (la referencia de "card" más usada en el repo) tampoco varía su `border-radius` por breakpoint, y el valor de 12px es lo suficientemente pequeño para no generar artefactos visuales relevantes incluso cuando el carrusel toca los bordes del viewport en mobile.

## Riesgos y Deuda Técnica

- Riesgo bajo: en viewports entre ~769px y ~1200px, el carrusel seguirá ocupando el 100% del ancho disponible (sin margen lateral, ver "Decisiones de Diseño"), por lo que el efecto "card con borde a las orillas" solo es plenamente visible en viewports superiores a 1200px (resoluciones de escritorio estándar: 1280px, 1366px, 1440px, 1920px). Si el usuario esperaba ver el efecto también en laptops de 1024-1200px, este spec no lo cubre — mismo patrón de limitación ya aceptado en `.cart`/`.search-results-fullwidth`/`.list-grid`, no es una limitación nueva introducida por este pendiente.
- No se genera deuda técnica nueva; es un ajuste de 3-4 propiedades CSS sobre una regla existente, sin reestructuración.
- Se detecta (no se corrige) que `.main-content` en `Layout.css` es CSS huérfano — mismo patrón de hallazgo ya registrado como backlog en specs anteriores para otros archivos (`FE-DEAD-CSS-HOMEPAGE-2026-08-21`, `FE-DEAD-CSS-PRODUCTDETAILPAGE-2026-08-20`).

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna (este pendiente no agrega funcionalidad).
- **Comportamientos inconsistentes detectados (fuera de alcance de este spec, candidato a backlog separado):**
  - `Layout/Layout.css` define `.main-content` (`max-width: 1400px; margin: 0 auto; padding: clamp(...)`) que nunca se aplica en ningún JSX del repo — CSS huérfano, mismo patrón que los ya registrados en backlog (`FE-DEAD-CSS-HOMEPAGE-2026-08-21`, `FE-DEAD-CSS-PRODUCTDETAILPAGE-2026-08-20`). No se corrige en este pendiente (no fue pedido y no bloquea el CA de este spec); se registra como hallazgo nuevo.
- **Gaps entre frontend y backend:** ninguno; este spec no toca contratos de API.
- **Persistencia pendiente de migrar:** ninguna.
- **Decisiones aplazadas:** ninguna adicional a las ya documentadas en "Decisiones de Diseño" (ausencia de margen lateral en viewports 769-1200px, uniformidad del `border-radius` en todos los breakpoints).
- **Trabajo fuera de alcance en esta iteración:** limpieza de `.main-content` huérfano en `Layout.css`.
- **Riesgos que requieren seguimiento:** ninguno más allá de lo listado en "Riesgos y Deuda Técnica".
- **Items que deben convertirse en backlog:** el hallazgo de `.main-content` huérfano arriba, a decisión del orchestrator tras revisar este spec.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21
- **Estado final:** DONE
- **CAs cumplidos:** los 5 — CA-1, CA-2, CA-3, CA-4, CA-5. Implementados en PR #15 (merge commit `35f38038`) sobre `develop`. Igual que el pendiente inmediatamente anterior (`2026-08-21-feature-home-product-grid-hover`), la implementación fue limpia desde el primer intento: ninguna de las 4 capas de revisión (anti-hallucination-reviewer, qa-test-designer, security-reviewer, code-reviewer) reportó hallazgos que corregir; `tech-reviewer` dictaminó APTO. Esto contrasta con `2026-08-20-feature-frontend-ui-consistencia-visual`, que sí tuvo hallazgos y rondas de corrección.
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna.
- **Lecciones aprendidas:** un pendiente pequeño y bien acotado (XS, 1 archivo CSS) tuvo cero hallazgos en las 4 capas de revisión, reforzando el patrón ya observado en `FE-HOME-GRID-HOVER` (a diferencia de `FE-UI-CONSISTENCY`, que sí tuvo hallazgos): acotar el alcance por pendiente reduce el ratio de correcciones necesarias.
- **Pendientes abiertos confirmados:** 1 — `Layout/Layout.css` define `.main-content` (`max-width: 1400px; margin: 0 auto; padding: clamp(16px, 3vw, 32px);`) que nunca se aplica en ningún JSX del repo, CSS huérfano, mismo patrón que los hallazgos ya registrados en backlog (`FE-DEAD-CSS-HOMEPAGE-2026-08-21`, `FE-DEAD-CSS-PRODUCTDETAILPAGE-2026-08-20`).
- **Gaps no resueltos:** ninguno dentro del alcance de este spec.
- **Trabajo fuera de alcance confirmado:** el mismo punto de arriba — limpieza de `.main-content` huérfano en `Layout.css`, explícitamente NO implementada en este PR.
- **Backlog derivado creado:** sí — 1 entrada nueva en [`docs/backlog.md`](../backlog.md), épica E5 (Arranque y coherencia del frontend):
  - `FE-DEAD-CSS-LAYOUT-MAINCONTENT-2026-08-21`
- **Referencias a historias/tareas creadas:**
  - PR #15 — https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/15
  - Spec: [`docs/specs/2026-08-21-feature-home-banner-carousel-card.md`](2026-08-21-feature-home-banner-carousel-card.md) (este documento)
  - Plan de prueba: [`docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md`](../test-plans/2026-08-21-feature-home-banner-carousel-card.md)
  - Backlog: [`docs/backlog.md`](../backlog.md)

## Matriz de cierre
| Item detectado | Detectado por | Estado | Acción |
|---|---|---|---|
| Implementado sin hallazgos (CA-1 a CA-5) | anti-hallucination-reviewer, qa-test-designer, security-reviewer, code-reviewer, tech-reviewer (APTO) | Confirmado | Cerrar |
