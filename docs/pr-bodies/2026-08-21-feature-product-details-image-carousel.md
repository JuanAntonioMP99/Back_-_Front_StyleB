## Descripción

Conecta el carrusel de imágenes (ImageCarousel.jsx, previamente huérfano) a la ficha de producto (ProductDetails.jsx), reemplazando la imagen única estática por un carrusel navegable que muestra todas las imágenes disponibles del producto (imagen principal más las adicionales expuestas por la API desde el pendiente 1 de backend, PR #16). El carrusel mantiene el comportamiento actual para productos sin imágenes adicionales (la única imagen sin controles) y añade manejo defensivo de fallback vía onError reutilizando el patrón ya usado en ProductCard.jsx.

## Spec

`docs/specs/2026-08-21-feature-product-details-image-carousel.md` · **Backlog ID:** FE-PRODUCT-DETAILS-IMAGE-CAROUSEL-2026-08-21

## Tipo de cambio

- [x] Feature

## Criterios de aceptación

- [x] **CA-1 — Construcción del array de galería, criterio explícito.** ProductDetails.jsx construye galleryImages como [getProductImage(product), ...(Array.isArray(product.images) ? product.images.filter((url) => typeof url === "string" && url.length > 0) : [])], reutilizando el helper existente para resolver la imagen principal (incluye fallback a placeholder) y filtrando defensivamente. TC-1 del plan de prueba cumplido.

- [x] **CA-2 — ProductDetails.jsx renderiza ImageCarousel en el mismo contenedor.** Reemplaza `<div className="product-details-image"><img .../></div>` por `<div className="product-details-image"><ImageCarousel images={galleryImages} altText={name} /></div>`, sin wrapper adicional. TC-2 cumplido, npm test ProductDetails → 9/9 pasan.

- [x] **CA-3 — onError en ImageCarousel.jsx, con key={currentIndex} obligatorio.** Agrega al `<img className="carousel-image">` los atributos `key={currentIndex}`, `onError` (importa `PRODUCT_IMAGE_PLACEHOLDER` desde `../../utils/productImage`) y el guard `if (event.target.dataset.fallbackApplied) return;`. El `key` es crítico para evitar reutilización de nodo DOM entre navegaciones. Mutación de verificación confirma que remover `key={currentIndex}` causa fallo del test nuevo. TC-3 cumplido, código en ImageCarousel.jsx líneas 25-35.

- [x] **CA-4 — Caso sin imágenes adicionales se comporta como imagen única.** Con product.images ausente/[], galleryImages tiene 1 elemento y ImageCarousel.jsx oculta flechas/indicadores ({images.length > 1 && (...)}). TC-4 cumplido, tests "no muestra controles" pasan.

- [x] **CA-5 — Ajuste de ImageCarousel.css sin regresión visual.** Cambia .carousel-image-container (max-width 500px → 100%, border-radius 8px → 12px) y .carousel-image (quita aspect-ratio: 1 / 1, object-fit cover → contain). Valores reutilizados del repo. TC-5 cumplido, 5 cambios exactos de propiedad.

- [x] **CA-6 — Paleta de ImageCarousel.css sin cambios.** No se modifica ningún color en .carousel-btn, .prev-btn, .next-btn, .carousel-indicators ni .indicator. TC-6 cumplido, 0 líneas tocadas en esos bloques.

- [x] **CA-7 — Tests actualizados.** ProductDetails.test.jsx agrega 3 nuevos tests; ImageCarousel.test.jsx agrega test de fallback multi-índice. TC-7 cumplido, 14/14 tests pasan (9 ProductDetails, 5 ImageCarousel).

- [x] **CA-8 — Fuera de alcance declarado explícitamente.** No se tocan ProductCard.jsx, CartView.jsx, ni Base_Datos_StyleB/. Exactamente 5 archivos modificados. TC-8 cumplido, git diff --stat muestra solo esos 5.

## Quality Gates

- [x] **Lint/build — sin errores.** npm run build dentro de Style-Busters-main/ → "The build folder is ready to be deployed."

- [x] **Tests — todos pasan.** npm test -- --run → Test Files 50 passed (50) · Tests 210 passed (210). Focus: ProductDetails ImageCarousel → 14/14.

- [x] **E2E — no aplica.** Sin cobertura Cypress/e2e preexistente sobre ficha de producto.

- [x] **Diff revisado — sin secrets, sin console.log, sin código temporal.** Contiene solo cambios de integración, CSS y tests.

- [x] **Prueba funcional — todos los CA verificados.** 8/8 cumplidos, verificación de mutación confirma no-trivialidad del test crítico.

## Revisiones independientes (no las hace el builder)

- [x] **code-reviewer: aprobado.** Sin hallazgos bloqueantes. Nota: imprecisión menor en spec sobre width CSS sin impacto en resultado.

- [x] **security-reviewer: aprobado.** STRIDE evaluado explícitamente. XSS vía src no aplica: src de img no ejecuta javascript: en navegadores modernos; images pasa isURL() en backend; React escapa alt. Tampering N/A directo. Secrets ninguno. Fuente: líneas 95-109 del spec.

- [x] **anti-hallucination-reviewer: limpio.** Rutas, endpoints, librerías todos reales. Imports correctos. Reutilización de getProductImage, PRODUCT_IMAGE_PLACEHOLDER, ImageCarousel verificada.

- [ ] **tech-reviewer:** FALTA — se ejecutará sobre el PR una vez abierto.

- [ ] **Segunda opinión (Codex): registrada — consultiva, no bloquea merge.** FALTA: no disponible en este entorno.

## Pendientes y backlog derivado

- [x] **Pendientes abiertos registrados en el spec.** F3.5 (auth ausente /products), BE-VALIDATE-IMAGEURL-2026-08-21 (validación imageURL), candidato: loading/decoding en ImageCarousel (TC-9 hallazgo no-bloqueante).

- [x] **Backlog accionable creado.** Gap TC-9: falta test explícito para product.images malformado (no-array, elementos no-string). Código defensivo (guard Array.isArray, filtrado). No bloquea cierre.

## Consideraciones de seguridad

**STRIDE evaluado explícitamente:**

- **Spoofing:** N/A. Sin cambios AuthContext, ProtectedRoute, utils/auth.js.
- **Tampering:** N/A directo (frontend lectura). POST/PUT sin auth deuda preexistente F3.5.
- **Repudiation:** N/A. Sin logging/auditoría.
- **Information Disclosure:** N/A. Sin datos nuevos. images ya público desde backend.
- **Denial of Service:** N/A. Solo presentación, sin bucles/timers/llamadas red. Límite payload backend.
- **Elevation of Privilege:** N/A. Ficha pública. Sin cambios ProtectedRoute.

**XSS vía src:** No aplica. src img no ejecuta javascript: (diferente de href a o src iframe). images validado isURL() backend. imageURL sin validación (deuda BE-VALIDATE-IMAGEURL-2026-08-21).

## Razonamiento (Vibe Coding)

Reutiliza ImageCarousel existente, evitando duplicación. key={currentIndex} es crítico (no obvio en spec) para resetear nodo DOM entre navegaciones — fallback onError funciona correctamente solo con key. Test regresión lo protege. CSS ajustes cosméticos (reutilizan valores repo: 12px, 100%, contain) evitan letterboxing innecesario. Acoplamiento único aceptado: ImageCarousel importa PRODUCT_IMAGE_PLACEHOLDER de utils/productImage (específico dominio, único consumidor real hoy).

## Breaking changes

Ninguno. Contrato ImageCarousel sin cambios. Consumidor nuevo ProductDetails (antes huérfano). Productos sin images (100% hoy) igual. Backend intacto. Backward compatible.

---

**Fuentes:** docs/specs/2026-08-21-feature-product-details-image-carousel.md, docs/test-plans/2026-08-21-feature-product-details-image-carousel.md

**Verificación:** 8/8 CA cumplidos (TC-1 a TC-8). Quality gates: 210/210 tests, npm run build éxito.

**Rama/commits:** feature/product-details-image-carousel, 5 commits (4 impl + 1 test-plan), ya en origin.
