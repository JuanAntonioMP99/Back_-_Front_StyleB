# Plan de Prueba: refactor-frontend-housekeeping

- **Spec:** `docs/specs/2026-08-21-refactor-frontend-housekeeping.md`  ·  **Backlog ID:** `FE-HOUSEKEEPING-2026-08-21`
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`
- **Rama verificada:** `refactor/frontend-housekeeping` (confirmado con `git branch --show-current` antes de iniciar)
- **Commits de implementación auditados:** `999c9c6f` (chore: eliminar CSS huérfano de páginas y layout), `36498e59` (chore: limpiar prop `list-item` y parámetro `titile` en `List.jsx`), `a4e7063b` (perf: lazy-load en la imagen de `ImageCarousel`)

## Entorno de prueba
- Frontend: Vitest 4 (jsdom) + `@testing-library/react`, ejecutado sobre el repositorio local (sin servidor levantado; suite unitaria/integración, no e2e).
- Build: Create React App (`react-scripts build`), sin backend ni MongoDB requeridos.
- Verificación estática: `git diff` de los 3 commits contra su base (`999c9c6f~1..a4e7063b`), `grep` sobre `Style-Busters-main/src`.
- No se requirió backend (`Base_Datos_StyleB`) ni datos de prueba en BD: los 6 puntos son de presentación pura (CSS muerto, props/atributos), sin contrato de API involucrado.

## Casos de prueba

### TC-1 — [mapea a CA-1] `loading="lazy"` y `decoding="async"` en `ImageCarousel.jsx`
- **Precondición:** rama `refactor/frontend-housekeeping`, commit `a4e7063b` aplicado.
- **Pasos:**
  1. `grep -n 'loading="lazy"\|decoding="async"' src/Components/ImageCarousel/ImageCarousel.jsx`.
  2. `git diff 999c9c6f~1..a4e7063b -- .../ImageCarousel.jsx` — confirmar que el único cambio es la adición de esos dos atributos, sin lógica condicional por `currentIndex`.
  3. `npm test -- ImageCarousel`.
- **Dato de entrada:** N/A (verificación estática + suite existente).
- **Resultado esperado:** ambos atributos presentes en el único `<img>` del archivo, mismo patrón literal que `ProductCard.jsx`/`CartView.jsx`; diff limpio (solo 2 líneas añadidas); 5 tests existentes de `ImageCarousel.test.jsx` en verde (ninguno hace aserciones sobre `loading`/`decoding`, según el propio spec).
- **Resultado real:** `grep` devuelve línea 30 `loading="lazy"` y línea 31 `decoding="async"`. `git diff` muestra únicamente esas 2 líneas añadidas dentro del `<img>`, sin cambios adicionales. `npm test -- ImageCarousel` → `Test Files 1 passed (1)`, `Tests 5 passed (5)`.
- **Estado:** ✅ cumplido.
- **Nota de alcance:** la verificación de "sin parpadeo visible" al combinar `loading="lazy"` con `key={currentIndex}` es, según el propio spec, un argumento de diseño no verificable por Vitest/jsdom (no implementa `IntersectionObserver` ni el algoritmo real de carga diferida). No se intentó una verificación visual manual en este entorno (sandbox sin navegador real); se documenta como limitación conocida heredada del spec, no bloqueante.

### TC-2 — [mapea a CA-2] `Pages/ProductDetailPage.css` eliminado
- **Precondición:** commit `999c9c6f` aplicado.
- **Pasos:**
  1. `test -f src/Pages/ProductDetailPage.css` (o equivalente) para confirmar ausencia física.
  2. `git diff --stat 999c9c6f~1..a4e7063b -- .../ProductDetailPage.css`.
  3. `npm run build`.
- **Dato de entrada:** N/A.
- **Resultado esperado:** archivo ausente del árbol de trabajo; `git diff --stat` lo marca con líneas eliminadas (equivalente a `deleted`); build sin errores de módulo no encontrado.
- **Resultado real:** archivo no existe en `src/Pages/`. `git diff --stat` reporta `Style-Busters-main/src/Pages/ProductDetailPage.css | 83 ----------------------` (83 líneas eliminadas, archivo completo). `npm run build` completa con `"The build folder is ready to be deployed."`, sin ningún error de resolución de módulo (solo warnings de ESLint `no-unused-vars` en archivos no relacionados con este spec).
- **Estado:** ✅ cumplido.

### TC-3 — [mapea a CA-3] `Pages/HomePage.css` eliminado
- **Precondición:** commit `999c9c6f` aplicado.
- **Pasos:** análogos a TC-2, aplicados a `HomePage.css`.
- **Dato de entrada:** N/A.
- **Resultado esperado:** archivo ausente; `git diff --stat` lo marca eliminado; build sin errores de módulo no encontrado; `npm test` sin regresiones.
- **Resultado real:** archivo no existe en `src/Pages/`. `git diff --stat` reporta `Style-Busters-main/src/Pages/HomePage.css | 25 -------` (25 líneas eliminadas, archivo completo). `npm run build` sin errores de resolución de módulo. `npm test` completo: `223 passed (223)` (ver TC no-regresión).
- **Estado:** ✅ cumplido.

### TC-4 — [mapea a CA-4] Regla `.main-content` eliminada de `Layout.css`
- **Precondición:** commit `999c9c6f` aplicado.
- **Pasos:**
  1. `grep -rn "main-content" Style-Busters-main/src`.
  2. `git diff 999c9c6f~1..a4e7063b -- .../Layout.css` — confirmar que solo se elimina el bloque `.main-content` (base + variante `@media (max-width: 768px)`) y nada más del archivo.
- **Dato de entrada:** N/A.
- **Resultado esperado:** cero coincidencias de `main-content` en `src/`; diff de `Layout.css` limitado a esas 15 líneas eliminadas (bloque base + responsive), sin tocar `.layout` ni `@media print`.
- **Resultado real:** `grep -rn "main-content" src` → sin resultados. `git diff` de `Layout.css` muestra únicamente la eliminación de 15 líneas correspondientes al bloque `.main-content` y su variante responsive; el resto del archivo (`.layout`, `@media print`) queda intacto.
- **Estado:** ✅ cumplido.

### TC-5 — [mapea a CA-5] `className="list-item"` eliminado de `List.jsx`
- **Precondición:** commit `36498e59` aplicado.
- **Pasos:**
  1. `grep -rn "list-item" Style-Busters-main/src`.
  2. `git diff 999c9c6f~1..a4e7063b -- .../List.jsx` — confirmar que solo se elimina `className="list-item"` en ambas invocaciones de `<ProductCard>`.
  3. `npm test` (suite completa, incluye `HomePage.integration.test.jsx` y `SearchResultsList.integration.test.jsx`).
- **Dato de entrada:** N/A.
- **Resultado esperado:** cero coincidencias de `list-item` en `src/`; diff limitado a esas 2 líneas eliminadas; suite completa sin regresiones.
- **Resultado real:** `grep -rn "list-item" src` → sin resultados. `git diff` de `List.jsx` muestra la eliminación de `className="list-item"` en ambas ramas (`grid` y `else`), sin tocar `key`, `product` ni `orientation`. Suite completa: `223 passed (223)` (ver TC no-regresión).
- **Estado:** ✅ cumplido.

### TC-6 — [mapea a CA-6] Parámetro `titile` eliminado de `List.jsx` (sin renderizar título)
- **Precondición:** commit `36498e59` aplicado.
- **Pasos:**
  1. `grep -n "titile" Style-Busters-main/src/Components/List/List.jsx`.
  2. Inspección de `git diff` de `List.jsx`: confirmar que la firma pasa a `({products = [], layout = "grid"})` y que no se agrega ningún `<h1>`/`<h2>` ni renderizado de título en el JSX.
  3. Inspección de `git diff` de `Pages/HomePage.integration.test.jsx`: confirmar que solo cambia el comentario (líneas 37-38), no las aserciones (`expect(await screen.findByText("Camisa"))...`).
  4. `npm test -- HomePage` (2 consumidores de `List`: `HomePage.jsx`).
  5. `npm test -- SearchResultsList` (2º consumidor de `List`: `SearchResultsList.jsx`).
- **Dato de entrada:** N/A.
- **Resultado esperado:** sin coincidencias de `titile` en `List.jsx`; firma reducida a `products`/`layout`, sin nuevo elemento de título; comentario de `HomePage.integration.test.jsx` actualizado sin tocar aserciones; ambos test files en verde.
- **Resultado real:** `grep -n "titile" List.jsx` → sin resultados. Diff de `List.jsx`: firma cambia de `({products = [], titile = "Nuestros productos", layout = "grid"})` a `({products = [], layout = "grid"})`; no se añade ningún elemento de título al JSX (solo se retiran las 2 líneas `className="list-item"`, ver TC-5, y la firma). Diff de `HomePage.integration.test.jsx`: solo el comentario cambia (de "typo `titile`..." a "List no tiene ningún parámetro de título..."), la aserción `expect(await screen.findByText("Camisa"))...` no se toca. `npm test -- HomePage` → `Test Files 1 passed (1)`, `Tests 3 passed (3)`. `npm test -- SearchResultsList` → `Test Files 1 passed (1)`, `Tests 3 passed (3)`.
- **Estado:** ✅ cumplido.

### TC-7 — Caso de no-regresión explícito (suite completa)
- **Precondición:** los 3 commits de implementación aplicados (`999c9c6f`, `36498e59`, `a4e7063b`), working tree en `refactor/frontend-housekeeping`.
- **Pasos:**
  1. `npm test` (suite completa `Style-Busters-main`).
  2. `npm run build` (sin backend levantado).
  3. Comparar el conteo de tests con el esperado (~223, mismo orden de magnitud que antes del refactor, sin pérdidas accidentales de cobertura al borrar código).
- **Dato de entrada:** N/A.
- **Resultado esperado:** ningún test roto ni perdido; build exitoso sin errores de módulo no encontrado (CSS eliminados no estaban importados por nadie); solo se aceptan warnings de ESLint preexistentes no relacionados con este spec.
- **Resultado real:** `npm test` → `Test Files 52 passed (52)`, `Tests 223 passed (223)`, sin fallos ni tests omitidos. `npm run build` → compila y genera `build/` sin errores; los únicos mensajes son warnings de `no-unused-vars` de ESLint en archivos no tocados por este spec (`RegisterForm.jsx`, `SearchResultsList.jsx`, `CartContext.jsx`, `Layout.jsx`, `CheckoutPage.jsx`, `HomePage.jsx`), preexistentes y fuera del alcance de este refactor.
- **Estado:** ✅ cumplido.

## Quality gates (evidencia)
```
# comando : resultado
type-check : N/A (proyecto CRA sin TypeScript; no hay script dedicado)
lint       : incluido en `npm run build` (CRA ejecuta ESLint) — 8 warnings preexistentes no relacionados con este spec, 0 errores
format     : N/A (no hay script de formato dedicado en package.json)
tests      : `npm test` → Test Files 52 passed (52) · Tests 223 passed (223) · Duration 24.71s
build      : `npm run build` → "The build folder is ready to be deployed." — sin errores de resolución de módulo (confirma que ningún bundle intentaba resolver los CSS eliminados)
```

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | ✅ cumplido |
| CA-2 | TC-2 | ✅ cumplido |
| CA-3 | TC-3 | ✅ cumplido |
| CA-4 | TC-4 | ✅ cumplido |
| CA-5 | TC-5 | ✅ cumplido |
| CA-6 | TC-6 | ✅ cumplido |
| No-regresión | TC-7 | ✅ cumplido |

**Resumen:** todos los criterios de aceptación (CA-1 a CA-6) cumplidos con evidencia verificable (`grep`, `git diff` acotado a los 3 commits de implementación `999c9c6f~1..a4e7063b`, `npm test` dirigido por archivo y suite completa, `npm run build`). Sin cambios de comportamiento observable fuera de lo declarado en el spec (única mejora: `loading="lazy"`/`decoding="async"` en `ImageCarousel.jsx`, CA-1). Suite completa en verde: 223/223 tests, sin regresiones ni pérdida de cobertura por las eliminaciones de código muerto. Build exitoso. **Gate G3: APROBADO.**

No se auditaron ni se reporta veredicto sobre los archivos sin trackear ajenos a este spec (`addressRoutes.js`, `address.test.js`, `addressService.*`, `paymentMethodService.*`, `.agents/skills/`, `.claude/skills/browser-use/`, `skills-lock.json`) — quedan fuera del alcance de este plan de prueba por instrucción explícita.
