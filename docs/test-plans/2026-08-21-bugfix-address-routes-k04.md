# Plan de Prueba: bugfix-address-routes-k04

- **Spec:** `docs/specs/2026-08-21-bugfix-address-routes-k04.md`  ·  **Backlog ID:** `F3.1` (`K04`)
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** backend `Base_Datos_StyleB/`
- **Commit auditado:** `3e0216c2` (fix(address): corregir import ESM y montar addressRoutes bajo /api/addresses)
- **Diff base:** `git log` sobre `Base_Datos_StyleB/` en la rama `fix/address-routes-k04`; working tree sin cambios propios de este spec fuera de lo commiteado (los archivos sin trackear del frontend y `docs/known-issues.md` modificado son ajenos a este pendiente y no se tocan).

## Entorno de prueba
- Backend: Vitest 4 + supertest + `mongodb-memory-server` (BD en memoria, sin MongoDB local ni `.env`).
- Comandos: `cd Base_Datos_StyleB && npm run test:unit`, `npm run test:integration`, `npm test`.
- Archivos bajo prueba: `src/controllers/addressController.js`, `src/routes/addressRoutes.js`, `src/routes/index.js`, `tests/helpers/factories.js`, `tests/integration/address.test.js`, `tests/unit/controllers/addressController.test.js`.
- No hay script de `lint`/`format` declarado en `Base_Datos_StyleB/package.json` (confirmado por lectura) — no aplica a este gate.

## Casos de prueba

### TC-1 — Import corregido con extensión `.js` [CA-1]
- **Precondición:** commit `3e0216c2` aplicado.
- **Pasos:**
  1. Inspección de `src/controllers/addressController.js` línea 1.
  2. `node -e "import('./src/controllers/addressController.js').then(()=>console.log('OK')).catch(e=>console.error('ERR', e.code))"` para forzar resolución ESM estricta sin pasar por Vitest.
  3. `npm start` (arranque real del servidor con `node server.js`) para confirmar que la cadena completa `server.js → routes/index.js → addressRoutes.js → addressController.js → models/Address.js` resuelve sin error.
- **Resultado esperado:** línea 1 = `import Address from "../models/Address.js";`; el `import()` dinámico resuelve `OK`; `npm start` no lanza `ERR_MODULE_NOT_FOUND`.
- **Resultado real:** confirmado — línea 1 correcta; `node -e "import(...)"` imprime `OK`; se verificó además el caso contrario (ver TC-7, revertido y restaurado sin dejar diff).
- **Estado:** ✅ cumplido

### TC-2 — `GET /api/addresses` y `GET /api/addresses/:addressId` con `authMiddleware` (sin `isAdmin`) [CA-2]
- **Precondición:** ninguna.
- **Pasos:** inspección de `src/routes/addressRoutes.js` líneas 45-53 (`authMiddleware` sin `isAdmin` en ambas rutas, `addressIdValidation = [param("addressId").isMongoId()...]`); ejecución de `IT-ADDR-02` (401 sin token) y de un caso ad hoc con `addressId` no-ObjectId.
- **Resultado esperado:** sin token → `401`; con token válido y `addressId` no-ObjectId → `422`.
- **Resultado real:**
  - Código confirmado línea por línea contra la descripción del CA.
  - `tests/integration/address.test.js` → `IT-ADDR-02 — 401 sin token` → PASA.
  - Verificado con test temporal de evidencia (`__qa_tmp_address_evidence.test.js`, creado y ejecutado solo para esta auditoría, luego eliminado — no forma parte del repo): `GET /api/addresses/:id` sin token → `401` (cubre además las otras 4 rutas, ver TC-8).
- **Estado:** ✅ cumplido

### TC-3 — `POST /api/addresses` valida el body y liga a `req.user.userId`, ignorando `user` del body [CA-3]
- **Precondición:** usuario autenticado.
- **Pasos:** `IT-ADDR-05` (body válido → 201, `user` = token), `IT-ADDR-06` (body con `user` de otro usuario → 201, `user` real = token), `IT-ADDR-07` (faltan campos requeridos → 422).
- **Resultado esperado:** falta alguno de los 6 campos requeridos → `422`; body válido → `201` con `res.body.user === req.user.userId`, incluso si el body trae un `user` distinto.
- **Resultado real:** `tests/integration/address.test.js` → `IT-ADDR-05`, `IT-ADDR-06`, `IT-ADDR-07` → PASAN. Código confirmado: el controller usa `const user = req.user.userId;` (línea 47) y nunca lee `req.body.user`.
- **Estado:** ✅ cumplido

### TC-4 — `PUT /api/addresses/:addressId` valida `addressId` + body y solo permite editar direcciones propias [CA-4]
- **Precondición:** direcciones de dos usuarios distintos.
- **Pasos:** `IT-ADDR-09` (dueño → 200, campos actualizados), `IT-ADDR-10` (dirección de otro usuario → 404).
- **Resultado esperado:** `addressId` de otro usuario → `404` (filtrado por `Address.findOne({ _id: addressId, user })`); `addressId` propio con body válido → `200` con campos actualizados.
- **Resultado real:** `tests/integration/address.test.js` → `IT-ADDR-09`, `IT-ADDR-10` → PASAN. Código confirmado: `updateAddressValidation = [...addressIdValidation, ...addressBodyValidation]`.
- **Estado:** ✅ cumplido

### TC-5 — `DELETE /api/addresses/:addressId` solo permite borrar direcciones propias [CA-5]
- **Precondición:** direcciones de dos usuarios distintos.
- **Pasos:** `IT-ADDR-11` (dueño → 200, se borra), `IT-ADDR-12` (dirección de otro usuario → 404, no se borra), `IT-ADDR-13` (inexistente → 404).
- **Resultado esperado:** `addressId` de otro usuario → `404`, el documento sigue existiendo; `addressId` propio → `200` y el documento deja de existir.
- **Resultado real:** `tests/integration/address.test.js` → `IT-ADDR-11`, `IT-ADDR-12`, `IT-ADDR-13` → PASAN (`IT-ADDR-12` confirma explícitamente `await Address.findById(address._id)` no nulo tras el intento cruzado).
- **Estado:** ✅ cumplido

### TC-6 — Las 5 rutas montadas bajo `/api/addresses` en `routes/index.js` [CA-6]
- **Precondición:** ninguna.
- **Pasos:** inspección de `src/routes/index.js` (líneas 2 y 14: `import addressRoutes from "./addressRoutes.js";` y `router.use(addressRoutes);`); ejecución de las 13 pruebas de `address.test.js` contra rutas reales servidas por `app` (importado desde `server.js`), ninguna cae en el 404 catch-all.
- **Resultado esperado:** ambas líneas presentes; ninguna petición a `/api/addresses*` responde con el 404 genérico `{ error, method, url }` de `server.js`.
- **Resultado real:** confirmado por lectura de `routes/index.js`; las 13 pruebas de `address.test.js` reciben `200`/`201`/`401`/`404 { message: "Address not found" }`/`422` — nunca el 404 catch-all (que tendría forma `{ error, method, url }`, no `{ message: ... }`).
- **Estado:** ✅ cumplido

### TC-7 — Test de regresión: revertir el import rompe la resolución de módulos [CA-7]
- **Precondición:** commit `3e0216c2` aplicado (import correcto).
- **Pasos:**
  1. `npm run test:integration` con el import correcto → verde.
  2. Revertir manualmente (sin commitear) la línea 1 de `addressController.js` a `import Address from "../models/Address";` (sin extensión).
  3. Repetir `npm run test:integration`.
  4. `node -e "import('./src/controllers/addressController.js')..."` con el import roto.
  5. `npm start` (arranque real vía `node server.js`) con el import roto.
  6. Restaurar la línea 1 a `import Address from "../models/Address.js";` y confirmar `git diff` vacío.
- **Resultado esperado (según el spec):** revirtiendo la extensión, `npm run test:integration` falla al arrancar (fase de colección, ESM estricto).
- **Resultado real — DISCREPANCIA CON EL SPEC:**
  - Paso 3 (`npm run test:integration` con el import roto): **la suite sigue en verde** (`Test Files 12 passed (12)`, `Tests 197 passed | 14 expected fail (211)`, idéntico al resultado con el fix aplicado). Vitest/Vite no aplica resolución ESM estricta de Node: su resolvedor tolera especificadores de import sin extensión (mismo comportamiento de tolerancia que el propio spec documenta para `vi.mock` en la sección "Contexto", pero que en este entorno también aplica a imports normales, no solo a mocks). Por lo tanto, **`npm run test:integration` NO reproduce el bug de import** ni antes ni después del fix — no sirve como regresión efectiva para este defecto concreto.
  - Paso 4 (`node -e "import(...)"` directo, resolución ESM nativa de Node, sin Vitest): sí falla — `ERR_MODULE_NOT_FOUND: Cannot find module '...src\models\Address' imported from '...addressController.js'`.
  - Paso 5 (`npm start`, arranque real del servidor): sí falla, con el mismo `ERR_MODULE_NOT_FOUND`, traza completa capturada.
  - Paso 6: archivo restaurado; `git diff` / `git status --short` sobre `Base_Datos_StyleB/` sin salida (sin residuos).
- **Estado:** ⚠️ **parcialmente cumplido, con hallazgo a reportar.** El bug de import SÍ se reproduce y SÍ queda corregido, verificado bajo resolución ESM real de Node (`node -e` y `npm start`). Pero la afirmación literal del CA-7 ("revirtiendo la extensión, la suite de integración falla al arrancar" bajo `npm run test:integration`) es **falsa en este repo**: Vitest no usa la resolución estricta de Node para imports de código de producción, por lo que el propio `npm run test:integration` no habría detectado una regresión futura de este tipo. La protección real contra la reintroducción del bug es el arranque de producción (`npm start` / `node server.js`), no la suite de tests. Esto no bloquea el cierre del fix en sí (el fix es correcto y verificado), pero sí invalida la redacción exacta de CA-7 como mecanismo de regresión automatizado.

### TC-8 — Comportamiento self-service cubierto en `npm run test:integration` [CA-8]
- **Precondición:** ninguna.
- **Pasos:**
  1. (a) 401 sin token en las 5 rutas: `IT-ADDR-02` cubre `GET /api/addresses` en el repo; para las otras 4 rutas se verificó con test temporal de evidencia (`__qa_tmp_address_evidence.test.js`, creado y ejecutado solo para esta auditoría, luego eliminado).
  2. (b) 404 en lectura/edición/borrado cruzado entre usuarios: `IT-ADDR-04`, `IT-ADDR-10`, `IT-ADDR-12` (ya en el repo).
  3. (c) `POST` ignora `user` del body: `IT-ADDR-06` (ya en el repo).
  4. (d) `isDefault: true` desmarca las demás direcciones, tanto en `POST` como en `PUT`: `IT-ADDR-08` cubre `POST` (ya en el repo); para `PUT` se verificó con el mismo test temporal de evidencia (no existe test permanente de esto en `tests/integration/`, solo hay cobertura unitaria mockeada en `tests/unit/controllers/addressController.test.js` → `"updateAddress -> desmarca las demás al promover a predeterminada"`).
- **Resultado esperado:** los 4 puntos (a)-(d) pasan en verde bajo `npm run test:integration`.
- **Resultado real:**
  - (b) y (c): cumplidos con tests permanentes ya en el repo.
  - (a): cumplido solo parcialmente con tests permanentes — `IT-ADDR-02` cubre únicamente `GET /api/addresses`; las otras 4 rutas (`GET /:addressId`, `POST`, `PUT`, `DELETE`) no tienen una aserción `401` dedicada en `address.test.js`. Se verificó empíricamente con el test temporal (5/5 rutas → 401), pero **no queda como test permanente** en el repo.
  - (d) para `PUT`: cumplido solo empíricamente con el test temporal (integración real, BD en memoria); **no hay test permanente de integración** que cubra el desmarcado de `isDefault` en `PUT` — solo existe la versión unitaria mockeada.
- **Estado:** ⚠️ **cumplido empíricamente, con brecha de cobertura permanente.** El comportamiento descrito por CA-8 es correcto y se verificó en las 6 aserciones adicionales ejecutadas ad hoc, pero (a) para 4 de las 5 rutas y (d) para `PUT` no quedan como tests permanentes bajo `npm run test:integration` en el estado actual del repo — quedan solo como evidencia de esta auditoría, no como regresión futura automatizada.

### TC-9 — `tests/helpers/factories.js` agrega `createAddress` [CA-9]
- **Precondición:** ninguna.
- **Pasos:** inspección de `tests/helpers/factories.js` líneas 92-105 (`export async function createAddress({ user, ...rest } = {})`, mismo patrón que `createPaymentMethod`/`createOrder`); ejecución de `tests/integration/address.test.js`, que importa `createAddress` desde `../helpers/factories.js`.
- **Resultado esperado:** el factory existe, sigue el patrón (`createUser()` si no se pasa `user`, valores válidos por defecto, `overrides`); `address.test.js` no falla por `TypeError: createAddress is not a function`.
- **Resultado real:** código confirmado; las 13 pruebas de `address.test.js` usan `createAddress` sin error de tipo — PASAN.
- **Estado:** ✅ cumplido

## Quality gates (evidencia)

```
# comando : resultado
cd Base_Datos_StyleB && npm run test:integration
  → node ./node_modules/vitest/vitest.mjs run tests/integration
  → Test Files  12 passed (12)
  → Tests       197 passed | 14 expected fail (211)
  → Duration    9.86s

cd Base_Datos_StyleB && npm run test:unit
  → node ./node_modules/vitest/vitest.mjs run tests/unit
  → Test Files  17 passed (17)
  → Tests       106 passed | 3 expected fail (109)
  → Duration    3.58s

cd Base_Datos_StyleB && npm test  (ejecución consolidada final, tras restaurar el
  import y eliminar el test temporal de evidencia)
  → Test Files  29 passed (29)
  → Tests       303 passed | 17 expected fail (320)
  → Duration    11.42s

Ejecución dirigida (reporter=verbose) sobre los 3 archivos de direcciones:
cd Base_Datos_StyleB && node ./node_modules/vitest/vitest.mjs run \
  tests/integration/address.test.js tests/unit/controllers/addressController.test.js \
  tests/unit/models/Address.test.js --reporter=verbose
  → Test Files  3 passed (3)
  → Tests       27 passed | 1 expected fail (28)
  → los 13 IT-ADDR-01..13 listados individualmente como ✓

Reproducción de CA-7 (import roto), fuera de la suite de Vitest:
node -e "import('./src/controllers/addressController.js')..."  (con `.js` en línea 1)
  → OK
node -e "import('./src/controllers/addressController.js')..."  (revertido, sin `.js`)
  → ERR ERR_MODULE_NOT_FOUND
npm run test:integration  (revertido, sin `.js`)
  → SIGUE EN VERDE — Test Files 12 passed (12) / Tests 197 passed | 14 expected fail (211)
    (idéntico al resultado con el fix; ver TC-7 — Vitest no reproduce este bug)
npm start  (revertido, sin `.js`, arranque real con node server.js)
  → Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...src\models\Address'
    imported from '...addressController.js'
Restauración: línea 1 devuelta a `import Address from "../models/Address.js";`;
  git status --short Base_Datos_StyleB/  → sin salida (sin residuos)

Evidencia adicional (test temporal, creado y eliminado solo para esta auditoría,
no forma parte del repo ni de ningún diff, sin residuos tras `git status --short`):
  6/6 casos ✓ — 5× 401 sin token (las 5 rutas) + 1× PUT con isDefault:true
  desmarca la otra dirección default del mismo usuario — ver TC-2, TC-8.

lint/format : no hay scripts declarados en Base_Datos_StyleB/package.json
              ("start", "dev", "seed", "e2e:server", "test", "test:watch",
              "test:unit", "test:integration", "test:coverage" — ninguno de
              lint/format) — no aplica a este gate.
type-check  : N/A (backend sin TypeScript).
build       : N/A (backend Node/Express, sin paso de build).
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
| CA-7 | TC-7 | ⚠️ parcial — el fix está verificado (rompe/arregla bajo resolución ESM real de Node), pero la afirmación de que `npm run test:integration` detecta la regresión es falsa: Vitest tolera imports sin extensión y la suite queda en verde incluso con el bug reintroducido. |
| CA-8 | TC-8 | ⚠️ parcial — comportamiento correcto verificado empíricamente en los 4 puntos (a)-(d), pero (a) para 4/5 rutas y (d) para `PUT` no tienen test permanente en `tests/integration/`, solo evidencia ad hoc de esta auditoría. |
| CA-9 | TC-9 | ✅ cumplido |

**Resumen:** CA-1 a CA-6 y CA-9 cumplidos sin reservas, con evidencia de `npm run test:integration` (197 passed, 14 expected-fail preexistentes sin relación con este spec) y `npm run test:unit` (106 passed, 3 expected-fail preexistentes) en verde, más `npm test` consolidado final (303 passed, 17 expected-fail). CA-7 y CA-8 se cumplen en cuanto al comportamiento real del sistema (verificado con evidencia directa: `node -e`, `npm start`, y un test temporal eliminado tras esta auditoría), pero ambos tienen una brecha entre lo que el texto del spec afirma que la suite automatizada detecta y lo que realmente detecta hoy `npm run test:integration`:
- CA-7: la regresión de import solo es detectable arrancando el servidor real (`npm start`/`node server.js`), no por `npm run test:integration` (Vitest no aplica resolución ESM estricta a imports de producción).
- CA-8: 4 de las 5 rutas no tienen un test `401` dedicado, y el desmarcado de `isDefault` en `PUT` solo está cubierto por un test unitario mockeado, no por un test de integración con BD real.

Ninguna de las dos brechas es un defecto funcional del fix (el comportamiento correcto existe y se verificó), pero sí son gaps de cobertura de regresión permanente que el orquestador debe evaluar antes de cerrar el spec como 100% verificado — no se puede afirmar sin matices que "`npm run test:integration` detecta si el import se rompe de nuevo" ni que "las 5 rutas tienen 401 cubierto en la suite permanente". Gate G3: **verde para CA-1 a CA-6 y CA-9**; **CA-7 y CA-8 requieren decisión del orquestador** (aceptar la brecha de cobertura documentada, o despachar de vuelta a backend-builder/qa-test-designer para añadir los tests permanentes faltantes: 401 dedicado en las 4 rutas restantes de `address.test.js`, y un `IT-ADDR` de `PUT` con `isDefault` en BD real).
