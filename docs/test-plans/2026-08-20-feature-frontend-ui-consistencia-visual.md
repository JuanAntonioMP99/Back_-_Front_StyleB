# Plan de Prueba: Consistencia visual y maquetación de la SPA (Style-Busters-main)

- **Spec:** `docs/specs/2026-08-20-feature-frontend-ui-consistencia-visual.md`  ·  **Backlog ID:** FE-UI-CONSISTENCY-2026-08-20
- **Fecha:** 2026-08-20
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`
- **Rama evaluada:** `feature/frontend-ui-consistencia-visual` (9 commits sobre `develop`)

## Entorno de prueba

- Frontend: `Style-Busters-main/` (React 19 + CRA + Vitest 4).
- **Limitación conocida y documentada del proyecto**: este sandbox no tiene Chrome/CDP disponible para ejecutar `e2e:ci:headless` (Cypress) ni para tomar capturas visuales reales. Toda la evidencia de este plan es por **inspección estática de código** (grep + lectura de archivo + `git diff`), no por render real en navegador. No se reinvestiga esta limitación, solo se constata.
- Método de verificación: `npm test` (Vitest + Testing Library sobre jsdom), `npm run build` (CRA/webpack + ESLint del build), `grep` dirigido, `git diff develop..HEAD -- Style-Busters-main`.
- Datos de prueba: no aplica (sin backend/BD involucrados; cambio puramente de CSS/JSX estructural).

## Casos de prueba

### TC-1 — Header sin enlaces a rutas inexistentes [CA-1]
- **Precondición:** rama con los 9 commits del builder.
- **Pasos:**
  1. `grep -n "to=\"/offers\"\|to=\"/new\"\|to=\"/bestsellers\"\|to=\"/flash-sale\"" Style-Busters-main/src/Layout/Navigation/Navigation.jsx`
  2. `node ./node_modules/vitest/vitest.mjs run -t Navigation`
- **Dato de entrada:** n/a.
- **Resultado esperado:** el grep no devuelve coincidencias; los 2 tests de `Navigation.test.jsx` pasan (desktop y móvil, ambos ya reescritos para afirmar la **ausencia** de los 4 enlaces en vez de su presencia).
- **Resultado real:** grep sin resultados (confirmado también con `git diff develop..HEAD`: se eliminan los 2 bloques `<Link to="/offers">…</Link>` etc. de escritorio, líneas ~107-121 originales, y el bloque móvil, líneas ~39-71 originales). `Navigation` test file: **1 passed | 49 skipped**, **2 tests passed**.
- **Estado:** ✅ cumplido

### TC-2 — Home mantiene el catálogo en tarjetas (no-regresión) [CA-2]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `git diff develop..HEAD -- Style-Busters-main/src/Components/List/List.jsx Style-Busters-main/src/Components/ProductCard/ProductCard.jsx Style-Busters-main/src/Components/ProductCard/ProductCard.css`
  2. `git diff develop..HEAD -- Style-Busters-main/src/Pages/HomePage.jsx`
- **Resultado esperado:** ningún diff (no-regresión, CA-2 es de verificación).
- **Resultado real:** ambos comandos devuelven 0 líneas de diff. `HomePage.jsx` sigue delegando en `List.jsx` → `ProductCard.jsx` sin cambios.
- **Estado:** ✅ cumplido

### TC-3 — ProductDetails sin custom properties indefinidas [CA-3]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `grep -n "var(--" Style-Busters-main/src/Components/ProductDetails/ProductDetails.css`
  2. Confirmar cada token contra `:root` de `Style-Busters-main/src/index.css`.
- **Resultado esperado:** todos los `var(--x)` referencian tokens realmente declarados en `index.css`.
- **Resultado real:** `ProductDetails.css` usa únicamente `--color-bg-card` (línea 19), `--color-bg-dark` (línea 26), `--color-text-muted` (línea 52), `--color-primary` (línea 69) — los 4 existen en `:root` de `index.css`. No queda ninguna referencia a `--surface`, `--radius`, `--border`, `--bg`, `--muted`.
- **Estado:** ✅ cumplido

### TC-4 — Ningún color nuevo fuera de la paleta (archivos enumerados en CA-4) [CA-4]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `grep -rn "var(--" <11 archivos listados en CA-4>` y contrastar cada token contra `:root` de `index.css` (tokens reales: `--color-primary`, `--color-secondary`, `--color-bg-dark`, `--color-bg-card`, `--color-accent-pink`, `--color-accent-orange`, `--color-accent-lime`, `--color-text-main`, `--color-text-muted`, `--spacing-sm/md/lg`, `--container-width`).
  2. `grep -rniE "var\(--(surface|border|bg|text|accent|muted|radius|elev|gap|danger|content-max-width|border-color|bg-color-main|bg-color-secondary|text-color-main|text-color-secondary|color-primary-dark|color-strong-blue|color-white|color-blue|color-dark|color-gray|color-strong-gray|color-light-gray|color-purple|color-pink|color-red|color-primary-light|accent-contrast)\b"` sobre los 11 archivos.
  3. Revisar `ProfileCard.jsx` `ROLE_COLORS`.
- **Resultado esperado:** ningún `var(--x)` referencia una custom property indefinida; `ROLE_COLORS` usa tokens de la paleta, no hex.
- **Resultado real:**
  - Los 11 archivos (`Header.css`, `Navigation.css`, `Layout.css`, `ErrorMessage.css`, `Loading.css`, `ProfileCard.css`, `ProductDetails.css`, `SearchResultsList.css`, `Address.css`, `Payment.css`, `SummarySection.css`) solo usan `var(--color-*)` / `var(--container-width)`, todos declarados en `index.css`. El grep de familias indefinidas devuelve 0 resultados.
  - `ProfileCard.jsx` línea 6-7: `admin: "var(--color-secondary)"`, `customer: "var(--color-accent-lime)"` (antes `#2563eb` / `#22c55e`, confirmado por `git diff`). Cumple.
  - **Hallazgo adicional (no bloqueante para este CA, informativo):** `Badge.css` (no listado en la sección "Dependencias" del spec) también tenía custom properties indefinidas (`--gap`, `--r5`, `--color-green`, `--color-red`, `--color-blue`) y fue corregido en el mismo espíritu de CA-4 (ahora usa `--color-accent-lime`, `--color-accent-pink`, `--color-accent-orange`, `--color-secondary` y valores literales). No es un defecto, pero el spec no lo declaró como archivo a tocar; se documenta para trazabilidad.
  - **Hallazgo que SÍ incumple CA-4 (ver TC-9 / TC-10):** `RegisterForm.css` (archivo tocado por este pendiente, cubierto por CA-5e) introduce un `:root` propio con 7 custom properties y valores hex que **no coinciden** con la paleta real (`--primary-color: #FFD700` vs `--color-primary: #FCEE0C`; `--card-bg: #111111` vs `--color-bg-card: #2C2C2C`; `--text-muted: #aaaaaa` vs `--color-text-muted: #CCCCCC`; `--border-color: #333333` y `--error-color: #ff4d4d` sin equivalente en `index.css`). Esto contradice tanto la regla general de CA-4 ("toda declaración de color... en los archivos tocados por este pendiente debe resolver a uno de los tokens ya definidos... nunca a un hex/rgb de tema claro" — en este caso no es tema claro, pero sí es un color nuevo fuera de paleta) como la "Decisión de Diseño" explícita del spec ("se consolida todo el CSS tocado sobre los tokens `--color-*` ya definidos... en vez de definir un `:root` paralelo").
- **Estado:** ⚠️ parcial — cumplido en los 11 archivos enumerados explícitamente por CA-4 y en `ProfileCard.jsx`; **no cumplido** en `RegisterForm.css` (archivo también tocado por este pendiente, ver TC-9).

### TC-5 — SearchResults sin fallbacks de tema claro [CA-5a]
- **Precondición:** rama con los 9 commits.
- **Pasos:** `grep -rniE "#fff\b|#f9fafb|#333\b|#666\b|#555\b|#e5e5e5|#ddd\b|#777\b|:\s*blue\b|#FFFF33"` sobre `Style-Busters-main/src/Components/SearchResultsList/SearchResultsList.css`.
- **Resultado esperado:** sin coincidencias.
- **Resultado real:** 0 coincidencias. El archivo usa `var(--container-width)`, `var(--color-text-main)`, `var(--color-text-muted)`, `var(--color-bg-card)`, `var(--color-bg-dark)`, `var(--color-primary)` exclusivamente (confirmado también en TC-4).
- **Estado:** ✅ cumplido

### TC-6 — Checkout (Address/Payment/Summary) sin fallbacks de tema claro [CA-5b, parte "colores"]
- **Precondición:** rama con los 9 commits.
- **Pasos:** `grep -rniE "#fff\b|#fafafa|#f4f4f5|#f9f9f9|#111\b|#666\b|#eee\b|#ddd\b"` sobre `Address.css`, `Payment.css`, `SummarySection.css`.
- **Resultado esperado:** sin coincidencias.
- **Resultado real:** 0 coincidencias en los 3 archivos. Usan `var(--color-bg-card)`, `var(--color-primary)`, `var(--color-text-muted)`, `var(--color-text-main)`, `var(--color-secondary)`, `var(--color-bg-dark)`, `var(--color-accent-lime)` y `rgba(255,255,255,0.05-0.25)` (patrón neutro ya usado en el repo, permitido por CA-4).
- **Estado:** ✅ cumplido

### TC-7 — CA-5b (crítico): coincidencia className-por-className Address/Payment/Summary vs. JSX real
- **Precondición:** rama con los 9 commits.
- **Pasos:** comparar manualmente, archivo por archivo, cada `className` renderizado por `AddressItem.jsx`/`AddressList.jsx`/`AddressForm.jsx`, `PaymentItem.jsx`/`PaymentList.jsx`/`PaymentForm.jsx` y `SummarySection.jsx` contra los selectores declarados en `Address.css`/`Payment.css`/`SummarySection.css`.
- **Resultado esperado:** cada className usado en JSX tiene un selector CSS correspondiente (o hereda de uno más genérico), y no quedan selectores CSS huérfanos apuntando a clases que el JSX no usa.
- **Resultado real (comparación exhaustiva):**
  - **`SummarySection.jsx` ↔ `SummarySection.css`:** coincidencia 100%. Clases usadas: `summary-section`, `expanded` (condicional), `summary-header`, `summary-title`, `summary-content`, `summary-badge`, `summary-expanded-content`. Todas están declaradas y estilizadas en `SummarySection.css`. Sin huérfanos.
  - **`AddressList.jsx`/`AddressForm.jsx` ↔ `Address.css`:** `address-list`, `address-list-header`, `address-list-content`, `address-form`, `form-checkbox`, `form-actions` coinciden. `default-badge` coincide (usado en `AddressItem.jsx` línea 19-21).
  - **`AddressItem.jsx` ↔ `Address.css` (mismatch #1):** `AddressItem.jsx` línea 7-9 aplica condicionalmente la clase `default` (`${address.default ? "default" : ""}`) al contenedor `.address-item`. `Address.css` (108 líneas) **no define ningún selector `.address-item.default`** (solo existe `.address-item.selected` en la línea 38). El elemento sigue viéndose como card oscura porque hereda el estilo base de `.address-item`, pero la clase `default` en sí no tiene ningún efecto visual propio — no es el bug de "panel blanco" que corrige este spec, pero es una clase de JSX sin selector CSS correspondiente.
  - **`Address.css` (mismatch #2, selector huérfano):** `Address.css` líneas 89-93 declaran `.form-row` y `.form-row > * { flex: 1; }`, pero `AddressForm.jsx` (154 líneas) **no usa la clase `form-row` en ningún punto** (cada `<Input>` se renderiza suelto dentro de `.address-form`, sin agrupador). Selector CSS sin elemento que lo use.
  - **`PaymentList.jsx`/`PaymentForm.jsx` ↔ `Payment.css`:** `payment-list`, `payment-list-header`, `payment-list-content`, `payment-form`, `form-row` (sí usado aquí, en `PaymentForm.jsx` línea 91, a diferencia de Address), `form-checkbox`, `form-actions` coinciden. `isDefault-badge` coincide (`PaymentItem.jsx` línea 21-23).
  - **`PaymentItem.jsx` ↔ `Payment.css` (mismatch #3, mismo patrón que #1):** `PaymentItem.jsx` línea 12-14 aplica condicionalmente la clase `isDefault` al contenedor `.payment-item`. `Payment.css` (102 líneas) **no define `.payment-item.isDefault`** (solo `.payment-item.selected`, línea 35). Mismo caso que Address: hereda estilo base, sin regresión visual de tipo "panel blanco", pero no hay coincidencia 1:1.
- **Estado:** ⚠️ parcial — `SummarySection` cumple al 100%. `Address`/`Payment` cumplen en las clases que producen el efecto visual central del CA (fondo/borde/radio de card ya no son transparentes ni de tema claro), pero **no coinciden exactamente** className-por-className: 2 clases condicionales sin estilo propio (`address-item.default`, `payment-item.isDefault`) y 1 selector CSS huérfano (`Address.css` `.form-row`, sin uso en `AddressForm.jsx`). No causan regresión visual observable (el bug histórico de "panel blanco" queda corregido), pero no se puede afirmar coincidencia exacta tal como pide el CA. Reportado para que el orchestrator decida si amerita un ajuste menor antes de PR.

### TC-8 — Cart/CartView reutilizado en Checkout sin depender de carga previa de `/cart` [CA-5c]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `grep -n "import \"./CartView.css\"" Style-Busters-main/src/Components/CartView/CartView.jsx`
  2. `grep -n "\.cart-item\b" Style-Busters-main/src/Pages/CartPage.css`
  3. Inspección de `git diff develop..HEAD -- Style-Busters-main/src/Pages/CartPage.css` (214 líneas de diff, mayormente eliminación).
- **Resultado esperado:** `CartView.jsx` importa su propio CSS; `CartPage.css` ya no duplica `.cart-item`/`.cart-view`/`.cart-summary`/`.cart-empty`.
- **Resultado real:** `CartView.jsx` línea 5: `import "./CartView.css";` (confirmado por `git diff`: `+import "./CartView.css";`). `CartPage.css` (post-cambio) solo conserva `.cart`, `.cart-header*`, `.cart-items-count`, `.clear-cart-btn`, `.cart-items` (grid) y media queries — ninguna regla `.cart-item`/`.cart-view`/`.cart-summary`/`.cart-empty` (esas reglas ahora viven únicamente en `CartView.css`, orphan file que ahora sí se importa). Como `CartView.jsx` ahora carga su propio CSS de forma directa (no depende del chunk de `/cart`), entrar directo a `/checkout` en una sesión nueva ya no deja el resumen de pedido sin estilo — esto se verifica por inspección de código (imports estáticos de webpack/CRA resuelven el CSS en el bundle del componente, no del chunk de la ruta que lo invocó primero). `CartView.test.jsx` está en la suite y pasa (incluido en el conteo global de 205 tests).
- **Estado:** ✅ cumplido

### TC-9 — Login sin colisión de clases `.login-*` fuera de LoginForm.css [CA-5d]
- **Precondición:** rama con los 9 commits.
- **Pasos:** `grep -rln "\.login-" Style-Busters-main/src --include=*.css`
- **Resultado esperado:** único resultado, `LoginForm.css`.
- **Resultado real:** único match: `src/Components/LoginForm/LoginForm.css`. `Pages/Login.css` fue eliminado (confirmado: `git diff --stat` muestra `Style-Busters-main/src/Pages/Login.css | 115 -----------` — archivo borrado; ya no existe en el árbol de trabajo). `Pages/CheckoutPage.css` líneas 1-53 fueron reemplazadas por reglas propias de checkout (`checkout-container`, `checkout-title`, `checkout-layout`, `checkout-section`, `selected-address`, `selected-payment`) sin ninguna clase `.login-*`.
- **Estado:** ✅ cumplido

### TC-10 — RegisterForm ya no vacío y define las clases usadas por RegisterForm.jsx [CA-5e]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `wc -l Style-Busters-main/src/Components/RegisterForm/RegisterForm.css`
  2. Contrastar clases de `RegisterForm.jsx` (`register-container`, `register-card`, `register-form`, `form-group`, `field-error`, `register-footer`) contra los selectores del CSS.
  3. `git diff develop..HEAD -- Style-Busters-main/src/Components/RegisterForm/RegisterForm.css` (verificar que el blob previo era vacío, `index e69de29b`).
- **Resultado esperado:** archivo no vacío, las 6 clases usadas por el JSX están definidas, y — por CA-4/Decisión de Diseño — sin introducir un `:root` paralelo ni colores fuera de la paleta de `index.css`.
- **Resultado real:**
  - El archivo pasó de 0 bytes (`e69de29b`, blob vacío en `develop`) a 135 líneas. Las 6 clases usadas por `RegisterForm.jsx` (`register-container` línea 126, `register-card` línea 127, `register-form` línea 129, `form-group` líneas 130/148/166/184/205, `field-error` líneas 142/160/178/197/215, `register-footer` línea 230) están definidas en `RegisterForm.css`. Visualmente coherente con `LoginForm.css` en estructura (card centrada, mismo patrón de formulario).
  - **Incumplimiento de la restricción "sin `:root` paralelo" y "sin colores nuevos" (compartido con TC-4):** `RegisterForm.css` líneas 1-9 declaran:
    ```css
    :root {
        --primary-color: #FFD700; /* vs --color-primary real: #FCEE0C */
        --bg-dark: #0a0a0a;       /* == --color-bg-dark real: #0A0A0A (coincide) */
        --card-bg: #111111;       /* vs --color-bg-card real: #2C2C2C — NO coincide */
        --text-main: #ffffff;     /* == --color-text-main real: #FFFFFF (coincide) */
        --text-muted: #aaaaaa;    /* vs --color-text-muted real: #CCCCCC — NO coincide */
        --border-color: #333333;  /* sin token equivalente en index.css */
        --error-color: #ff4d4d;   /* vs --color-accent-pink real: #FF0090 — NO coincide */
    }
    ```
    3 de 7 tokens introducen valores hex que no existen en ningún lugar de `index.css` (`--card-bg`, `--text-muted` con distinto tono, `--border-color`, `--error-color`), y el patrón mismo de declarar un `:root` adicional es exactamente lo que el spec pide evitar explícitamente en su sección "Decisiones de Diseño" ("en vez de definir un `:root` paralelo... los únicos valores de color reales y vigentes en el proyecto son los de `index.css`"). Es un `:root` global (no un scope local), por lo que las custom properties quedan disponibles document-wide, aunque no colisionan por nombre con las de `index.css` (nombres distintos: `--primary-color` vs `--color-primary`, etc.).
- **Estado:** ⚠️ parcial — la parte funcional/estructural del CA (archivo no vacío, clases definidas, visual coherente con LoginForm) se cumple; la restricción de paleta (compartida con CA-4 y con la Decisión de Diseño del spec) **no se cumple**: se introduce un `:root` paralelo con al menos 4 valores hex nuevos fuera de la paleta de `index.css`.

### TC-11 — Profile: tokens indefinidos y colores de rol resueltos [CA-5f]
- **Precondición:** rama con los 9 commits.
- **Pasos:** cubierto por TC-4 (`ProfileCard.css` incluido en la lista de 11 archivos; `ProfileCard.jsx` `ROLE_COLORS`).
- **Resultado esperado:** ver TC-4.
- **Resultado real:** `ProfileCard.css` solo usa `var(--color-bg-dark)`, `var(--color-bg-card)`, `var(--color-text-muted)`, `var(--color-secondary)`, `var(--color-primary)` (confirmado en el grep de TC-4). `ProfileCard.jsx` `ROLE_COLORS` ya no usa hex (ver TC-4).
- **Estado:** ✅ cumplido

### TC-12 — Home/ConfirmationPage no regresan visualmente (no-regresión) [CA-5g]
- **Precondición:** rama con los 9 commits.
- **Pasos:** `git diff develop..HEAD -- Style-Busters-main/src/Pages/HomePage.css Style-Busters-main/src/Pages/HomePage.jsx Style-Busters-main/src/Pages/ConfirmationPage.css Style-Busters-main/src/Pages/ConfirmationPage.jsx`
- **Resultado esperado:** sin diff (ya usaban la paleta real, según el spec) o diff mínimo no funcional.
- **Resultado real:** 0 líneas de diff en los 4 archivos — ningún cambio.
- **Estado:** ✅ cumplido

### TC-13 — Sin contenido inventado, solo CSS + JSX estructural mínimo [CA-6]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `git diff develop..HEAD -- Style-Busters-main --stat` (20 archivos, +497/-931).
  2. `git diff develop..HEAD -- 'Style-Busters-main/src/Data' 'Style-Busters-main/src/App' 'Style-Busters-main/src/Services' 'Style-Busters-main/package.json'`
- **Resultado esperado:** ningún archivo de datos (`Data/*.json`), rutas (`App/App.jsx`), servicios o `package.json` tocado; el diff se limita a `.css`, y en JSX solo a: 1 `import` de CSS (`CartView.jsx`), eliminación de bloques `<Link>` (`Navigation.jsx`), reescritura de aserciones de test (`Navigation.test.jsx`), y 1 línea de `ROLE_COLORS` (`ProfileCard.jsx`).
- **Resultado real:** el segundo comando devuelve 0 líneas — sin cambios en `Data/`, `App/`, `Services/` ni `package.json`. De los 20 archivos del diff, 15 son `.css`, 1 es `RegisterForm.css` (nuevo contenido, no nuevo archivo — el archivo ya existía vacío), y solo 4 son `.jsx`/`.test.jsx`: `CartView.jsx` (+1 línea de import), `Navigation.jsx` (solo eliminaciones de `<Link>`), `Navigation.test.jsx` (reescritura de aserciones existentes) y `ProfileCard.jsx` (2 líneas de `ROLE_COLORS`). Ningún texto/dato/prop de negocio/ruta nueva. `Badge.css` (fuera de la lista de "Dependencias" del spec) también fue tocado, en el mismo espíritu de CA-4 (ver TC-4) — no introduce contenido nuevo, solo resuelve custom properties indefinidas.
- **Estado:** ✅ cumplido

### TC-14 — Verificación del bug histórico de imagen de producto (sin código nuevo) [CA-7]
- **Precondición:** rama con los 9 commits.
- **Pasos:**
  1. `git diff develop..HEAD -- Style-Busters-main/src/utils/productImage.js`
  2. `node ./node_modules/vitest/vitest.mjs run -t productImage` (incluido en la corrida global).
- **Resultado esperado:** diff vacío; el archivo sigue existiendo con su lógica y tests en verde.
- **Resultado real:** diff vacío (0 líneas) — `productImage.js` no fue tocado por esta rama. Sus tests (`utils/productImage.test.js`) están incluidos en los 50 archivos / 205 tests que pasan en la corrida global de `npm test`.
- **Estado:** ✅ cumplido

### TC-15 (caso negativo) — Rutas eliminadas no reaparecen en ningún `<Link>` de Navigation.jsx
- **Precondición:** rama con los 9 commits.
- **Pasos:** `grep -c "to=" Style-Busters-main/src/Layout/Navigation/Navigation.jsx` y revisar manualmente cada uno de los `to="..."` restantes.
- **Dato de entrada:** n/a.
- **Resultado esperado:** los únicos `to="..."` restantes son dinámicos (`` `/category/${category._id}` ``, `` `/category/${subcat._id}` ``); ninguno es literal `/offers`, `/new`, `/bestsellers` ni `/flash-sale`.
- **Resultado real:** confirmado por lectura completa del archivo (117 líneas): los únicos 3 usos de `to=` son `` `/category/${category._id}` `` (línea 43, móvil), `` `/category/${category._id}` `` (línea 78, dropdown escritorio) y `` `/category/${subcat._id}` `` (línea 92, subcategorías). Ningún literal de ruta eliminada.
- **Estado:** ✅ cumplido

### TC-16 (caso negativo) — CartView.css no depende de que `/cart` se haya cargado antes en la sesión
- **Precondición:** rama con los 9 commits.
- **Pasos:** inspección de `CartView.jsx` (import estático de `./CartView.css` en la cabecera del módulo, no condicional ni lazy) y de `CheckoutPage.jsx` (renderiza `<CartView />` sin passthrough de estilos ni dependencia de `CartPage.css`).
- **Resultado esperado:** el CSS de `CartView` se resuelve como dependencia directa del componente (bundler la incluye en el chunk que contiene `CartView`, independientemente de qué ruta lo cargue primero), no como un side-effect de haber visitado `/cart` antes.
- **Resultado real:** `CartView.jsx` línea 5 importa `./CartView.css` de forma estática e incondicional; CRA/webpack la asocia como dependencia del módulo `CartView`, resuelta en el momento en que el bundler procesa ese módulo, sin importar desde qué punto de entrada (chunk de `/cart` o de `/checkout`) se alcanza primero. Antes del fix, `CartView.jsx` no tenía ningún `import` de CSS propio y dependía por completo de que `CartPage.css` (cargado solo por el chunk de `/cart`) ya estuviera en el DOM. Verificado por inspección estática de código; no se pudo confirmar con un run real de navegador por la limitación de sandbox documentada.
- **Estado:** ✅ cumplido (por inspección de código; sin confirmación en navegador real por limitación de entorno)

## Quality gates (evidencia)
```
# comando : resultado
tests (npm test, Vitest)     : PASS — 50 test files, 205 tests, 0 fallidos (19.70s)
                                Navigation.test.jsx aislado: 1 file / 2 tests PASS
build (npm run build)        : PASS ("Compiled with warnings.") — build de producción generado
                                (build/static/js/main.*.js 104.17 kB gzip, sin errores de compilación)
lint (ESLint vía CRA build)  : 8 warnings no-unused-vars, TODAS en archivos NO tocados por esta rama
                                (ProductDetails.jsx, RegisterForm.jsx, SearchResultsList.jsx,
                                CartContext.jsx, Layout.jsx, CheckoutPage.jsx, HomePage.jsx) —
                                confirmado por git diff develop..HEAD: 0 líneas de diff en esos 7 archivos.
                                No hay script de lint standalone en package.json; el único lint
                                disponible es el que ejecuta react-scripts durante el build.
format                       : sin script de format configurado en package.json (no aplica)
e2e (npm run e2e:ci:headless): NO EJECUTADO — limitación conocida y documentada del entorno
                                (sandbox sin Chrome/CDP disponible para Cypress; no se reinvestiga,
                                solo se constata). Todos los CA de este spec se verificaron por
                                inspección estática de código en su lugar (ver casos TC-1 a TC-16).
```

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1, TC-15 | ✅ cumplido |
| CA-2 | TC-2 | ✅ cumplido |
| CA-3 | TC-3 | ✅ cumplido |
| CA-4 | TC-4 | ⚠️ parcial (11 archivos enumerados + ProfileCard OK; `RegisterForm.css` no cumple, ver TC-10) |
| CA-5a | TC-5 | ✅ cumplido |
| CA-5b | TC-6, TC-7 | ⚠️ parcial (colores OK; coincidencia className exacta no se cumple en 3 puntos, ver TC-7) |
| CA-5c | TC-8, TC-16 | ✅ cumplido |
| CA-5d | TC-9 | ✅ cumplido |
| CA-5e | TC-10 | ⚠️ parcial (funcional OK; introduce `:root` paralelo con colores nuevos, ver TC-10) |
| CA-5f | TC-11 | ✅ cumplido |
| CA-5g | TC-12 | ✅ cumplido |
| CA-6 | TC-13 | ✅ cumplido |
| CA-7 | TC-14 | ✅ cumplido |

**Resumen:** 10 CA cumplidos, 3 parciales (CA-4, CA-5b, CA-5e — los 3 relacionados entre sí: el mismo `RegisterForm.css` con `:root` paralelo afecta a CA-4 y CA-5e; el mismo hallazgo de clases condicionales sin estilo afecta a CA-5b). Quality gates de frontend (tests + build) en verde; gate E2E no ejecutable en este sandbox (limitación documentada, no atribuible a este cambio). **No se recomienda cerrar el spec sin re-despachar a frontend-builder** los 2 hallazgos concretos:

1. `Style-Busters-main/src/Components/RegisterForm/RegisterForm.css:1-9` — eliminar el `:root` paralelo y reemplazar `--primary-color`/`--bg-dark`/`--card-bg`/`--text-main`/`--text-muted`/`--border-color`/`--error-color` por los tokens reales de `index.css` (`--color-primary`, `--color-bg-dark`, `--color-bg-card`, `--color-text-main`, `--color-text-muted`, `rgba(255,255,255,0.1)` o similar para borde, `--color-accent-pink` para error).
2. `Style-Busters-main/src/Components/Checkout/Address/Address.css` y `.../PaymentMethods/Payment.css` — decidir si se agrega estilo a `.address-item.default` / `.payment-item.isDefault` (para que coincida con lo que renderiza el JSX) o si se retira la clase condicional del JSX; y eliminar o usar el selector huérfano `.form-row` de `Address.css`.

El resto de los 10 CA cumplidos no requiere acción adicional.
