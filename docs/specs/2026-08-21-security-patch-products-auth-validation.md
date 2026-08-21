# Spec: Autenticación de escritura en `/products` + validación de `imageURL`

## Metadata
- **Tipo:** security-patch
- **Complejidad:** M
- **Fecha:** 2026-08-21
- **Estado:** DRAFT
- **ID de backlog:** SEC-PRODUCTS-AUTH-VALIDATION-2026-08-21
- **Ejecutor:** subagente backend-builder

## Historia

Como backend de `Base_Datos_StyleB`, quiero que `POST /api/products`, `PUT /api/products/:id` y `DELETE /api/products/:id` exijan `authMiddleware` + `isAdminMiddleware` (mismo patrón ya cableado en `categoryRoutes.js`), y que `imageURL` reciba la misma validación de formato de URL que ya tiene `images`, para cerrar dos hallazgos de seguridad ya analizados y decididos por el security-reviewer: `F3.5` (`docs/backlog.md`, E3, deuda "Alto" — escritura de catálogo sin auth, `K08` en `docs/known-issues.md`) y `BE-VALIDATE-IMAGEURL-2026-08-21` (`docs/backlog.md`, E3 — asimetría de validación entre `imageURL` e `images`, derivado del spec [`2026-08-21-feature-product-image-gallery-backend`](2026-08-21-feature-product-image-gallery-backend.md), PR #16).

Este spec **no reabre ni reinterpreta** las decisiones técnicas ya tomadas por el security-reviewer (combinar ambos hallazgos en un solo pendiente por tocar el mismo archivo/endpoint con bajo riesgo de solapamiento); las formaliza en criterios de aceptación verificables.

- **Específica:** agregar `authMiddleware, isAdmin` a las 3 rutas de escritura de `/products` en `productRoutes.js` (con sus imports, hoy ausentes), agregar `body("imageURL").optional().isURL()` a `createProductValidation`/`updateProductValidation`, y actualizar los 3 archivos de test que hoy asumen ausencia de auth (`products.test.js`, `security.test.js`, `authorization.test.js`), sin tocar ningún otro modelo, ruta, controller o componente de frontend.
- **Medible:** CA-1 a CA-13, verificables por inspección de código y por `npm test` (`Base_Datos_StyleB`), en particular `tests/integration/products.test.js`, `tests/integration/security.test.js` y `tests/integration/authorization.test.js`.
- **Alcanzable:** 4 archivos de código/test ya existentes (`src/routes/productRoutes.js`, `tests/integration/products.test.js`, `tests/integration/security.test.js`, `tests/integration/authorization.test.js`), reutilizando exactamente el patrón de `categoryRoutes.js` (auth) y de `IT-PROD-12`/`IT-PROD-13` sobre `images` (validación de URL). Sin librerías nuevas.
- **Relevante:** cierra una vulnerabilidad de escritura sin autenticación en el catálogo de productos (cualquiera puede crear/editar/borrar productos hoy, verificado en `productRoutes.js` líneas 66-68) y una asimetría de validación de input ya trackeada como deuda técnica.
- **Temporal:** complejidad **M** — 4 archivos a tocar (1 de rutas, 3 de test), de los cuales `products.test.js` requiere actualizar 15 tests existentes y `security.test.js` requiere invertir la expectativa de 5 tests (incluyendo 4 `it.fails` que pasan a verdes), más los ajustes de documentación al cierre (`docs/known-issues.md`, `docs/backlog.md`). No es S porque el volumen de tests a tocar y el cambio de comportamiento observable de la API (401 donde hoy hay 200/201/204) exceden un ajuste trivial de una sola función; no es L porque no hay cambios de modelo, de arquitectura ni de contrato de datos (solo de autorización y de una regla de validación ya usada en el propio archivo).

## Contexto

`Base_Datos_StyleB/src/routes/productRoutes.js` es, hoy, el único router de escritura del catálogo sin `authMiddleware`/`isAdminMiddleware`: verificado línea por línea, importa solo `express`, `body`/`param` de `express-validator`, los controllers y `validate` — no importa `authMiddleware` ni `isAdmin` (a diferencia de `categoryRoutes.js`, que sí los importa y cablea en sus 3 rutas de escritura). Las líneas 66-68 exponen:
```js
router.post("/products", createProductValidation, validate, createProduct);
router.put("/products/:id", updateProductValidation, validate, updateProduct);
router.delete("/products/:id", productIdValidation, validate, deleteProduct);
```
sin ningún middleware de autorización antes de la validación. Esto está documentado como `K08 🟠` en `docs/known-issues.md` ("Escritura de catálogo sin auth. `POST/PUT/DELETE /products` no exigen autenticación ni rol") y como `F3.5` en `docs/backlog.md` ("Proteger `POST/PUT/DELETE /products` con `auth + admin`"). El propio repo ya documenta el comportamiento actual en tests: `tests/integration/security.test.js` tiene un test verde que afirma "cualquiera puede crear un producto sin token (comportamiento actual)" (`POST /api/products` → `201` sin token) y 4 tests `it.fails` con el prefijo `🔒 K08` que hoy fallan a propósito porque describen el comportamiento correcto (401/403) que aún no existe.

`createProductValidation`/`updateProductValidation` en el mismo archivo (líneas 21-61) validan `images` con `body("images.*").isURL()` pero no tienen ninguna regla `body("imageURL")` — confirmado por lectura completa del archivo. Esta asimetría quedó registrada como `BE-VALIDATE-IMAGEURL-2026-08-21` en el cierre del spec `2026-08-21-feature-product-image-gallery-backend` (PR #16), como backlog derivado explícito, no como hallazgo nuevo de este pendiente.

**Impacto verificado por el security-reviewer y confirmado por este spec (grep en `Style-Busters-main/src`):**
- Ningún componente del frontend consume `createProduct`/`updateProduct`/`deleteProduct` de `Style-Busters-main/src/Services/productService.js`. Grep de `createProduct|updateProduct|deleteProduct` en todo `Style-Busters-main/src` solo encuentra las 3 definiciones dentro del propio `productService.js` (líneas 39, 45, 51); ningún `.jsx`/`.js` del árbol las importa. No hay panel de administración en el repo hoy. **El fix no requiere ningún cambio en el frontend.**
- `productService.js` (`createProduct`/`updateProduct`/`deleteProduct`) es un passthrough puro a `apiClient.post/put/delete`, sin lógica propia que este pendiente deba tocar.

**Tests que se rompen con este cambio y que este spec exige actualizar en el mismo PR** (verificado releyendo los 3 archivos completos, no asumido del análisis previo):

1. **`Base_Datos_StyleB/tests/integration/products.test.js`** — hoy ningún test de `describe("POST /api/products")`, `describe("PUT /api/products/:id")` ni `describe("DELETE /api/products/:id")` envía token. Conteo exacto releído línea por línea:
   - `describe("POST /api/products")`: `IT-PROD-05`, `IT-PROD-06`, `IT-PROD-07`, `IT-PROD-10`, `IT-PROD-11`, `IT-PROD-12`, `IT-PROD-13`, `IT-PROD-14` → **8 tests**.
   - `describe("PUT /api/products/:id")`: `IT-PROD-08`, `"id inexistente → 404"`, `"stock negativo → 422"`, `IT-PROD-15`, `IT-PROD-16` → **5 tests**.
   - `describe("DELETE /api/products/:id")`: `IT-PROD-09`, `"id inexistente → 404"` → **2 tests**.
   - **Total: 15 tests**, coincide con el conteo del security-reviewer.
   El archivo hoy solo importa `createProduct, createCategory` de `tests/helpers/factories.js`; debe ampliar el import a `createAdmin, authHeader` (ambos ya existen en `factories.js`, sin cambios necesarios ahí) y encadenar `.set(authHeader(admin))` en cada una de las 15 llamadas.

2. **`Base_Datos_StyleB/tests/integration/security.test.js`** — `describe("Escritura del catálogo de productos")` (líneas 55-106) tiene **5 tests** a tocar:
   - `"cualquiera puede crear un producto sin token (comportamiento actual)"` (línea 62) — debe pasar a esperar `401` (o eliminarse; este spec exige actualizarlo a `401` en vez de eliminarlo, para no perder cobertura de regresión del caso "sin token").
   - `it.fails("🔒 K08 — POST /api/products sin token debería responder 401", ...)` (línea 72) — quitar `.fails`, debe pasar en verde.
   - `it.fails("🔒 K08 — PUT /api/products/:id sin token debería responder 401", ...)` (línea 78) — quitar `.fails`, debe pasar en verde.
   - `it.fails("🔒 K08 — DELETE /api/products/:id sin token debería responder 401", ...)` (línea 84) — quitar `.fails`, debe pasar en verde.
   - `it.fails("🔒 K08 — un customer autenticado no debería poder crear productos", ...)` (línea 93) — quitar `.fails`, debe pasar en verde (ya usa `createUser()` + `authHeader(customer)` y espera `403`, que es exactamente el comportamiento de `isAdmin`).

3. **`Base_Datos_StyleB/tests/integration/authorization.test.js`** — el array `ADMIN_ONLY` (líneas 16-31) no incluye ninguna ruta de `/products`. Debe agregar, siguiendo el mismo patrón que las entradas de `/categories` ya presentes (`["POST", "/api/categories"]`, `["PUT", \`/api/categories/${id()}\`]`, `["DELETE", \`/api/categories/${id()}\`]`):
   ```js
   ["POST", "/api/products"],
   ["PUT", `/api/products/${id()}`],
   ["DELETE", `/api/products/${id()}`],
   ```
   Esto activa automáticamente, para las 3 rutas nuevas, los 3 `it.each` ya existentes en `describe("Autorización — rutas que exigen auth + admin")`: 401 sin token, 403 con token de customer (`{ message: "Admin access required" }`), y "NO responde 401/403 con token de admin".

4. **`docs/known-issues.md`** — `K08` (línea 28) debe marcarse resuelto al cierre, en el mismo formato ya usado para `K02` (línea 18: `~~**K02 ...**~~ **RESUELTO** (fecha): ... → E3.`, con referencia al spec y PR).

5. **`docs/backlog.md`** — `F3.5` (línea 34) y `BE-VALIDATE-IMAGEURL-2026-08-21` (línea 39) deben marcarse resueltos al cierre, en el mismo formato ya usado para `F3.6` (línea 35: `~~F3.6 ...~~ **RESUELTO** (fecha, spec [...], referencia)`).

## Criterios de Aceptación

### F3.5 — Middleware de autorización en rutas de escritura de `/products`

- [ ] **CA-1 — Imports agregados a `productRoutes.js`.** El archivo agrega `import authMiddleware from "../middlewares/authMiddleware.js";` e `import isAdmin from "../middlewares/isAdminMiddleware.js";`, mismos imports que ya usa `categoryRoutes.js` líneas 11-12. Verificable: `grep` de ambos imports en `productRoutes.js` tras el cambio.

- [ ] **CA-2 — `POST /api/products` exige `authMiddleware` + `isAdmin`.** La ruta queda:
  ```js
  router.post("/products", authMiddleware, isAdmin, createProductValidation, validate, createProduct);
  ```
  mismo orden de cadena que `categoryRoutes.js` línea 48 (`authMiddleware → isAdmin → [validaciones] → validate → controller`). Verificable: sin token → `401 { message: "Unauthorized" }`; con token de customer → `403 { message: "Admin access required" }`; con token de admin → comportamiento actual sin cambios (`201` con payload válido).

- [ ] **CA-3 — `PUT /api/products/:id` exige `authMiddleware` + `isAdmin`.** La ruta queda:
  ```js
  router.put("/products/:id", authMiddleware, isAdmin, updateProductValidation, validate, updateProduct);
  ```
  Mismas condiciones de verificación que CA-2 (401 sin token, 403 con customer, comportamiento actual con admin).

- [ ] **CA-4 — `DELETE /api/products/:id` exige `authMiddleware` + `isAdmin`.** La ruta queda:
  ```js
  router.delete("/products/:id", authMiddleware, isAdmin, productIdValidation, validate, deleteProduct);
  ```
  Mismas condiciones de verificación que CA-2 (401 sin token, 403 con customer, comportamiento actual con admin — `204` sin body).

- [ ] **CA-5 — Rutas de lectura de `/products` sin cambios.** `GET /products/search`, `GET /products` y `GET /products/:id` conservan exactamente su cadena de middlewares actual (sin `authMiddleware` ni `isAdmin`), siguen siendo públicas. Verificable: `git diff` de `productRoutes.js` no toca las líneas 63-65; los tests existentes de `describe("GET /api/products")`, `describe("GET /api/products/:id")` y `describe("GET /api/products/search")` en `products.test.js` pasan sin ninguna modificación.

### BE-VALIDATE-IMAGEURL-2026-08-21 — Validación de formato de `imageURL`

- [ ] **CA-6 — `imageURL` validado en `createProductValidation`.** Se agrega:
  ```js
  body("imageURL").optional().isURL().withMessage("imageURL must be a valid URL"),
  ```
  al array `createProductValidation` de `productRoutes.js` (líneas 21-37), reutilizando literalmente la regla ya decidida por el security-reviewer. `.optional()` porque `imageURL` nunca fue obligatorio en el validador (el `required: true` del schema tiene `default`, como ya documenta el spec `2026-08-21-feature-product-image-gallery-backend`). Verificable: `POST /api/products` (con token de admin, tras CA-2) con `imageURL: "no-es-una-url"` → `422` con un error cuyo `path` sea `"imageURL"`; con `imageURL` ausente → sin error de este campo (se aplica el default del schema); con `imageURL` válido → `201` sin error.

- [ ] **CA-7 — `imageURL` validado en `updateProductValidation`.** Misma regla que CA-6, agregada al array `updateProductValidation` (líneas 39-61). Verificable: `PUT /api/products/:id` (con token de admin) con `imageURL` no-URL → `422` con `path: "imageURL"`; sin `imageURL` en el body → sin error de este campo, conserva el valor existente (mismo patrón que `images` en `IT-PROD-16`).

### Actualización de tests existentes que este cambio rompe

- [ ] **CA-8 — `products.test.js`: los 15 tests de escritura usan token de admin.** El archivo importa `createAdmin, authHeader` además de `createProduct, createCategory` desde `tests/helpers/factories.js`, y las 15 llamadas identificadas en "Contexto" (8 de `POST`, 5 de `PUT`, 2 de `DELETE`) encadenan `.set(authHeader(admin))`, donde `admin` se obtiene con `await createAdmin()` (puede ser una única instancia compartida por `describe` vía `beforeEach`/variable de módulo, o creada por test — decisión de implementación libre del ejecutor mientras cada llamada de escritura lleve el header). Verificable: `npm run test:integration` (`Base_Datos_StyleB`) — los 15 tests conservan exactamente sus aserciones actuales sobre status/body (ninguna aserción de negocio cambia, solo se añade el header de autenticación) y pasan en verde.

- [ ] **CA-9 — `security.test.js`: el test de "comportamiento actual" pasa a esperar 401.** El test `"cualquiera puede crear un producto sin token (comportamiento actual)"` (línea 62) se actualiza para esperar `res.status === 401` (ya no `201`); su comentario explicativo se actualiza para reflejar que el hallazgo `K08` está corregido, no pendiente. Verificable: el test pasa en verde tras el cambio.

- [ ] **CA-10 — `security.test.js`: los 4 `it.fails` de K08 pasan a `it` normal y quedan en verde.** Se elimina `.fails` de los 4 tests con prefijo `🔒 K08` (líneas 72, 78, 84, 93) sin modificar su cuerpo (ya afirman el comportamiento correcto: 401 sin token en `POST`/`PUT`/`DELETE`, 403 con customer en `POST`). Verificable: `npm run test:integration` no reporta ningún `it.fails` que ahora pase inesperadamente (lo cual haría fallar el test en Vitest) — los 4 deben ejecutarse como `it` normal y pasar.

- [ ] **CA-11 — `authorization.test.js`: `ADMIN_ONLY` incluye las 3 rutas de escritura de `/products`.** Se agregan `["POST", "/api/products"]`, `["PUT", \`/api/products/${id()}\`]`, `["DELETE", \`/api/products/${id()}\`]` al array `ADMIN_ONLY` (líneas 16-31), mismo patrón que las entradas ya presentes de `/categories`. Verificable: los 3 `it.each` existentes de `describe("Autorización — rutas que exigen auth + admin")` (401 sin token, 403 con customer, sin 401/403 con admin) se ejecutan automáticamente para las 3 rutas nuevas y pasan en verde, sin escribir ningún test nuevo a mano en este archivo (el mecanismo `it.each` ya cubre las rutas agregadas al array).

- [ ] **CA-12 — Casos `422` de `imageURL` no-URL en `products.test.js`.** Se agregan, en paralelo a los ya existentes para `images` (`IT-PROD-13` para create, patrón análogo para update), como mínimo 2 tests nuevos: uno en `describe("POST /api/products")` (con token de admin) que envíe `imageURL: "no-es-una-url"` y espere `422` con `path: "imageURL"` en `res.body.errors`; otro en `describe("PUT /api/products/:id")` (con token de admin) con la misma aserción. Verificable: ambos tests pasan en verde y ejercitan CA-6/CA-7 vía integración real (no solo por inspección del validador).

### Documentación de cierre (formalización, no ejecución inmediata)

- [ ] **CA-13 — `docs/known-issues.md` (`K08`) y `docs/backlog.md` (`F3.5`, `BE-VALIDATE-IMAGEURL-2026-08-21`) marcados resueltos al cierre.** Siguiendo el formato ya usado para `K02`/`F3.6` (`~~texto tachado~~ **RESUELTO** (fecha): descripción del fix, referencia al spec y PR`), el ejecutor actualiza ambos documentos como parte del cierre del spec (FASE 10 del SSDLC), no como paso intermedio de implementación. Verificable: `git diff` del commit de cierre incluye ambos archivos con el marcado de resuelto y la referencia a este spec.

## Consideraciones de Seguridad

Modelado STRIDE ya realizado por el security-reviewer; este spec lo formaliza sin reabrirlo.

- **Spoofing:** aplica de forma indirecta — `authMiddleware` verifica la firma del JWT con `jwt.verify(token, process.env.JWT_SECRET)` (mecanismo ya existente, sin cambios en este pendiente). Un actor no puede suplantar un rol `admin` sin poseer un token firmado válido con `role: "admin"` en el payload; el control ya existe en el propio middleware, este pendiente solo lo cablea a las 3 rutas de `/products` que hoy carecían de él.
- **Tampering — amenaza principal corregida por este pendiente.** Antes del fix, cualquier actor no autenticado podía crear, modificar o borrar productos del catálogo público sin restricción alguna (`POST`/`PUT`/`DELETE /products` sin `authMiddleware`/`isAdmin`, verificado en el código y en el test hoy verde `"cualquiera puede crear un producto sin token (comportamiento actual)"`). El control aplicado (CA-2 a CA-4) cierra el vector: solo un actor autenticado con `role: "admin"` puede escribir en el catálogo.
- **Repudiation:** mejora como efecto colateral, no es el objetivo del pendiente. `authMiddleware` asigna `req.user = decoded` (con `userId`, `name`, `role`) antes de llegar al controller; aunque este pendiente no agrega logging de auditoría nuevo (`logger` sigue registrando solo `método | url`, sin usuario), a partir de este cambio toda escritura de catálogo queda atada a una identidad verificable en el token, lo que reduce (no elimina) la posibilidad de repudio frente al estado anterior (cualquiera, sin identidad, podía escribir).
- **Information Disclosure:** sin cambios de riesgo. Los cuerpos de error `401`/`403` que emiten `authMiddleware` (`{ message: "Unauthorized" }` / `{ message: "invalid or expired token" }`) e `isAdmin` (`{ message: "Authentication is required" }` / `{ message: "Admin access required" }`) son genéricos, ya usados de forma idéntica en `categoryRoutes.js` y en el resto de rutas `auth + admin` del repo; no revelan si el producto/recurso existe ni datos internos.
- **Denial of Service:** sin cambio material. `isURL()` sobre `imageURL` (CA-6/CA-7) es una validación de un único string adicional por petición, del mismo costo computacional que la ya existente `body("images.*").isURL()`; no introduce ninguna superficie nueva de saturación. El middleware `authMiddleware` añade una verificación criptográfica de JWT (`jwt.verify`), de costo marginal y ya usada en todas las demás rutas protegidas del repo.
- **Elevation of Privilege — corrección central de este pendiente.** El estado actual es, en los hechos, una escalada de privilegio implícita: cualquier actor no autenticado tiene, hoy, capacidad de escritura equivalente a un `admin` sobre el catálogo (sin necesidad de poseer ningún privilegio). CA-2 a CA-4 eliminan esa equivalencia: solo un token válido con `role: "admin"` supera `isAdmin`; un `customer` autenticado recibe `403` (ya cubierto por el test existente `"🔒 K08 — un customer autenticado no debería poder crear productos"`, CA-10).
- **Controles de mitigación:** `authMiddleware` (verificación de firma/expiración de JWT) + `isAdminMiddleware` (verificación de `role === "admin"`) en las 3 rutas de escritura; `body("imageURL").optional().isURL()` en ambos validadores.
- **Inputs que requieren validación:** `req.headers["authorization"]` (ya validado por `authMiddleware`, sin cambios de lógica); `req.body.imageURL` (nuevo: debe ser una URL válida o estar ausente).
- **Secrets involucrados:** ninguno nuevo. `JWT_SECRET` ya se usa en `authMiddleware` sin cambios en este pendiente.
- **Superficie de ataque afectada:** `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` — pasan de superficie pública sin restricción a superficie protegida por `auth + admin`. `GET /products*` no cambia su superficie (sigue público, CA-5).

## Dependencias

- **Internas** (todas en `Base_Datos_StyleB/` salvo que se indique):
  - `src/routes/productRoutes.js` — CA-1 a CA-7 (código de producción).
  - `src/middlewares/authMiddleware.js`, `src/middlewares/isAdminMiddleware.js` — solo lectura/reutilización, sin cambios (mismos middlewares ya usados en `categoryRoutes.js`, `userRoutes.js`, etc.).
  - `src/routes/categoryRoutes.js` — solo lectura de referencia, patrón exacto a replicar (orden de middlewares, forma de los imports).
  - `tests/integration/products.test.js` — CA-8, CA-12.
  - `tests/integration/security.test.js` — CA-9, CA-10.
  - `tests/integration/authorization.test.js` — CA-11.
  - `tests/helpers/factories.js` — solo lectura; `createAdmin`, `authHeader` ya existen y no requieren cambios.
  - `docs/known-issues.md` (`K08`), `docs/backlog.md` (`F3.5`, `BE-VALIDATE-IMAGEURL-2026-08-21`) — CA-13, al cierre.
- **Externas:** ninguna librería nueva. `jsonwebtoken` y `express-validator` ya son dependencias directas del backend, ya usadas exactamente en los mismos patrones que este pendiente reutiliza.
- **Cruzadas:** ninguna hacia el frontend (`Style-Busters-main/`) — verificado por grep (ver "Contexto"), sin consumidores de las 3 funciones de escritura de `productService.js`. No hay pendiente frontend derivado de este spec.

## Decisiones de Diseño

Este spec no introduce alternativas de diseño propias: reutiliza literalmente decisiones ya tomadas y justificadas (por el security-reviewer para F3.5, y por el spec `2026-08-21-feature-product-image-gallery-backend` para la validación de `imageURL`). Se documenta aquí únicamente por qué se combinan ambos hallazgos en un solo pendiente, para que quede trazable:

| Aspecto | Decisión | Justificación |
|---|---|---|
| Combinar F3.5 + BE-VALIDATE-IMAGEURL-2026-08-21 en un solo spec/rama/PR | Sí (decisión del security-reviewer, formalizada aquí) | Mismo archivo (`productRoutes.js`), mismo endpoint (`/products`), bajo riesgo de conflicto entre ambos cambios (uno toca middlewares de ruta, otro toca arrays de validación dentro del mismo archivo) — dividirlos en dos PRs obligaría a resolver el mismo archivo dos veces sin beneficio de aislamiento real. |
| Orden de middlewares en las 3 rutas de escritura | `authMiddleware → isAdmin → [validaciones] → validate → controller` | Es el orden ya usado en `categoryRoutes.js` (único precedente en el repo de rutas `auth + admin` con validadores encadenados) — sin desviación para mantener el patrón único del repo. |
| `imageURL` con `.optional()` en vez de obligatorio | `.optional()` | El campo nunca fue obligatorio en el validador (aunque sí lo es en el schema, con `default`); hacerlo obligatorio en el validador cambiaría comportamiento no pedido por ninguno de los dos hallazgos combinados. |

## Riesgos y Deuda Técnica

- **Breaking change de contrato de API (riesgo principal a documentar).** `POST /api/products`, `PUT /api/products/:id` y `DELETE /api/products/:id` pasan de responder `201`/`200`/`204` sin ningún token a responder `401` sin token (o `403` con token de rol `customer`). Es un cambio de comportamiento observable real de la API, no solo interno. Verificado: **no hay ningún consumidor conocido en el frontend actual** (`Style-Busters-main/`, ver "Contexto"), por lo que no rompe la SPA existente. **No obstante, se declara explícitamente como breaking change de contrato de API para cualquier consumidor externo hipotético** (integración de terceros, scripts, herramientas de administración fuera de este repo) — no hay ninguno conocido hoy, pero el cambio de 2xx a 401/403 sin token es, por definición, incompatible hacia atrás para quien dependiera del comportamiento anterior.
- **`imageURL` no validado hasta ahora en producción real (si hay datos existentes).** Si existieran productos ya persistidos con `imageURL` en un formato no-URL (fuera del default del schema, `"https://placehold.co/600x400"`), la nueva validación de CA-6/CA-7 solo afecta a peticiones de creación/actualización futuras — no se ejecuta validación retroactiva sobre documentos ya guardados (mismo criterio que el spec de `images`, CA-6 de `2026-08-21-feature-product-image-gallery-backend`, sin migración).
- **Deuda técnica preexistente que este pendiente no toca:** ninguna otra ruta del repo carece de auth en un patrón equivalente a `F3.5` (todas las demás rutas de escritura de otros recursos ya tienen `authMiddleware`, verificado en la matriz de rutas de `CLAUDE.md` §2); este era el único caso pendiente de ese tipo específico.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna dentro del alcance de este pendiente.
- **Comportamientos inconsistentes detectados:** ninguno nuevo — este pendiente corrige dos inconsistencias ya trackeadas (`K08`/`F3.5` y `BE-VALIDATE-IMAGEURL-2026-08-21`), no introduce ninguna.
- **Gaps entre frontend y backend:** ninguno — verificado que `productService.js` no tiene consumidores de las funciones afectadas; no se requiere ningún cambio de frontend.
- **Persistencia pendiente de migrar:** ninguna (ver "Riesgos y Deuda Técnica" sobre `imageURL` no validado retroactivamente).
- **Decisiones aplazadas:** ninguna — ambos hallazgos combinados ya tenían su solución completamente decidida antes de este spec.
- **Trabajo fuera de alcance en esta iteración:** cualquier otro hallazgo de `docs/known-issues.md`/`docs/backlog.md` no referenciado aquí (p. ej. `K10`, `K20`, `F3.1`-`F3.4`, etc.); cualquier UI de administración de productos (no existe hoy en el repo).
- **Riesgos que requieren seguimiento:** el breaking change de contrato de API para consumidores externos hipotéticos (ver "Riesgos y Deuda Técnica") — no requiere backlog nuevo porque no hay consumidor conocido a quien notificar; queda documentado para trazabilidad si en el futuro aparece uno.
- **Items que deben convertirse en backlog:** ninguno nuevo detectado hasta ahora; se revisará en el cierre si surge algo durante la implementación (FASE 6, registro inmediato de hallazgos).

## Resultados (se completa al cerrar)
- **Fecha de cierre:** _pendiente_.
- **CAs cumplidos:** _pendiente_.
- **CAs no cumplidos:** _pendiente_.
- **Deuda técnica generada:** _pendiente_.
- **Lecciones aprendidas:** _pendiente_.
- **Pendientes abiertos confirmados:** _pendiente_.
- **Gaps no resueltos:** _pendiente_.
- **Trabajo fuera de alcance confirmado:** _pendiente_.
- **Backlog derivado creado:** _pendiente_.
- **Referencias a historias/tareas creadas:** _pendiente_.

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| `K08`/`F3.5` — escritura de catálogo sin auth | Por resolver en este pendiente | CA-1 a CA-5, CA-8 a CA-11 |
| `BE-VALIDATE-IMAGEURL-2026-08-21` — asimetría de validación `imageURL`/`images` | Por resolver en este pendiente | CA-6, CA-7, CA-12 |
| Breaking change de contrato de API (2xx → 401/403 sin token) | Documentado, sin consumidor conocido afectado | Sin acción adicional — declarado explícitamente en "Riesgos y Deuda Técnica" |
