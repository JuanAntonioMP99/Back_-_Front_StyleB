# Plan de Prueba: security-patch-products-auth-validation

- **Spec:** `docs/specs/2026-08-21-security-patch-products-auth-validation.md`  ·  **Backlog ID:** `SEC-PRODUCTS-AUTH-VALIDATION-2026-08-21` (formaliza `F3.5`/`K08` y `BE-VALIDATE-IMAGEURL-2026-08-21`)
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** backend `Base_Datos_StyleB/`
- **Commits auditados:** `c57612d8` (fix: auth+admin en escritura + validación `imageURL`), `f52fc604` (test: actualizar tests de auth+admin y validación de `imageURL`)
- **Diff base:** `git diff develop..HEAD` (working tree con cambios sin commitear ajenos a este spec — ignorados; solo se auditó el diff `develop..HEAD`)

## Entorno de prueba
- Backend: Vitest 4 + supertest + `mongodb-memory-server` (BD en memoria, sin MongoDB local ni `.env`).
- Comando: `cd Base_Datos_StyleB && npm test` (invoca `tests/integration/*.test.js` y `tests/unit/**`).
- Archivos bajo prueba: `src/routes/productRoutes.js`, `tests/integration/products.test.js`, `tests/integration/security.test.js`, `tests/integration/authorization.test.js`.

## Casos de prueba

### TC-1 — Imports de `authMiddleware`/`isAdmin` en `productRoutes.js` [CA-1]
- **Precondición:** commit `c57612d8` aplicado.
- **Pasos:** inspección de `Base_Datos_StyleB/src/routes/productRoutes.js` líneas 12-13 (diff `develop..HEAD`).
- **Dato de entrada:** N/A (revisión estática).
- **Resultado esperado:** `import authMiddleware from "../middlewares/authMiddleware.js";` e `import isAdmin from "../middlewares/isAdminMiddleware.js";` presentes, mismo patrón que `categoryRoutes.js`.
- **Resultado real:** confirmado en el diff — ambos imports agregados tal cual.
- **Estado:** ✅ cumplido

### TC-2 — `POST /api/products` exige auth+admin [CA-2]
- **Precondición:** BD en memoria vacía.
- **Pasos:**
  1. `POST /api/products` sin token, payload válido.
  2. `POST /api/products` con token de `customer` (`authHeader`).
  3. `POST /api/products` con token de `admin`, payload válido.
- **Dato de entrada:** `{ name, description, price, stock, category }` válido; sin token / token customer / token admin.
- **Resultado esperado:** 1) `401`; 2) `403 { message: "Admin access required" }`; 3) `201` sin cambio de comportamiento.
- **Resultado real:**
  - `tests/integration/security.test.js` → `"🔒 K08 — POST /api/products sin token debería responder 401"` → PASA (401).
  - `tests/integration/security.test.js` → `"🔒 K08 — un customer autenticado no debería poder crear productos"` → PASA (403).
  - `tests/integration/products.test.js` → `IT-PROD-05` (con `authHeader(admin)`) → PASA (201, `{ name: "Jeans", price: 49.9 }`, categoría poblada).
  - `tests/integration/authorization.test.js` → `it.each(ADMIN_ONLY)` para `["POST", "/api/products"]` → 3 casos (401 sin token, 403 customer, no-401/403 admin) → PASAN.
- **Estado:** ✅ cumplido

### TC-3 — `PUT /api/products/:id` exige auth+admin [CA-3]
- **Precondición:** producto existente en BD.
- **Pasos:** análogos a TC-2 sobre `PUT /api/products/:id`.
- **Resultado esperado:** `401` sin token, `403` con customer, `200` con admin (sin cambio de aserciones de negocio).
- **Resultado real:**
  - `security.test.js` → `"🔒 K08 — PUT /api/products/:id sin token debería responder 401"` → PASA.
  - `authorization.test.js` → `it.each` para `["PUT", "/api/products/:id"]` (3 casos) → PASAN.
  - `products.test.js` → `IT-PROD-08` (con `authHeader(admin)`) → PASA (`200`, campos actualizados).
  - No hay test dedicado con token `customer` sobre `PUT` en `security.test.js` (solo `POST` está cubierto ahí), pero `authorization.test.js` sí cubre `PUT /api/products/:id` con customer → `403` vía `it.each`.
- **Estado:** ✅ cumplido

### TC-4 — `DELETE /api/products/:id` exige auth+admin [CA-4]
- **Precondición:** producto existente en BD.
- **Pasos:** análogos a TC-2/TC-3 sobre `DELETE /api/products/:id`.
- **Resultado esperado:** `401` sin token, `403` con customer, `204` sin body con admin.
- **Resultado real:**
  - `security.test.js` → `"🔒 K08 — DELETE /api/products/:id sin token debería responder 401"` → PASA.
  - `authorization.test.js` → `it.each` para `["DELETE", "/api/products/:id"]` (3 casos) → PASAN.
  - `products.test.js` → `IT-PROD-09` (con `authHeader(admin)`) → PASA (`204`, `res.body === {}`).
- **Estado:** ✅ cumplido

### TC-5 — Rutas de lectura de `/products` sin cambios [CA-5]
- **Precondición:** ninguna.
- **Pasos:** revisión de `git diff develop..HEAD -- Base_Datos_StyleB/src/routes/productRoutes.js` (líneas de `GET /products/search`, `GET /products`, `GET /products/:id`) + ejecución de `describe("GET /api/products")`, `describe("GET /api/products/:id")`, `describe("GET /api/products/search")`.
- **Resultado esperado:** el diff no toca esas 3 líneas; los tests de lectura pasan sin modificación (no reciben `.set(authHeader(...))`).
- **Resultado real:** confirmado en el diff (las 3 líneas de `GET` quedan idénticas, solo se reindenta el bloque `POST/PUT/DELETE`). `IT-PROD-01` a `IT-PROD-04` y `IT-SRCH-01` a `IT-SRCH-08` pasan sin tocar, sin token.
- **Estado:** ✅ cumplido

### TC-6 — `imageURL` inválido en `createProductValidation` [CA-6]
- **Precondición:** token de admin.
- **Pasos:** `POST /api/products` con `imageURL: "no-es-una-url"`, `name`, `price`.
- **Dato de entrada:** `{ name: "imageURL inválido", price: 25, imageURL: "no-es-una-url" }`.
- **Resultado esperado:** `422` con `res.body.errors` que contiene un objeto con `path: "imageURL"`.
- **Resultado real:** `products.test.js` → `"CA-6: imageURL no-URL → 422 con path imageURL"` → PASA.
- **Estado:** ✅ cumplido

### TC-7 — `imageURL` inválido en `updateProductValidation` [CA-7]
- **Precondición:** producto existente, token de admin.
- **Pasos:** `PUT /api/products/:id` con `imageURL: "no-es-una-url"`.
- **Resultado esperado:** `422` con `path: "imageURL"` en `res.body.errors`.
- **Resultado real:** `products.test.js` → `"CA-7: imageURL no-URL → 422 con path imageURL"` → PASA.
- **Estado:** ✅ cumplido

### TC-8 — Los 15 tests de escritura de `products.test.js` con token de admin, todos en verde [CA-8]
- **Precondición:** commit `f52fc604` aplicado (import de `createAdmin, authHeader`).
- **Pasos:** ejecución completa de `describe("POST /api/products")` (8 + 1 nuevo de `imageURL`), `describe("PUT /api/products/:id")` (5 + 1 nuevo), `describe("DELETE /api/products/:id")` (2).
- **Resultado esperado:** las 15 aserciones de negocio originales no cambian (solo se agrega `.set(authHeader(admin))`); todas pasan.
- **Resultado real:** confirmado por diff línea a línea (`IT-PROD-05,06,07,10,11,12,13,14` en POST; `IT-PROD-08`, `"id inexistente → 404"`, `"stock negativo → 422"`, `IT-PROD-15,16` en PUT; `IT-PROD-09`, `"id inexistente → 404"` en DELETE — 15 tests) y por ejecución real (`npm test`, ver sección "Quality gates"): todos en verde, ninguna aserción de status/body modificada respecto al `develop` original salvo la adición del header de auth.
- **Estado:** ✅ cumplido

### TC-9 — `security.test.js`: "comportamiento actual" invierte a 401 [CA-9]
- **Precondición:** ninguna.
- **Pasos:** `POST /api/products` sin token (test `"cualquiera puede crear un producto sin token (comportamiento actual)"`).
- **Resultado esperado:** `401` (antes `201`).
- **Resultado real:** PASA — el test fue reescrito (`expect(res.status).toBe(401)`), comentario actualizado ("K08 corregido").
- **Estado:** ✅ cumplido

### TC-10 — Los 4 `it.fails` de K08 pasan a `it` normal y quedan en verde [CA-10]
- **Precondición:** ninguna.
- **Pasos:**
  1. Confirmar por diff que las 4 ocurrencias de `it.fails("🔒 K08 ...")` (POST sin token, PUT sin token, DELETE sin token, customer→403 en POST) perdieron el `.fails` y quedaron como `it(...)`.
  2. Ejecutar `npm test` y confirmar que ninguno de los 4 aparece en la lista `expected fail`.
  3. Grep de `it.fails` en todo `tests/` para confirmar que no queda ningún `it.fails` con prefijo `K08` en el repo.
- **Resultado esperado:** los 4 pasan como test normal (verde); Vitest no reporta ningún `it.fails` que pase inesperadamente (lo cual haría fallar la corrida, ya que un `it.fails` que pasa se reporta como fallo).
- **Resultado real:**
  - Diff confirma la eliminación de `.fails` en los 4 tests (líneas originales 72, 78, 84, 93 de `security.test.js`).
  - `npm test` final: `Test Files 29 passed (29)` / `Tests 309 passed | 15 expected fail (324)` — **cero fallos**, lo que implica que ningún `it.fails` restante pasó inesperadamente (si alguno de los 4 aún tuviera `.fails` y pasara, o si un `it.fails` ajeno pasara, Vitest reportaría un test fallido, no "expected fail").
  - `grep -c "it.fails" tests/**` → 15 ocurrencias totales en 10 archivos, **ninguna con prefijo `K08`** (confirmado por lectura: la única `it.fails` restante en `security.test.js` es `"🔒 K01 — sin ADMIN_SECRET..."`, fuera del alcance de este spec). Reporter verboso confirma explícitamente que las 4 pruebas K08 corren como `it` normal y aparecen con `✓` (no como `expected fail`).
- **Estado:** ✅ cumplido

### TC-11 — `authorization.test.js`: `ADMIN_ONLY` incluye las 3 rutas de `/products` [CA-11]
- **Precondición:** ninguna.
- **Pasos:** revisar el array `ADMIN_ONLY` (líneas 22-24) y ejecutar los 3 `it.each` de `describe("Autorización — rutas que exigen auth + admin")` para `["POST", "/api/products"]`, `["PUT", "/api/products/:id"]`, `["DELETE", "/api/products/:id"]`.
- **Resultado esperado:** 401 sin token, 403 con customer (`{ message: "Admin access required" }`), sin 401/403 con admin — para las 3 rutas nuevas, sin escribir tests nuevos a mano.
- **Resultado real:** confirmado por diff (3 líneas agregadas al array) y por ejecución (`reporter=verbose`): 9 tests generados automáticamente (`POST /api/products responde 401 sin token`, `... responde 403 con token de customer`, `... NO responde 401/403 con token de admin`, y análogos para `PUT`/`DELETE /api/products/:id`) — todos `✓`.
- **Estado:** ✅ cumplido

### TC-12 — Casos `422` de `imageURL` no-URL en integración real [CA-12]
- **Precondición:** token de admin.
- **Pasos:** ver TC-6 (POST) y TC-7 (PUT).
- **Resultado esperado:** mínimo 2 tests nuevos, uno por verbo, ambos con `422` y `path: "imageURL"`.
- **Resultado real:** exactamente 2 tests nuevos agregados (uno en `describe("POST /api/products")`, otro en `describe("PUT /api/products/:id")`), ambos verdes.
- **Estado:** ✅ cumplido

### TC-13 — Documentación de cierre (`K08`, `F3.5`, `BE-VALIDATE-IMAGEURL-2026-08-21`) [CA-13]
- **Precondición:** N/A — CA de cierre, no de implementación.
- **Pasos:** verificar si `docs/known-issues.md` (`K08`) y `docs/backlog.md` (`F3.5`, `BE-VALIDATE-IMAGEURL-2026-08-21`) ya están marcados como `RESUELTO`.
- **Resultado esperado (según spec):** el propio spec declara que este CA se ejecuta "como parte del cierre del spec (FASE 10 del SSDLC), no como paso intermedio de implementación" — no forma parte del diff de los 2 commits de implementación auditados.
- **Resultado real:** no evaluado como no-cumplido: está fuera del alcance de los commits `c57612d8`/`f52fc604` por diseño explícito del spec. No se auditó el estado de `docs/known-issues.md`/`docs/backlog.md` porque corresponde al paso de cierre del orquestador, posterior a este gate G3.
- **Estado:** ⏳ pendiente de cierre (no aplica veredicto ✅/❌ en esta fase — a verificar por el orquestador en FASE 10 antes de dar el spec por cerrado)

### TC-14 — Caso negativo adicional: 403 explícito con token de customer en las 3 rutas (no solo 401 sin token)
- **Precondición:** usuario `customer` autenticado (no admin).
- **Pasos:** `POST`/`PUT`/`DELETE /api/products(/:id)` con `authHeader(customer)`.
- **Resultado esperado:** `403` en las 3 rutas (no `401`), confirmando que `isAdmin` (no solo `authMiddleware`) está cableado.
- **Resultado real:** verificado con test temporal de evidencia (`__qa_tmp_products_auth_evidence.test.js`, creado y ejecutado solo para esta auditoría, luego eliminado — no forma parte del repo): las 3 llamadas (`POST`, `PUT`, `DELETE`) con token de `customer` devuelven `403`. Reforzado por `authorization.test.js` → `it.each(ADMIN_ONLY)` → `"%s %s responde 403 con token de customer"` para las 3 rutas nuevas (cobertura permanente ya en el repo, CA-11) y por `security.test.js` → `"🔒 K08 — un customer autenticado no debería poder crear productos"` (permanente, solo cubre `POST`).
- **Estado:** ✅ cumplido

### TC-15 — Caso negativo adicional: token con firma inválida / expirado → 401 en las 3 rutas de `/products`
- **Precondición:** ninguna (o usuario existente para firmar el token expirado).
- **Pasos:** `POST`/`PUT`/`DELETE /api/products(/:id)` con `Authorization: Bearer token.falsificado.aqui` (firma inválida) y con un token válidamente firmado pero expirado (`expiredTokenFor`, ya existente en `tests/helpers/factories.js`, sin uso previo en el repo).
- **Resultado esperado:** `401` en los 6 casos (3 rutas × 2 variantes de token inválido).
- **Resultado real:** el repo **no tenía** ningún test que ejercitara `/products` con token de firma inválida o expirado (la única cobertura existente de "calidad del rechazo" en `authorization.test.js` usa `/api/users`, no `/products` — mismo middleware compartido, pero sin ejercicio directo sobre esta ruta). Se verificó con el mismo test temporal de evidencia (TC-14): los 6 casos devuelven `401`. Al ser `authMiddleware` código 100% compartido y cableado de forma idéntica (mismo orden de middlewares que `categoryRoutes.js`, confirmado en TC-1/CA-2 a CA-4), el resultado es consistente con el resto del repo, pero **no queda como test permanente** — es una brecha de cobertura menor no exigida por ningún CA del spec (el spec solo pide 401 "sin token" y 403 "con customer", CA-2 a CA-4 y CA-9/CA-10).
- **Estado:** ✅ cumplido (verificado empíricamente), con nota: no hay test permanente en el repo para este caso específico sobre `/products`; no bloquea el gate porque no es un CA del spec, se deja como observación de cobertura.

## Quality gates (evidencia)

```
# comando : resultado
cd Base_Datos_StyleB && npm test
  → node ./node_modules/vitest/vitest.mjs run
  → Test Files  29 passed (29)
  → Tests       309 passed | 15 expected fail (324)
  → Duration    16.38s
  → (15 "expected fail" = it.fails preexistentes fuera del alcance de este spec,
     p. ej. K01 en security.test.js y otros en cart/orders/errorHandling/users/
     wishlist/paymentMethods/modelos unit — ninguno con prefijo K08)

Ejecución dirigida (reporter=verbose) sobre los 3 archivos tocados por el spec:
cd Base_Datos_StyleB && node ./node_modules/vitest/vitest.mjs run \
  tests/integration/products.test.js tests/integration/security.test.js \
  tests/integration/authorization.test.js --reporter=verbose
  → todos los tests listados como ✓, incluyendo:
    - security.test.js > 🔒 K08 — POST/PUT/DELETE sin token → 401 (✓ x3)
    - security.test.js > 🔒 K08 — un customer autenticado no debería poder crear productos (✓)
    - security.test.js > cualquiera puede crear un producto sin token (comportamiento actual) (✓, ahora 401)
    - products.test.js > IT-PROD-05..16 + 2 tests nuevos de imageURL (✓ x17)
    - authorization.test.js > it.each(ADMIN_ONLY) para POST/PUT/DELETE /api/products (✓ x9)

Evidencia adicional (test temporal, creado y eliminado solo para esta auditoría,
no forma parte del repo ni del diff): 9/9 casos ✓ — ver TC-14/TC-15.

type-check : N/A (proyecto no usa TypeScript en Base_Datos_StyleB)
lint       : no ejecutado (fuera del alcance explícito de este gate; no hay
             script de lint declarado en package.json para verificar)
build      : N/A (backend Node/Express, sin paso de build)
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
| CA-7 | TC-7 | ✅ cumplido |
| CA-8 | TC-8 | ✅ cumplido |
| CA-9 | TC-9 | ✅ cumplido |
| CA-10 | TC-10 | ✅ cumplido |
| CA-11 | TC-11 | ✅ cumplido |
| CA-12 | TC-12 | ✅ cumplido |
| CA-13 | TC-13 | ⏳ pendiente de cierre (fuera de alcance de los commits de implementación auditados, por diseño del spec — FASE 10) |
| — | TC-14 (403 explícito con customer, 3 rutas) | ✅ cumplido |
| — | TC-15 (401 con firma inválida/expirada, 3 rutas) | ✅ cumplido (sin test permanente en el repo, ver nota) |

**Resumen:** CA-1 a CA-12 cumplidos, con evidencia de `npm test` en verde (309 passed, 0 failed, 15 expected-fail preexistentes sin relación con K08) y verificación dirigida de los 3 archivos de test tocados por el spec. CA-13 no aplica veredicto en este gate — es explícitamente un paso de cierre posterior (FASE 10), no de implementación; no bloquea G3. Caso negativo adicional solicitado (403 con customer, 401 con firma inválida/expirada en las 3 rutas nuevas) verificado empíricamente en las 3 rutas, cumplido. Gate G3: **verde** para CA-1 a CA-12; CA-13 queda explícitamente marcado como pendiente de cierre para que el orquestador lo verifique antes de dar el spec por cerrado.
