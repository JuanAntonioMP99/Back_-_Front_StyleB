## Descripción

Se implementa un grid de 3 columnas sobre `.list-grid` (en `Components/List/List.css`, previamente vacío) y se reduce la altura de imagen de las cards verticales de 280px a 220px (en `Components/ProductCard/ProductCard.css`), para compactar el catálogo del Home con una densidad visual razonable en pantallas de escritorio. El efecto hover ya existente en las cards se verifica y mantiene intacto.

## Spec
`docs/specs/2026-08-21-feature-home-product-grid-hover.md`  ·  **Backlog ID:** FE-HOME-GRID-HOVER-2026-08-21

## Tipo de cambio
- [x] Feature

## Criterios de aceptación
- [x] CA-1: Grid de 3 columnas en escritorio sobre el selector real (`.list-grid`) — evidencia: `git diff` con `display: grid; grid-template-columns: repeat(3, 1fr);` + media queries `@media (max-width: 768px)` → 2 columnas, `@media (max-width: 480px)` → 1 columna. `Pages/HomePage.css` no tocado. Verificable: `docs/test-plans/2026-08-21-feature-home-product-grid-hover.md`, TC-1.
- [x] CA-2: Tamaño de card reducido coherente — `.product-card--vertical .product-card-image { height: 220px; }` (antes 280px). Cálculo: con `--container-width: 1200px` y `gap: 2rem` (32px), cada columna resulta en ≈379px; imagen a 220px mantiene proporción compacta. Verificable: TC-2, cálculo aritmético + diff exacto.
- [x] CA-3: Efecto hover preservado sin regresión — `.product-card:hover`, `.product-card:hover .product-card-image` y `.product-card-title:hover` intactos en `ProductCard.css` (no aparecen en el diff). `List.css` no define overrides. Tests: `ProductCard.test.jsx` 4/4 en verde. Verificable: TC-3.
- [x] CA-4: Paleta sin colores nuevos — cero literales hex/rgb/rgba en `List.css`; diff de `ProductCard.css` modifica solo valor numérico de `height`. Verificable: TC-4.
- [x] CA-5: Sin impacto colateral en `SearchResultsList`/`.list-vertical`/`.product-card--horizontal` — zero diff en `Components/SearchResultsList/`; cero menciones de esos selectores en `List.css`. Tests: `SearchResultsList.integration.test.jsx` 3/3 en verde. Verificable: TC-5.
- [x] CA-6: Alcance limitado a 2 archivos `.css` — `git diff --stat` muestra exactamente 2 archivos (List.css, ProductCard.css), sin `.jsx`/`.js` ni cambios de componentes/rutas/props. Verificable: TC-6.

## Quality Gates
- [x] Lint/build — `npm run build` en `Style-Busters-main/` → PASS ("Compiled with warnings." — warnings preexistentes de ESLint en ProductDetails.jsx, RegisterForm.jsx, SearchResultsList.jsx, CartContext.jsx, Layout.jsx, CheckoutPage.jsx, HomePage.jsx; ninguno introducido por este spec; "The build folder is ready to be deployed." sin errores CSS/JSX). Evidencia: `docs/test-plans/2026-08-21-feature-home-product-grid-hover.md`, Quality gates.
- [x] Tests — `npm test` en `Style-Busters-main/` → PASS, 50 archivos / 205 tests, 0 fallos, duración 19.12s. Subset dirigido (ProductCard + SearchResultsList + HomePage): 3 archivos / 10 tests, todos en verde. Evidencia: TC-7 (caso negativo), Quality gates.
- [ ] E2E — NO ejecutado (`npm run e2e:ci:headless`). Justificación: cambio puramente CSS de layout/dimensiones sin lógica funcional nueva; no hay navegador/CDP disponible en el sandbox (limitación conocida documentada en `MEMORY.md`). El spec (Riesgos y Deuda Técnica) confirma riesgo bajo y grep verifica `.list-grid` sin otros consumidores — no se identifica razón funcional de bloqueo. Límite del QA: verificación aritmética/estructural de layout, no render visual real. Recomendación: verificación visual manual o con `browser-use` cuando esté disponible, antes de considerar cierre a nivel UX (no bloquea gate G3 de QA).
- [x] Diff revisado — cero secrets, cero `console.log` de debug, cero código temporal sin marcar. 2 commits en la rama: `e7bdd365` (CA-1, grid de 3 columnas), `fc255610` (CA-2, altura de imagen). Ambos sobre `origin/develop`.
- [x] Prueba funcional — todos los 6 CA verificados con evidencia de código/diff/cálculo/tests según `docs/test-plans/2026-08-21-feature-home-product-grid-hover.md` (TC-1 a TC-6).

## Revisiones independientes (no las hace el builder)
- [x] code-reviewer: **aprobado** — sin hallazgos bloqueantes ni opcionales de peso.
- [x] security-reviewer: **aprobado** — STRIDE N/A para las 6 categorías (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). Cambio puramente de presentación (2 archivos CSS), sin tocar autenticación, autorización, validación de inputs, APIs, tokens ni persistencia. Inputs que requieren validación: ninguno. Secrets: ninguno. Superficie de ataque: ninguna (CSS estático, sin nuevas llamadas de red ni nuevo manejo de datos).
- [x] anti-hallucination-reviewer: **LIMPIO** — sin hallazgos; rutas, selectores de componentes, valores de variables CSS y precedentes en el repo verificados contra código real.
- [ ] tech-reviewer: **FALTA** — se ejecutará sobre este PR una vez abierto (gate G5 del harness).
- [ ] Segunda opinión (Codex): **FALTA** — no disponible en este entorno (segundo gate consultivo, no bloquea merge).

## Pendientes y backlog derivado
- [x] Pendientes abiertos registrados en el spec
  - `Pages/HomePage.css` es código huérfano: no se importa desde `HomePage.jsx`, ninguna de sus clases aparece en el JSX (`.home-header`, `.home-title`, `.home-subtitle`, `.products-grid`). Fuera de alcance de este spec (el fix real va en `List.css`, ver CA-1/Decisiones de Diseño); candidato a limpieza de código muerto en backlog separado, en línea con hallazgos del spec anterior (`Pages/ProductDetailPage.css`).
  - `Components/List/List.jsx` pasa `className="list-item"` a `<ProductCard>`, prop que `ProductCard.jsx` nunca destructura ni consume — prop muerta sin efecto. No bloquea este spec; registrado como hallazgo.
  - `List.jsx` recibe prop `titile` (typo, no `title`) que nunca se usa en render. No relacionado con grid/hover; no se corrige aquí.
- [ ] Backlog accionable creado y referenciado (IDs / enlaces)
  - FALTA: creación de backlog derivado (pendiente del orchestrator tras revisar este spec, según matriz de cierre).

## Consideraciones de seguridad

**Amenazas STRIDE evaluadas:** ninguna aplica — cambio exclusivamente de presentación (2 archivos CSS), sin tocar autenticación, autorización, validación de inputs, endpoints de API, manejo de tokens ni persistencia.
- **Spoofing:** N/A. No se toca `AuthContext`, `ProtectedRoute` ni `utils/auth.js`.
- **Tampering:** N/A. No se modifican payloads de API (`Services/productService.js` no se toca) ni validación de backend.
- **Repudiation:** N/A. No se toca logging ni auditoría.
- **Information Disclosure:** N/A. No se agrega ni quita ningún dato mostrado; `product.name`, `product.price`, `product.stock`, `product.description` ya se muestran igual, solo cambia tamaño/disposición visual.
- **Denial of Service:** N/A. CSS estático puro; sin bucles, timers, listeners ni llamadas de red nuevas.
- **Elevation of Privilege:** N/A. No se modifica `ProtectedRoute.jsx` ni rutas protegidas; Home es público.

**Controles de mitigación:** ninguno adicional requerido.

## Razonamiento (Vibe Coding)

El pedido del usuario de "3 columnas, cards más pequeñas, efecto hover" se traduce en modificar solo el contenedor (`.list-grid`, vacío hasta hoy) y la altura de imagen (`.product-card--vertical`), dos superficies aisladas del resto del codebase. El efecto hover ya cumple la intención de "reacción simple al pasar el cursor" y existe código intacto; verificarlo es más seguro que recrearlo. Los breakpoints (768px, 480px) se reutilizan del repo, no se inventan. El cambio es reversible y de bajo riesgo: primer grid real en `.list-grid`, sin otros consumidores confirmados.

## Breaking changes

Ninguno — cambio de presentación pura, sin cambios de prop, endpoint, modelo ni estructura funcional. Las cards siguen siendo `ProductCard` con `orientation="vertical"`, Home sigue siendo una `<List layout="grid" />`, el efecto hover es el mismo. Solo el tamaño visual y la disposición del contenedor cambian.
