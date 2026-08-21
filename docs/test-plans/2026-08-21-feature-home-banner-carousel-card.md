# Plan de Prueba: Carrusel principal del Home contenido en tratamiento tipo "card grande"

- **Spec:** `docs/specs/2026-08-21-feature-home-banner-carousel-card.md`  ·  **Backlog ID:** FE-HOME-BANNER-CARD-2026-08-21
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`

## Entorno de prueba
- Frontend: `Style-Busters-main/` (React 19 + CRA), sin backend involucrado (cambio puramente CSS, sin llamadas a API).
- Archivo objetivo: `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css`.
- Commit auditado: `d2c84283` (`style(home): contener banner-carousel en card centrada`), único commit de implementación sobre `feature/home-banner-carousel-card`, comparado contra `develop` con `git diff develop..HEAD`.
- Datos de prueba: no aplica (sin datos, sin props nuevas).

## Casos de prueba

### TC-1 — `.banner-carousel` deja de ser edge-to-edge (mapea a CA-1)
- **Precondición:** archivo `BannerCarousel.css` en el commit `d2c84283`.
- **Pasos:**
  1. `grep -n "max-width: var(--container-width)"` sobre `BannerCarousel.css`.
  2. `grep -n "margin: 0 auto 2rem"` sobre `BannerCarousel.css`.
  3. Confirmar que `width: 100%` (línea 13) permanece sin cambios.
- **Dato de entrada:** ninguno (inspección estática).
- **Resultado esperado:** ambas líneas presentes en la regla `.banner-carousel`; `width: 100%` intacto.
- **Resultado real:** confirmado — `max-width: var(--container-width);` en línea 14 y `margin: 0 auto 2rem;` en línea 18 de `BannerCarousel.css`. `width: 100%` (línea 13) sin cambios respecto a `develop`.
- **Estado:** cumplido

### TC-2 — Tratamiento visual tipo "card" con valores reutilizados, sin colores nuevos (mapea a CA-2)
- **Precondición:** archivo `BannerCarousel.css` en el commit `d2c84283`.
- **Pasos:**
  1. `grep -n "border-radius: 12px"` sobre `BannerCarousel.css`.
  2. `grep -n "border: 1px solid rgba(255, 255, 255, 0.1)"` sobre `BannerCarousel.css`.
  3. `grep -n "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)"` sobre `BannerCarousel.css`.
  4. Revisar `git diff develop..HEAD -- .../BannerCarousel.css` en busca de cualquier literal hex/rgb/rgba adicional no listado en el spec.
- **Dato de entrada:** ninguno (inspección estática).
- **Resultado esperado:** los tres valores literales presentes carácter por carácter, coincidiendo con los valores citados en CA-2 (`ProductCard.css`, `Header.css`, `Loading.css`, `ProfileCard.css`, `CartPage.css`, `SearchResultsList.css`); ningún literal de color nuevo en el diff.
- **Resultado real:** confirmado — línea 19 `border-radius: 12px;`, línea 20 `border: 1px solid rgba(255, 255, 255, 0.1);`, línea 21 `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);`. El diff completo (`git diff develop..HEAD -- Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css`) no introduce ningún otro literal de color: `background-color: #000;` es preexistente y no forma parte del diff.
- **Estado:** cumplido

### TC-3 — No-regresión funcional del carrusel (mapea a CA-3)
- **Precondición:** repo en commit `d2c84283`, `develop` como base de comparación.
- **Pasos:**
  1. `git diff develop..HEAD -- Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.jsx` — debe estar vacío.
  2. `git diff develop..HEAD -- Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.test.jsx` — debe estar vacío.
  3. `cd Style-Busters-main && node ./node_modules/vitest/vitest.mjs run BannerCarousel` — verificar que los 3 tests existentes (estado vacío, render de contenido, controles con varios banners) pasan sin modificación.
- **Dato de entrada:** ninguno.
- **Resultado esperado:** ambos diffs vacíos (0 líneas); suite de `BannerCarousel` en verde (3/3).
- **Resultado real:** confirmado — `git diff develop..HEAD` para `BannerCarousel.jsx` y `BannerCarousel.test.jsx` no produce salida (sin cambios). Ejecución dirigida: `Test Files 1 passed (1)`, `Tests 3 passed (3)`.
- **Estado:** cumplido

### TC-4 — Responsive sin breakpoints nuevos ni modificados (mapea a CA-4)
- **Precondición:** archivo `BannerCarousel.css` en el commit `d2c84283`.
- **Pasos:**
  1. `git diff develop..HEAD -- Style-Busters-main | grep -n "@media"` — no debe arrojar coincidencias.
  2. Inspección visual del bloque `@media (max-width: 768px)` (líneas 223-236 del archivo resultante): confirmar que su contenido (`--carousel-height: 400px`, `.banner-title { font-size: 2rem }`, `.carousel-btn { width/height: 40px }`) es idéntico al de `develop`, sin reglas nuevas agregadas dentro del bloque.
  3. Confirmar que `border-radius`/`border`/`box-shadow` de TC-2 están declarados una sola vez, fuera de cualquier `@media` (aplicación uniforme en todos los breakpoints).
- **Dato de entrada:** ninguno.
- **Resultado esperado:** ningún `@media` nuevo o modificado en el diff; el `@media (max-width: 768px)` existente permanece igual; el tratamiento de card se aplica sin variar por breakpoint.
- **Resultado real:** confirmado — `git diff develop..HEAD -- Style-Busters-main` no contiene ninguna línea con `@media` (el diff solo toca la regla `.banner-carousel`, líneas 11-22 del archivo). El bloque `@media (max-width: 768px)` (líneas 223-236) queda fuera del hunk del diff, sin alteración. `border-radius`/`border`/`box-shadow` están en la regla base `.banner-carousel`, no dentro de ningún `@media`.
- **Estado:** cumplido

### TC-5 — Sin contenido inventado, cambio acotado a un único archivo (mapea a CA-5)
- **Precondición:** rama `feature/home-banner-carousel-card`, comparación contra `develop`.
- **Pasos:**
  1. `git diff --stat develop..HEAD -- Style-Busters-main` — debe listar exactamente 1 archivo.
  2. Confirmar que el archivo listado es `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css`.
  3. Confirmar ausencia de cambios en `BannerCarousel.jsx`, `HomePage.jsx`, `Data/homeImages.json`, `Layout.css` (ya cubierto parcialmente en TC-3; se extiende a `HomePage.jsx`/`Data/homeImages.json`/`Layout.css`).
- **Dato de entrada:** ninguno.
- **Resultado esperado:** 1 archivo modificado, 6 inserciones / 2 eliminaciones, ningún otro archivo del frontend tocado.
- **Resultado real:** confirmado — `git diff develop..HEAD --stat -- Style-Busters-main` reporta: `.../BannerCarousel/BannerCarousel.css | 8 ++++++--` — `1 file changed, 6 insertions(+), 2 deletions(-)`. Ningún otro archivo aparece en el stat.
- **Estado:** cumplido

> Nota de aislamiento: existen cambios sin commitear en `Header.jsx`/`Header.test.jsx` en el working tree, ajenos a este pendiente (trabajo en paralelo sobre otra rama del mismo repo compartido). Todo el análisis de este plan usa exclusivamente `git diff develop..HEAD` (comparación entre commits), no el working tree, por lo que esos cambios no contaminan ninguno de los TC anteriores.

## Quality gates (evidencia)
```
# comando : resultado
tests (npm test, Style-Busters-main)      : PASS — 50 archivos, 206 tests, 0 fallos (Duration 26.16s)
tests dirigidos (BannerCarousel)          : PASS — 1 archivo, 3 tests, 0 fallos
build (npm run build, Style-Busters-main) : PASS — "The build folder is ready to be deployed."
                                             8 warnings de ESLint preexistentes (ProductDetails.jsx,
                                             RegisterForm.jsx, SearchResultsList.jsx, CartContext.jsx,
                                             Layout.jsx, CheckoutPage.jsx, HomePage.jsx) — ninguno en
                                             BannerCarousel.jsx/.css; no relacionados con este cambio.
e2e (npm run e2e:ci:headless)             : no ejecutado en esta auditoría (cambio CSS puro, sin
                                             tocar JSX/lógica; no fue solicitado por el orchestrator
                                             para este pendiente XS)
```

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | cumplido |
| CA-2 | TC-2 | cumplido |
| CA-3 | TC-3 | cumplido |
| CA-4 | TC-4 | cumplido |
| CA-5 | TC-5 | cumplido |

**Resumen:** todos los CA (CA-1 a CA-5) cumplidos con evidencia verificada por inspección de código/`git diff` y por ejecución real de `npm test` (206/206 verde) y `npm run build` (build exitoso). Cambio acotado a `BannerCarousel.css`, sin regresión funcional ni de accesibilidad, sin breakpoints nuevos, sin colores inventados. Gate G3: **verde**.
