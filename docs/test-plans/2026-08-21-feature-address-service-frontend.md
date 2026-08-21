# Plan de Prueba: Servicio frontend de Direcciones conectado a `/api/addresses`

- **Spec:** `docs/specs/2026-08-21-feature-address-service-frontend.md`  ·  **Backlog ID:** F4.2 (K14)
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** frontend `Style-Busters-main/`
- **Commit auditado:** `1adf27b1` (`feat(address-service): conectar servicio frontend a /api/addresses`), único commit de implementación sobre `feature/address-service-frontend`, comparado contra `develop` con `git diff develop..HEAD`.
- **Archivos bajo prueba:** `Style-Busters-main/src/Services/addressService.js`, `Style-Busters-main/src/Services/addressService.test.js`.
- **Nota de aislamiento:** el working tree tiene archivos sin trackear ajenos a este pendiente (`Style-Busters-main/src/Services/paymentMethodService.js`/`.test.js`, `.agents/skills/`, `.claude/skills/browser-use/`, `skills-lock.json`) — no se tocan ni se incluyen en el análisis; todo el veredicto usa `git diff develop..HEAD`, no el working tree completo.

## Entorno de prueba
- Frontend: Vitest 4 (vía `react-scripts`/CRA), `vi.mock` de `apiClient` — sin llamadas HTTP reales.
- Comando: `cd Style-Busters-main && npm test` (invoca `node ./node_modules/vitest/vitest.mjs run`).
- Referencia de contrato backend (solo lectura, sin cambios en este pendiente): `Base_Datos_StyleB/src/controllers/addressController.js`, `Base_Datos_StyleB/src/routes/addressRoutes.js`.

## Casos de prueba

### TC-1 — `getMyAddresses()` hace `GET /addresses` y retorna el array desenvuelto [CA-1]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.js` líneas 7-10: `apiClient.get("/addresses")`, `return response.data.addresses`.
  2. Confirmación contra `addressController.js` (`getUserAddresses`, línea 12: `res.status(200).json({ addresses })`) — la forma envuelta `{ addresses }` coincide con lo que el servicio desenvuelve.
  3. Ejecución dirigida: `getMyAddresses hace GET /addresses y devuelve la lista` en `addressService.test.js`.
- **Resultado esperado:** `apiClient.get` llamado con `"/addresses"`; el resultado es el array interno (`[{ _id: "a1" }]`), no el objeto `{ addresses: [...] }`.
- **Resultado real:** confirmado por lectura de código y por ejecución del test — PASA (`getMyAddresses hace GET /addresses y devuelve la lista`, 3ms).
- **Estado:** cumplido

### TC-2 — `getDefaultAddress()` no hace llamada HTTP propia; deriva de `getMyAddresses()` con los 3 casos [CA-2]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.js` líneas 12-15: no hay ningún `apiClient.<método>` dentro de `getDefaultAddress`, solo `await getMyAddresses()` y la expresión `addresses.find((address) => address.isDefault) || addresses[0] || null`.
  2. Ejecución dirigida con `--reporter=verbose` de los 3 casos en `addressService.test.js`:
     - (a) `getDefaultAddress devuelve la marcada isDefault` — lista con una dirección `isDefault: true` entre otras `false`.
     - (b) `getDefaultAddress cae a la primera si ninguna es default` — lista con una sola dirección, `isDefault: false`.
     - (c) `getDefaultAddress devuelve null si no hay direcciones` — `addresses: []`.
- **Resultado esperado:** (a) retorna el objeto con `isDefault: true`; (b) retorna el primer elemento del array (consistente con el orden `isDefault: -1, _id: -1` que ya aplica el backend); (c) retorna `null`. Ninguno de los 3 casos invoca `apiClient.post/put/delete`, y `apiClient.get` se invoca exactamente una vez por caso (vía `getMyAddresses`, sin segunda llamada).
- **Resultado real:** confirmado — ejecución dirigida `node ./node_modules/vitest/vitest.mjs run src/Services/addressService.test.js --reporter=verbose`:
  ```
  ✓ getDefaultAddress devuelve la marcada isDefault            1ms
  ✓ getDefaultAddress cae a la primera si ninguna es default   1ms
  ✓ getDefaultAddress devuelve null si no hay direcciones      0ms
  ```
  Los 3 casos PASAN. Código confirmado: no hay `try/catch` ni llamada HTTP adicional dentro de `getDefaultAddress`, la única dependencia externa es `getMyAddresses()`.
- **Estado:** cumplido

### TC-3 — `createAddress(address)` hace `POST /addresses` sin transformar el payload y retorna el documento sin envolver [CA-3]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.js` líneas 17-20: `apiClient.post("/addresses", address)`, `return response.data`, sin ninguna manipulación del objeto `address` recibido.
  2. Confirmación contra `addressRoutes.js` (`createAddressValidation` = `[...addressBodyValidation]`, campos `address/city/state/postalCode/country/phone` `notEmpty()`, `isDefault` opcional `isBoolean()`, `addressType` opcional `isIn([...])`) y `addressController.js` (`createAddress`, línea 68: `res.status(201).json(newAddress)`, sin envoltura).
  3. Ejecución dirigida: `createAddress hace POST /addresses` en `addressService.test.js`.
- **Resultado esperado:** `apiClient.post` llamado con `("/addresses", payload)` exactamente el mismo objeto recibido; el resultado es `response.data` sin modificar.
- **Resultado real:** confirmado — test PASA (1ms); aserción `expect(apiClient.post).toHaveBeenCalledWith("/addresses", payload)` y `expect(result).toEqual({ _id: "a1", ...payload })` verificadas.
- **Estado:** cumplido

### TC-4 — `updateAddress(addressId, address)` hace `PUT /addresses/:addressId` y retorna el documento actualizado sin envolver [CA-4]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.js` líneas 22-25: `apiClient.put(\`/addresses/${addressId}\`, address)`, `return response.data`.
  2. Confirmación contra `addressController.js` (`updateAddress`, línea 115: `res.status(200).json(shipAddress)`, sin envoltura).
  3. Ejecución dirigida: `updateAddress hace PUT /addresses/:id` en `addressService.test.js`.
- **Resultado esperado:** `apiClient.put` llamado con `(\`/addresses/${addressId}\`, address)`; el resultado es `response.data`.
- **Resultado real:** confirmado — test PASA (0ms); aserción `expect(apiClient.put).toHaveBeenCalledWith("/addresses/a1", payload)` y `expect(result).toEqual({ _id: "a1", ...payload })` verificadas.
- **Estado:** cumplido

### TC-5 — `deleteAddress(addressId)` hace `DELETE /addresses/:addressId` y retorna el `{ message }` del backend [CA-5]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.js` líneas 27-30: `apiClient.delete(\`/addresses/${addressId}\`)`, `return response.data`.
  2. Confirmación contra `addressController.js` (`deleteAddress`, líneas 137-139: `res.status(200).json({ message: "Address deleted successfully" })` — status `200` con body, no `204`).
  3. Ejecución dirigida: `deleteAddress hace DELETE /addresses/:id` en `addressService.test.js`.
- **Resultado esperado:** `apiClient.delete` llamado con el path correcto; el resultado incluye `{ message: "ok" }` (mock del test) tal como devolvería el backend real (`{ message: "Address deleted successfully" }`).
- **Resultado real:** confirmado — test PASA (0ms); aserción `expect(apiClient.delete).toHaveBeenCalledWith("/addresses/a1")` y `expect(result).toEqual({ message: "ok" })` verificadas.
- **Estado:** cumplido

### TC-6 — Ninguna de las 5 funciones atrapa errores [CA-6]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:** inspección completa de `addressService.js` (30 líneas) buscando la palabra clave `try`/`catch`.
- **Resultado esperado:** ninguna coincidencia de `try`/`catch` en el archivo; los rechazos de `apiClient.<método>` se propagan tal cual (ya clasificados por el interceptor de `apiClient.js`), mismo patrón que `categoryService.js`/`productService.js`/`cartService.js`.
- **Resultado real:** confirmado por lectura completa del archivo — 0 ocurrencias de `try`/`catch`. No requiere test dedicado (el propio spec lo señala como verificable solo por inspección, sin test nuevo esperado, y ningún otro servicio del repo lo testea tampoco).
- **Estado:** cumplido (verificación por inspección de código, según lo previsto por el propio CA-6; no aplica evidencia de test dedicado)

### TC-7 — `addressService.test.js` cubre las 5 funciones con mocks de `apiClient`, sin red real [CA-7]
- **Precondición:** commit `1adf27b1` aplicado.
- **Pasos:**
  1. Inspección de `addressService.test.js` líneas 3-5: `vi.mock("./apiClient", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))` — mismo path relativo sin extensión `.js` que usa `addressService.js` en su propio import.
  2. Inspección de línea 18: `vi.clearAllMocks()` dentro de `beforeEach`.
  3. Ejecución de `cd Style-Busters-main && npm test` (suite completa) y ejecución dirigida de `addressService.test.js` con `--reporter=verbose`.
- **Resultado esperado:** 7 casos (`getMyAddresses`, 3× `getDefaultAddress`, `createAddress`, `updateAddress`, `deleteAddress`) en verde; ninguna petición HTTP real (todo pasa por el mock).
- **Resultado real:** confirmado —
  - `npm test` (suite completa del repo): `Test Files 52 passed (52)`, `Tests 223 passed (223)`, `Duration 22.55s`, incluye `addressService.test.js`.
  - Ejecución dirigida `node ./node_modules/vitest/vitest.mjs run src/Services/addressService.test.js --reporter=verbose`: `Test Files 1 passed (1)`, `Tests 7 passed (7)`, los 7 casos listados individualmente como ✓.
- **Estado:** cumplido

### TC-8 — Ambos archivos quedan trackeados en git [CA-8]
- **Precondición:** ninguna.
- **Pasos:**
  1. `git show --stat 1adf27b1` — confirma que el commit incluye ambos archivos.
  2. `git status` sobre el árbol actual — confirma que `addressService.js`/`addressService.test.js` **no** aparecen como `??` (no trackeados); los únicos `??` presentes son ajenos a este pendiente (`paymentMethodService.js`/`.test.js`, `.agents/skills/`, `.claude/skills/browser-use/`, `skills-lock.json`).
- **Resultado esperado:** `git show --stat 1adf27b1` lista los 2 archivos (`addressService.js` +30, `addressService.test.js` +91); `git status` no reporta ninguno de los 2 como sin trackear.
- **Resultado real:** confirmado — `git show --stat 1adf27b1`:
  ```
   Style-Busters-main/src/Services/addressService.js       | 30 +++++++
   .../src/Services/addressService.test.js                 | 91 ++++++++++++++++++++++
   2 files changed, 121 insertions(+)
  ```
  `git status` actual no incluye `addressService.js` ni `addressService.test.js` entre los "Untracked files".
- **Estado:** cumplido

### TC-9 — Fuera de alcance: el diff no toca ningún componente/página, solo los 2 archivos de servicio [CA-9]
- **Precondición:** rama `feature/address-service-frontend`, comparación contra `develop`.
- **Pasos:**
  1. `git diff develop..feature/address-service-frontend --stat` (repo completo).
  2. `git diff develop..feature/address-service-frontend -- Style-Busters-main` — aislado al proyecto frontend.
  3. Confirmar ausencia explícita de cambios en `Pages/CheckoutPage.jsx`, `Components/Checkout/Address/*`, `Services/shippingService.js`, `Data/shipping-address.json`, y ausencia total de cambios bajo `Base_Datos_StyleB/`.
- **Resultado esperado:** el diff completo respecto a `develop` toca exactamente `Style-Busters-main/src/Services/addressService.js`, `Style-Busters-main/src/Services/addressService.test.js` y el propio spec (`docs/specs/2026-08-21-feature-address-service-frontend.md`); ningún componente, página ni archivo de backend en el diff.
- **Resultado real:** confirmado —
  ```
  git diff develop..feature/address-service-frontend --stat
   Style-Busters-main/src/Services/addressService.js            |  30 +++++
   .../src/Services/addressService.test.js                      |  91 ++++++++++++++
   .../2026-08-21-feature-address-service-frontend.md            | 134 +++++++++++++++++++++
   3 files changed, 255 insertions(+)
  ```
  `git diff develop..feature/address-service-frontend -- Style-Busters-main` reporta exactamente 2 archivos (`diff --git` × 2), ambos bajo `Services/`. Ningún archivo de `Pages/`, `Components/`, `Data/` ni `Base_Datos_StyleB/` aparece en el diff. No hubo desviación detectada contra el contrato del backend en TC-1 a TC-5, por lo que tampoco aplica la cláusula de corrección puntual prevista en el CA.
- **Estado:** cumplido

## Quality gates (evidencia)

```
# comando : resultado
cd Style-Busters-main && npm test
  → node ./node_modules/vitest/vitest.mjs run
  → Test Files  52 passed (52)
  → Tests       223 passed (223)
  → Duration    22.55s

Ejecución dirigida (reporter=verbose) sobre addressService.test.js:
cd Style-Busters-main && node ./node_modules/vitest/vitest.mjs run \
  src/Services/addressService.test.js --reporter=verbose
  → Test Files  1 passed (1)
  → Tests       7 passed (7)
  → los 7 casos listados individualmente como ✓, incluidos los 3 de getDefaultAddress

cd Style-Busters-main && npm run build
  → "The build folder is ready to be deployed."
  → sin errores; warnings de ESLint preexistentes no relacionados con addressService.js
    (archivo sin warnings propios)

e2e (npm run e2e:ci:headless) : no ejecutado en esta auditoría — cambio acotado a
  2 archivos de servicio sin consumidor real (CA-9: ningún componente/página importa
  addressService.js todavía), sin superficie de UI que un E2E pueda ejercitar.

lint : no hay script de lint dedicado en Style-Busters-main/package.json más allá
  del que corre implícitamente dentro de npm run build (react-scripts build,
  vía ESLint integrado de CRA) — ya cubierto arriba.
```

## Veredicto

| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | cumplido |
| CA-2 | TC-2 | cumplido |
| CA-3 | TC-3 | cumplido |
| CA-4 | TC-4 | cumplido |
| CA-5 | TC-5 | cumplido |
| CA-6 | TC-6 | cumplido (por inspección, sin test dedicado — previsto así por el propio CA) |
| CA-7 | TC-7 | cumplido |
| CA-8 | TC-8 | cumplido |
| CA-9 | TC-9 | cumplido |

**Resumen:** los 9 CA (CA-1 a CA-9) cumplidos sin reservas. `npm test` en verde (52 archivos, 223 tests, 0 fallos), incluidos los 7 casos de `addressService.test.js` con los 3 escenarios de `getDefaultAddress` (marcada como default, sin default con fallback a la primera, lista vacía → `null`) verificados individualmente. `npm run build` exitoso, sin errores ni warnings nuevos atribuibles a `addressService.js`. El diff entre `develop` y esta rama toca exactamente 2 archivos de código (`addressService.js`, `addressService.test.js`) más el spec, sin tocar ningún componente, página, el mock de `shippingService.js`/`Data/shipping-address.json`, ni ningún archivo de `Base_Datos_StyleB/` — confirma CA-9. Ambos archivos están trackeados en el commit `1adf27b1` — confirma CA-8. Gate G3: **verde**.
