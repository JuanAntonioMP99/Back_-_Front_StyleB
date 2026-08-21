# Plan de Prueba: Carrusel de imágenes en la ficha de producto (ProductDetails)

- **Spec:** `docs/specs/2026-08-21-feature-product-details-image-carousel.md`  ·  **Backlog ID:** FE-PRODUCT-DETAILS-IMAGE-CAROUSEL-2026-08-21
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`
- **Rama evaluada:** `feature/product-details-image-carousel` (4 commits: `9b6f3bbe`, `207a8c7a`, `06b1f761`, `5a7ac1ab`)

## Entorno de prueba
- Tests unitarios/componente: Vitest + Testing Library, sin backend real (mocks de `productService`/`CartContext`).
- Build: `react-scripts build` (CRA), sin servidor.
- No se requiere MongoDB ni API levantada — todos los casos verificables por lectura de código, `git diff` y `npm test`/`npm run build` dentro de `Style-Busters-main/`.

## Casos de prueba

### TC-1 — Construcción de `galleryImages` (CA-1)
- **Precondición:** `ProductDetails.jsx` importa `getProductImage` y renderiza el producto cargado.
- **Pasos:** Inspección de código, líneas 104-109 de `Style-Busters-main/src/Components/ProductDetails/ProductDetails.jsx`.
- **Dato de entrada:** `product.images` ausente / `[]` / `["https://a.test/1.jpg", "https://a.test/2.jpg"]`.
- **Resultado esperado:** `galleryImages = [getProductImage(product), ...product.images.filter(isNonEmptyString)]`, con `Array.isArray` guard.
- **Resultado real:**
  ```js
  const galleryImages = [
    getProductImage(product),
    ...(Array.isArray(product.images)
      ? product.images.filter((url) => typeof url === "string" && url.length > 0)
      : []),
  ];
  ```
  Coincide exactamente con el criterio del spec (CA-1): primer elemento siempre `getProductImage(product)` (reutilizado, no reimplementado), filtrado defensivo `typeof === "string" && length > 0`, guard `Array.isArray` para `images` ausente/no-array.
- **Estado:** ✅ cumplido

### TC-2 — `<ImageCarousel>` reemplaza la `<img>` única (CA-2)
- **Precondición:** ninguna.
- **Pasos:** Inspección de código de `ProductDetails.jsx` completo + `git log -p` del commit `06b1f761`.
- **Dato de entrada:** N/A (revisión estática).
- **Resultado esperado:** `ProductDetails.jsx` no contiene ningún `<img>` directo; `<div className="product-details-image"><ImageCarousel images={galleryImages} altText={name} /></div>` es el único contenido de ese contenedor, sin wrapper adicional ni clase nueva.
- **Resultado real:** confirmado — líneas 121-123: `<div className="product-details-image"><ImageCarousel images={galleryImages} altText={name} /></div>`. No hay ningún `<img>` suelto en el archivo (`grep "<img" ProductDetails.jsx` → 0 resultados). El `onError` inline que existía antes en `ProductDetails.jsx` fue eliminado de este archivo (ahora vive en `ImageCarousel.jsx`, ver TC-3). `npm test -- --run ProductDetails` → 9/9 pasan (ver Quality Gates).
- **Estado:** ✅ cumplido

### TC-3 — `onError` + `key={currentIndex}` en `ImageCarousel.jsx` (CA-3, CRÍTICO)
- **Precondición:** ninguna.
- **Pasos:**
  1. Lectura de `Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.jsx`, líneas 25-35.
  2. Confirmar presencia de `key={currentIndex}` en el `<img>` del carrusel.
  3. Mutación de prueba: quitar `key={currentIndex}` del JSX y correr `npm test -- --run ImageCarousel` para confirmar que el test nuevo de CA-7 (fallback multi-índice) realmente lo detecta como regresión (no es un test trivial que pasa igual sin el fix). Revertir la mutación tras la verificación (`git checkout -- ...`).
- **Dato de entrada:** `images = ["/a.png", "/b.png", "/c.png"]`, `fireEvent.error(...)` sobre el `<img>` en índice 0 y luego en índice 1 tras navegar.
- **Resultado esperado:** `key={currentIndex}` presente (obligatorio, no opcional, según el análisis del spec); el fallback se aplica de forma independiente por índice; el test de regresión falla si se quita `key={currentIndex}`.
- **Resultado real:**
  - `key={currentIndex}` **está presente** en `ImageCarousel.jsx:26`, importa `PRODUCT_IMAGE_PLACEHOLDER` desde `../../utils/productImage` (línea 2), con el guard `event.target.dataset.fallbackApplied` idéntico al patrón exacto del spec.
  - Test nuevo `"aplica el fallback de forma independiente en imágenes rotas de distintos índices"` (`ImageCarousel.test.jsx:36-52`) pasa en el código actual (5/5 tests del archivo).
  - **Verificación de mutación (no trivialidad del test):** al remover `key={currentIndex}` del JSX y correr `npm test -- --run ImageCarousel`, el test falla exactamente como predice el spec: `expect(secondImg).toHaveAttribute("src", "/img/products/placeholder.svg")` recibe `src="/b.png"` (el guard `dataset.fallbackApplied` bloquea el segundo fallback porque el nodo DOM se reutilizó). Confirma que el test ejercita realmente el escenario del bug, no es un placebo. Archivo restaurado con `git checkout --` inmediatamente después (verificado con `git status --short`, sin cambios pendientes).
- **Estado:** ✅ cumplido — hallazgo del spec correctamente implementado y con test que lo protege de regresión futura.

### TC-4 — Sin controles con una sola imagen (CA-4)
- **Precondición:** producto con `images` ausente o `[]`.
- **Pasos:** `npm test -- --run ProductDetails ImageCarousel` (casos específicos: `"no muestra controles de navegación sin imágenes adicionales"`, `"no muestra controles de navegación con images vacío"`, `"muestra la primera imagen y sin controles con una sola imagen"`).
- **Dato de entrada:** `product` sin `images` / `product.images = []` / `ImageCarousel images={["/a.png"]}`.
- **Resultado esperado:** no aparece ningún botón `❮`/`❯` ni indicador; se muestra solo la imagen principal.
- **Resultado real:** los 3 tests relevantes pasan. Código: `{images.length > 1 && (...)}` (`ImageCarousel.jsx:39`) oculta controles/indicadores correctamente cuando `galleryImages.length === 1`.
- **Estado:** ✅ cumplido

### TC-5 — Ajustes de `ImageCarousel.css` (CA-5)
- **Precondición:** ninguna.
- **Pasos:** `git diff eadd8212..HEAD -- Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.css`.
- **Dato de entrada:** N/A (diff estático).
- **Resultado esperado:** `.carousel-image-container` con `max-width: 100%` (antes `500px`) y `border-radius: 12px` (antes `8px`); `.carousel-image` con `object-fit: contain` (antes `cover`) y sin `aspect-ratio: 1/1`.
- **Resultado real:** diff confirma exactamente esos 3 cambios de propiedad (2 líneas modificadas en `.carousel-image-container`, 1 línea reemplazada por otra en `.carousel-image` que además elimina `aspect-ratio`). Ningún otro selector tocado.
  - **Nota de discrepancia menor (no bloqueante):** el "Contexto" del spec (punto 6) afirma que `.carousel-image-container` no tenía `width` explícito y que había que agregarlo; en realidad `width: 100%` ya estaba presente en el archivo original (`git show eadd8212:.../ImageCarousel.css`), sin cambios en ese diff. El estado final del CSS coincide igualmente con el criterio verificable de CA-5 (ancho no acotado a 500px), por lo que el CA se cumple en la práctica pese a la imprecisión del análisis previo del spec.
- **Estado:** ✅ cumplido (con nota informativa, no bloqueante)

### TC-6 — Paleta de `ImageCarousel.css` sin cambios (CA-6)
- **Precondición:** ninguna.
- **Pasos:** mismo diff de TC-5, inspección de bloques `.carousel-btn`, `.prev-btn`, `.next-btn`, `.carousel-indicators`, `.indicator`.
- **Dato de entrada:** N/A.
- **Resultado esperado:** ningún cambio de color en esos selectores.
- **Resultado real:** confirmado por el diff — esos 5 bloques no aparecen en absoluto en el hunk del diff (0 líneas tocadas).
- **Estado:** ✅ cumplido

### TC-7 — Tests actualizados (CA-7)
- **Precondición:** ninguna.
- **Pasos:** `npm test -- --run ProductDetails ImageCarousel` (comando exacto del spec, adaptado a `--run` para modo no-watch).
- **Dato de entrada:** N/A.
- **Resultado esperado:** `ProductDetails.test.jsx` con los 3 casos nuevos (sin `images`, `images: []`, `images` con 2 URLs) + los 6 tests originales sin romper; `ImageCarousel.test.jsx` con el test nuevo de fallback multi-índice.
- **Resultado real:** `2 archivos, 14 tests, 14 passed` (9 en `ProductDetails.test.jsx` = 6 originales + 3 nuevos; 5 en `ImageCarousel.test.jsx` = 4 originales + 1 nuevo). Ninguna aserción original cambió.
- **Estado:** ✅ cumplido

### TC-8 — Alcance limitado a 5 archivos, backend intacto (CA-8)
- **Precondición:** ninguna.
- **Pasos:** `git diff --stat develop..HEAD -- Style-Busters-main` y `git diff --stat develop..HEAD -- Base_Datos_StyleB`.
- **Dato de entrada:** N/A.
- **Resultado esperado:** exactamente los archivos declarados en CA-8 (`ProductDetails.jsx`, `ProductDetails.test.jsx`, `ImageCarousel.jsx`, `ImageCarousel.css`, `ImageCarousel.test.jsx`), sin cambios en `Base_Datos_StyleB/`.
- **Resultado real:**
  ```
  Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.css      |  7 ++--
  Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.jsx     | 13 ++++++--
  Style-Busters-main/src/Components/ImageCarousel/ImageCarousel.test.jsx | 21 +++++++++++-
  Style-Busters-main/src/Components/ProductDetails/ProductDetails.jsx   | 22 +++-------
  Style-Busters-main/src/Components/ProductDetails/ProductDetails.test.jsx | 39 ++++++++++++++++++++++
  5 files changed, 81 insertions(+), 21 deletions(-)
  ```
  `git diff --stat develop..HEAD -- Base_Datos_StyleB` → vacío. `ProductCard.jsx`/`CartView.jsx` no aparecen en el diff. Exactamente los 5 archivos declarados, ninguno de más.
- **Estado:** ✅ cumplido

### TC-9 — Caso negativo: `images` malformado (no cubierto explícitamente por test)
- **Precondición:** N/A.
- **Pasos:** búsqueda de tests con `product.images` como valor no-array (`null`, string, objeto) o array con elementos no-string/vacíos (`grep` en `ProductDetails.test.jsx` → sin resultados más allá del caso válido de 2 URLs).
- **Resultado esperado (spec):** ningún test explícito requerido para este caso en CA-1/CA-7, pero el código debe ser defensivo (filtrado `typeof === "string" && length > 0` + guard `Array.isArray`).
- **Resultado real:** **no existe un test explícito** que ejercite `product.images` no-array (p.ej. `images: "foo"` o `images: null`) ni un array con elementos mixtos (`images: [123, "", null, "https://a.test/1.jpg"]`). El código de `ProductDetails.jsx:106-108` cubre ambos casos estructuralmente por revisión estática (el guard `Array.isArray(product.images) ? ... : []` evita un `TypeError` si `images` no es array o es `null`/`undefined`; el `.filter` descarta elementos no-string o vacíos), pero **no hay evidencia ejecutada (test) que lo confirme** — es cobertura por inspección de código, no por test automatizado.
- **Estado:** ⚠️ parcial — no bloqueante para el cierre del spec (no es un CA explícito), pero se reporta como gap de cobertura de test para trazabilidad.

## Quality gates (evidencia)
```
tests (Style-Busters-main) : npm test -- --run  →  Test Files 50 passed (50) · Tests 210 passed (210)
tests (foco CA)            : npm test -- --run ProductDetails ImageCarousel → Test Files 2 passed (2) · Tests 14 passed (14)
build (Style-Busters-main) : npm run build → "The build folder is ready to be deployed." (warnings ESLint no-unused-vars preexistentes, ajenos a este pendiente: RegisterForm.jsx, SearchResultsList.jsx, CartContext.jsx, Layout.jsx, CheckoutPage.jsx, HomePage.jsx)
mutación de verificación    : quitar `key={currentIndex}` de ImageCarousel.jsx → test de fallback multi-índice FALLA (confirma que el test protege el bug crítico CA-3); archivo restaurado con `git checkout --`, git status limpio tras la verificación.
```
No aplican gates de backend (`Base_Datos_StyleB`) — este pendiente no lo toca (CA-8 confirmado).

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | ✅ cumplido |
| CA-2 | TC-2 | ✅ cumplido |
| CA-3 (crítico) | TC-3 | ✅ cumplido |
| CA-4 | TC-4 | ✅ cumplido |
| CA-5 | TC-5 | ✅ cumplido (nota informativa no bloqueante) |
| CA-6 | TC-6 | ✅ cumplido |
| CA-7 | TC-7 | ✅ cumplido |
| CA-8 | TC-8 | ✅ cumplido |
| — | TC-9 (negativo, no-CA) | ⚠️ parcial — falta test explícito para `images` malformado; cubierto solo por código defensivo |

**Resumen:** 8/8 CA cumplidos. Gates verdes (`npm test`: 210/210; `npm run build`: éxito). El bug crítico de `key={currentIndex}` (CA-3) está correctamente corregido y protegido por un test que se verificó no-trivial (falla cuando se revierte el fix). Único hallazgo no bloqueante: ausencia de test explícito para `product.images` malformado (no-array o con elementos no-string) — recomendado agregarlo como mejora de cobertura, pero no impide el cierre del spec dado que ningún CA lo exige explícitamente y el código ya es defensivo por diseño.
