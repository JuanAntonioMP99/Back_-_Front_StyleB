# Plan de Prueba: Grid de 3 columnas y hover en las cards de producto del Home

- **Spec:** `docs/specs/2026-08-21-feature-home-product-grid-hover.md`  ·  **Backlog ID:** FE-HOME-GRID-HOVER-2026-08-21
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`

## Entorno de prueba
- Verificación estática: inspección de código, `git diff`/`git show` contra `develop`, cálculo aritmético de layout.
- **Sin navegador/CDP disponible en este sandbox** (`browser-use` no instalado, confirmado por el orchestrator). No se ejecutó render visual real ni captura de pantalla; toda evidencia de layout es por cálculo y por lectura de CSS.
- Quality gates: `Style-Busters-main` — `npm test` (Vitest) y `npm run build` (react-scripts / CRA).
- Commits en revisión (`feature/home-product-grid-hover` vs `develop`):
  - `e7bdd365` feat(frontend): grid de 3 columnas en `.list-grid` (CA-1)
  - `fc255610` feat(frontend): reduce altura de imagen en card vertical a 220px (CA-2)

## Casos de prueba

### TC-1 — Grid de 3 columnas sobre `.list-grid` (mapea a CA-1)
- **Precondición:** `Components/List/List.css` compilado en el bundle vía `import './List.css'` en `List.jsx`.
- **Pasos:**
  1. Leer `Style-Busters-main/src/Components/List/List.css`.
  2. Confirmar `display: grid` y `grid-template-columns: repeat(3, 1fr)` en `.list-grid`.
  3. Confirmar media query `@media (max-width: 768px)` → `.list-grid { grid-template-columns: repeat(2, 1fr); }`.
  4. Confirmar media query `@media (max-width: 480px)` → `.list-grid { grid-template-columns: 1fr; }`.
  5. Confirmar por `git diff develop..HEAD -- Style-Busters-main/src/Pages/HomePage.css` que no hay cambios.
- **Dato de entrada:** contenido real de `List.css` (líneas 1-19).
- **Resultado esperado:** las 2 media queries y el grid base presentes exactamente como en el spec; `HomePage.css` sin diff.
- **Resultado real:**
  ```css
  .list-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      max-width: var(--container-width);
      margin: 0 auto;
  }
  @media (max-width: 768px) {
      .list-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
      .list-grid { grid-template-columns: 1fr; }
  }
  ```
  `git diff develop..HEAD -- Style-Busters-main/src/Pages/HomePage.css` → sin salida (archivo no tocado). `git diff develop..HEAD -- Style-Busters-main/src/Pages/HomePage.jsx` → sin salida (tampoco tocado; `List` sigue invocado con `layout="grid"`).
- **Estado:** ✅ cumplido

### TC-2 — Reducción de altura de imagen coherente con el ancho de columna (mapea a CA-2)
- **Precondición:** `git diff develop..HEAD -- Style-Busters-main/src/Components/ProductCard/ProductCard.css` disponible.
- **Pasos:**
  1. Confirmar `.product-card--vertical .product-card-image { height: 220px; }` en `ProductCard.css` (línea 73).
  2. Leer `--container-width` en `Style-Busters-main/src/index.css` (línea 21) → `1200px`.
  3. Calcular ancho de columna: `gap: 2rem` = 32px (no hay `html { font-size }` que redefina el `rem` base — confirmado por grep en `index.css`, único `font-size` presente es `1em` en línea 74, no en `html`/`:root`); 3 columnas → 2 gaps internos = 64px; `(1200 - 64) / 3 = 378.67px ≈ 379px` por columna.
  4. Evaluar riesgo de overflow horizontal en viewport de escritorio (1280px, 1440px): `.list-grid` tiene `max-width: var(--container-width)` (1200px) y `margin: 0 auto`; `.list-container` (envoltura en `List.jsx`) no define ancho fijo ni padding en `List.css`. Al ser un grid fluido acotado por `max-width`, en cualquier viewport ≥1200px el grid nunca excede 1200px de ancho total — no hay overflow horizontal posible por el propio grid a esos anchos.
- **Dato de entrada:** `ProductCard.css` línea 73; `index.css` línea 21.
- **Resultado esperado:** `height: 220px` presente; cálculo de columna ≈ 379px; sin riesgo de overflow a 1280px/1440px.
- **Resultado real:** confirmado — diff exacto:
  ```diff
  -    height: 280px;
  +    height: 220px;
  ```
  Columna calculada: `(1200 - 2×32) / 3 ≈ 378.67px`. Sin overflow esperado a 1280px/1440px (grid acotado a `max-width: 1200px`).
- **Estado:** ✅ cumplido — nota: el cálculo confirma ausencia de overflow **a partir de 1200px de viewport**; entre 769px y 1199px (rango donde no aplica ninguna media query, sigue en 3 columnas) el ancho de columna se reduce por debajo de 379px de forma fluida vía `1fr`, sin overflow (grid fluido, no hay ancho fijo de card). No se pudo verificar visualmente por falta de navegador en el sandbox — verificación puramente aritmética/estructural.

### TC-3 — Hover preservado sin regresión (mapea a CA-3)
- **Precondición:** `git show develop:Style-Busters-main/src/Components/ProductCard/ProductCard.css` disponible como baseline.
- **Pasos:**
  1. Comparar `ProductCard.css` (HEAD) contra `develop` con `git diff develop..HEAD -- .../ProductCard.css`.
  2. Confirmar que el único cambio es la línea de `height` (CA-2); ninguna regla de `:hover` fue tocada.
  3. Confirmar presencia intacta de `.product-card:hover` (líneas 12-16), `.product-card:hover .product-card-image` (línea 28-30) y `.product-card-title:hover` (línea 44-46).
  4. Confirmar que `List.css` no define ningún override sobre `.product-card`, `.product-card-image` ni `.product-card-title` (grep ya ejecutado en TC-5 confirma que `List.css` solo tiene reglas de `.list-grid`).
  5. Ejecutar `ProductCard.test.jsx` para confirmar que el comportamiento funcional (click, stock, fallback) no cambió.
- **Dato de entrada:** diff de `ProductCard.css` (1 línea cambiada, 1 línea agregada, 0 en bloques de hover); `List.css` completo (19 líneas, solo `.list-grid`).
- **Resultado esperado:** los 3 selectores de hover presentes sin cambios; sin overrides en `List.css`; tests de `ProductCard` en verde.
- **Resultado real:** diff confirma cambio único en `height` (línea 73); los 3 bloques de hover no aparecen en el diff (intactos); `List.css` no contiene ningún selector `.product-card*`. `node ./node_modules/vitest/vitest.mjs run ... ProductCard` → 4/4 tests pasados (`renderiza nombre, precio y enlace al detalle`, `agrega el producto al carrito al hacer click`, `deshabilita el botón cuando no hay stock`, `muestra fallback cuando no hay producto`).
- **Estado:** ✅ cumplido

### TC-4 — Paleta sin colores nuevos (mapea a CA-4)
- **Precondición:** diff completo de los 2 archivos tocados.
- **Pasos:**
  1. `grep` de patrón hex/rgb/rgba (`#[0-9a-fA-F]{3,6}|rgb\(|rgba\(`) sobre el contenido completo de `List.css`.
  2. Revisar el diff de `ProductCard.css` línea por línea — el único cambio es un valor numérico de `height` (`280px` → `220px`), sin tocar ninguna línea de color.
- **Dato de entrada:** `List.css` completo; diff de `ProductCard.css`.
- **Resultado esperado:** cero coincidencias de color en `List.css`; cero líneas de color en el diff de `ProductCard.css`.
- **Resultado real:** `grep` sobre `List.css` → sin coincidencias (0 matches). Diff de `ProductCard.css` → única línea modificada es `height`, sin ningún literal de color.
- **Estado:** ✅ cumplido

### TC-5 — Sin impacto colateral en `SearchResultsList`/`.list-vertical`/`.product-card--horizontal` (mapea a CA-5)
- **Precondición:** `git diff develop..HEAD -- Style-Busters-main/src/Components/SearchResultsList/` disponible.
- **Pasos:**
  1. Confirmar que el diff de todo el directorio `SearchResultsList/` (jsx + css) está vacío.
  2. `grep` de `list-vertical|product-card--horizontal` sobre `List.css` — debe no haber coincidencias (ninguna regla nueva sobre esos selectores).
  3. Ejecutar `SearchResultsList.integration.test.jsx` para confirmar que el comportamiento no cambió.
- **Dato de entrada:** diff vacío de `SearchResultsList/`; `List.css` completo.
- **Resultado esperado:** sin diff en `SearchResultsList/`; sin coincidencias de `.list-vertical`/`.product-card--horizontal` en `List.css`; tests en verde.
- **Resultado real:** `git diff develop..HEAD -- Style-Busters-main/src/Components/SearchResultsList/` → sin salida (0 archivos tocados). `grep` sobre `List.css` → sin coincidencias. `SearchResultsList.integration.test.jsx` → 3/3 tests pasados (`con query coincidente muestra los resultados`, `con query sin coincidencias muestra 'No encontramos coincidencias'`, `sin query invita a buscar`).
- **Estado:** ✅ cumplido

### TC-6 — Alcance de archivos limitado a `List.css` y `ProductCard.css` (mapea a CA-6)
- **Precondición:** rama `feature/home-product-grid-hover` con 2 commits sobre `develop`.
- **Pasos:**
  1. `git diff --stat develop..HEAD -- Style-Busters-main`.
  2. Confirmar exactamente 2 archivos en el stat.
  3. Confirmar que no hay cambios de JSX, props, componentes nuevos, rutas ni llamadas a servicio (implícito por el propio stat: 0 archivos `.jsx`/`.js` en el diff).
- **Dato de entrada:** salida de `git diff --stat`.
- **Resultado esperado:** exactamente 2 archivos (`List.css`, `ProductCard.css`), sin ningún `.jsx`/`.js` en la lista.
- **Resultado real:**
  ```
   Style-Busters-main/src/Components/List/List.css       | 19 +++++++++++++++++++
   .../src/Components/ProductCard/ProductCard.css        |  2 +-
   2 files changed, 20 insertions(+), 1 deletion(-)
  ```
- **Estado:** ✅ cumplido

### TC-7 — Caso negativo: no regresión sobre tests existentes dependientes del layout previo
- **Precondición:** ningún test en el repo asertaba pixeles/alturas de card ni estructura de grid (confirmado por lectura de `ProductCard.test.jsx` referenciado en el spec como solo-lectura).
- **Pasos:**
  1. Ejecutar la suite completa (`npm test`) sin filtro, para descartar rotura en cualquier test que dependa indirectamente del layout anterior.
  2. Ejecutar explícitamente `ProductCard.test.jsx`, `HomePage.integration.test.jsx` y `SearchResultsList.integration.test.jsx` (únicos archivos de test que existen bajo esos nombres — no existe `SearchResultsList.test.jsx` ni `HomePage.test.jsx` como archivos separados; los tests de integración con MSW son los reales).
- **Dato de entrada:** salida completa de `npm test`.
- **Resultado esperado:** 0 tests rotos, ningún fallo relacionado con `List`/`ProductCard`/`HomePage`/`SearchResultsList`.
- **Resultado real:** `npm test` → **50 archivos de test / 205 tests, todos en verde**. Subconjunto dirigido (`ProductCard` + `SearchResultsList` + `HomePage`) → **3 archivos / 10 tests, todos en verde**. El único `stderr` observado en `HomePage.integration.test.jsx` es un log intencional de la app (`[API SERVER_ERROR]`) dentro del propio test que verifica el manejo de error 500, no un fallo.
- **Estado:** ✅ cumplido

## Quality gates (evidencia)
```
# comando : resultado
tests (npm test, Vitest)  : PASS — 50 archivos / 205 tests, 0 fallos. Duración 19.12s.
build (npm run build)     : PASS — "Compiled with warnings." (warnings preexistentes de ESLint
                             no-unused-vars en ProductDetails.jsx, RegisterForm.jsx,
                             SearchResultsList.jsx, CartContext.jsx, Layout.jsx,
                             CheckoutPage.jsx, HomePage.jsx — ninguno en List.css/ProductCard.css
                             ni introducido por este spec; "The build folder is ready to be
                             deployed."). Sin errores de compilación CSS/JSX.
```
No se ejecutó `npm run e2e:ci:headless` para este spec: el cambio es puramente CSS de layout/dimensiones sin lógica funcional nueva, y no hay navegador/CDP disponible en este sandbox para correr Cypress ni `browser-use`. El spec (Riesgos y Deuda Técnica) documenta riesgo bajo y confirma por `grep` que `.list-grid` no tiene otro consumidor — no se identifica una razón funcional para requerir E2E aquí; se deja registrado como limitación de este QA, no como CA incumplido.

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | ✅ cumplido |
| CA-2 | TC-2 | ✅ cumplido (verificación aritmética/estructural; sin render visual real por falta de navegador en el sandbox) |
| CA-3 | TC-3 | ✅ cumplido |
| CA-4 | TC-4 | ✅ cumplido |
| CA-5 | TC-5 | ✅ cumplido |
| CA-6 | TC-6 | ✅ cumplido |
| — | TC-7 (negativo) | ✅ cumplido |

**Resumen:** Los 6 CA (CA-1 a CA-6) cumplidos con evidencia de código/diff/cálculo. Quality gates en verde: `npm test` (205/205) y `npm run build` (compila, solo warnings preexistentes de ESLint no relacionados con este spec). Gate G3: **verde**.

**Limitación declarada:** no hubo verificación visual/render real (sin navegador/CDP en el sandbox, confirmado por el orchestrator antes de iniciar). Toda la evidencia de layout (grid de 3 columnas, ausencia de overflow, altura de imagen) se produjo por lectura directa de CSS y cálculo aritmético del ancho de columna, no por captura de pantalla ni medición en DOM real. Se recomienda al orchestrator una verificación visual manual o con `browser-use` cuando la herramienta esté disponible, antes de considerar el spec cerrado a nivel de UX (no bloquea este gate G3 de QA funcional/aritmético).
