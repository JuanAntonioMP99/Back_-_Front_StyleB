# Plan de Prueba: Galería de imágenes de producto — contrato de backend (`images`)

- **Spec:** `docs/specs/2026-08-21-feature-product-image-gallery-backend.md`  ·  **Backlog ID:** BE-PRODUCT-IMAGE-GALLERY-2026-08-21
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** backend `Base_Datos_StyleB/`
- **Commits de implementación:** `8657dc22` (feat), `274c50f2` (test)

## Entorno de prueba
- Backend: tests de integración vía `supertest` contra `app` exportada de `Base_Datos_StyleB/server.js` (sin puerto real, sin `.env`).
- DB: `mongodb-memory-server` (levantado por `tests/globalSetup.js` / `tests/setup.js`), no requiere MongoDB local.
- Datos de prueba: `tests/helpers/factories.js` (`createProduct`, `createCategory`).
- Nota de método: además de los tests versionados (`tests/unit/models/Product.test.js`), este plan verificó CA-3 (casos negativos), CA-4, CA-5 y CA-6 con archivos de test temporales (`tests/integration/__qa_images_verify.test.js`, `tests/integration/__qa_ca6_verify.test.js`), ejecutados y luego **eliminados** — no están en el árbol ni se han commiteado. Ningún test de integración versionado en `tests/integration/products.test.js` cubre hoy `images` explícitamente (ver hallazgo en TC-4/TC-5/TC-9 más abajo).

## Casos de prueba

### TC-1 — Campo `images` en el esquema (CA-1)
- **Precondición:** ninguna.
- **Pasos:** inspeccionar `Base_Datos_StyleB/src/models/Product.js`; ejecutar `tests/unit/models/Product.test.js` ("images es [] por defecto cuando no se envía el campo").
- **Dato de entrada:** `new Product({ name, description, price })`.
- **Resultado esperado:** `images` es `[]` por defecto; `Product.schema.path("images")` es un array de `String`.
- **Resultado real:** `Product.js:13` — `images: { type: [String], default: [] }`. Test unitario `Product.test.js:52-61` pasa (`product.images` → `[]`, `validateSync()` → `undefined`).
- **Estado:** ✅ cumplido.

### TC-2 — `imageURL` sin cambios de comportamiento + comentario CA-2b (CA-2, CA-2a, CA-2b)
- **Precondición:** ninguna.
- **Pasos:** diff de `Product.js` contra `develop`; ejecutar los tests existentes de `imageURL` en `Product.test.js`.
- **Dato de entrada:** `new Product({ name, description, price })`, y `imageURL: undefined` explícito.
- **Resultado esperado:** `imageURL` sigue `required: true`, `default: "https://placehold.co/600x400"`, sin `isURL()` ni cambios; existe un comentario que documenta que `images` son adicionales y no incluyen `imageURL`.
- **Resultado real:** `git diff develop..HEAD -- Base_Datos_StyleB/src/models/Product.js` muestra únicamente 4 líneas añadidas (comentario + campo `images`); la línea `imageURL: { type: String, required: true, default: "https://placehold.co/600x400" }` (`Product.js:9`) no cambia un carácter. Comentario en `Product.js:10-12` documenta explícitamente CA-2b ("Imágenes ADICIONALES de galería: no incluyen imageURL... La galería completa... se compone en el frontend como `[imageURL, ...images]`"). Tests `Product.test.js:6-15` ("exige name, description y price") y `:17-27` ("aplica los defaults... imageURL placeholder") y `:29-40` ("imageURL es required pero su default hace que nunca falte") pasan sin modificación de aserción (comparado con `develop`, ver TC-7).
- **Estado:** ✅ cumplido.

### TC-3 — Validación de `images` en `createProductValidation`/`updateProductValidation` — caso positivo (CA-3)
- **Precondición:** servidor de test disponible (`app`).
- **Pasos:** `POST /api/products` con `images: ["https://a.test/1.jpg", "https://a.test/2.jpg"]`; `PUT /api/products/:id` con un array válido de URLs.
- **Dato de entrada:** array de 2 URLs válidas.
- **Resultado esperado:** `201`/`200` con `images` persistido tal cual.
- **Resultado real:** confirmado en verificación temporal (ver más abajo, "Quality gates") — `POST` con `images` válidas → `201`, `res.body.images` igual al array enviado.
- **Estado:** ✅ cumplido.

### TC-4 — Validación de `images` — casos negativos (CA-3, caso importante pedido explícitamente)
- **Precondición:** servidor de test disponible.
- **Pasos:**
  1. `POST /api/products` con `images: "https://a.test/1.jpg"` (string, no array).
  2. `POST /api/products` con `images: ["no-es-url"]` (elemento no-URL).
  3. `POST /api/products` con `images` de 11 elementos (excede `max: 10`).
- **Dato de entrada:** los tres payloads de arriba (más `name`, `description`, `price` válidos en cada uno).
- **Resultado esperado:** `422` con `{ errors: [...] }` en los tres casos, incluyendo el path `images` (o `images[0]`) en la lista de errores.
- **Resultado real (verificado con test temporal, no versionado — ver nota de método):**
  1. `images` no-array → `422`, `errors` incluye `path: "images"`.
  2. `images: ["no-es-url"]` → `422`, `errors` incluye `path: "images[0]"`.
  3. 11 elementos → `422`, `errors` incluye `path: "images"` (mensaje "Images must be an array of at most 10 URLs").
- **Hallazgo importante:** **`tests/integration/products.test.js` no tiene ningún test versionado que cubra estos tres casos.** El comportamiento es correcto (verificado ad hoc), pero no queda protegido contra regresión por el suite real del repo. Se reporta como gap, no se corrige (fuera del rol de qa-test-designer escribir/commitear tests de producto).
- **Estado:** ⚠️ parcial — comportamiento correcto verificado, pero sin cobertura de regresión en el suite versionado.

### TC-5 — `createProduct` persiste `images` (CA-4)
- **Precondición:** servidor de test disponible.
- **Pasos:** `POST /api/products` con `images` válidas; `POST /api/products` sin `images` en el body.
- **Dato de entrada:** payload con `images: [...]`; payload sin la clave `images`.
- **Resultado esperado:** `201` con `images` igual al array enviado; `201` con `images: []` si se omite.
- **Resultado real (verificado con test temporal, no versionado):** ambos casos correctos — `res.body.images` igual al array enviado en el primero; `[]` en el segundo. `productController.js:80,87` desestructura y pasa `images` a `Product.create`.
- **Hallazgo:** igual que TC-4, `products.test.js` no cubre `images` en `POST` (el test `IT-PROD-05` no envía ni verifica `images`).
- **Estado:** ⚠️ parcial — comportamiento correcto verificado ad hoc, sin cobertura de regresión versionada.

### TC-6 — `updateProduct` no borra `images` existente si se omite (CA-5, caso importante pedido explícitamente)
- **Precondición:** un producto ya persistido con `images` no vacío (`createProduct({ images: ["https://a.test/existing.jpg"] })`).
- **Pasos:** `PUT /api/products/:id` enviando solo `{ name: "Nombre actualizado" }` (sin `images`); por separado, `PUT /api/products/:id` enviando `{ images: [...] }` para confirmar que sí actualiza cuando se envía.
- **Dato de entrada:** body sin clave `images`; body con `images: ["https://a.test/new.jpg"]`.
- **Resultado esperado:** en el primer caso, el `images` ya persistido se conserva sin cambios; en el segundo, se reemplaza por el nuevo array.
- **Resultado real (verificado con test temporal, no versionado):** confirmado — `PUT` sin `images` devuelve `res.body.images` igual al valor previamente persistido (`["https://a.test/existing.jpg"]`); `PUT` con `images` devuelve el nuevo array. Mecanismo: `productController.js:100,103` desestructura `images` de `req.body` (queda `undefined` si no viene) y lo pasa a `findByIdAndUpdate`; el driver de MongoDB/BSON omite las claves con valor `undefined` al serializar, por lo que no se envía ninguna instrucción de escritura sobre `images` y el valor existente en el documento no se toca.
- **Hallazgo:** `tests/integration/products.test.js` no tiene ningún test que cubra este caso (el único test de `PUT` que toca campos parciales es `IT-PROD-08`, que no involucra `images`). Es precisamente el escenario que el spec marca como "importante" (CA-5) y **no está protegido por regresión en el suite versionado**.
- **Estado:** ⚠️ parcial — comportamiento correcto y verificado explícitamente, pero sin test de regresión versionado.

### TC-7 — Sin migración; default cubre documentos existentes (CA-6)
- **Precondición:** ninguna (no se toca `globalSetup.js`/`setup.js`).
- **Pasos:** insertar directamente en la colección `products` (driver nativo, sin pasar por Mongoose) un documento sin campo `images` (simulando un producto pre-existente al cambio de esquema); leerlo con `Product.findById(...)`.
- **Dato de entrada:** documento crudo `{ name, description, price, stock, imageURL, createdAt, updatedAt }` sin `images`.
- **Resultado esperado:** `Product.findById(...)` devuelve `images: []`.
- **Resultado real (verificado con test temporal, no versionado):** confirmado — `found.images` es `[]`. No se agregó ningún script de migración ni se tocó `tests/globalSetup.js`/`tests/setup.js` (confirmado por `git diff --stat`, ver TC-9).
- **Estado:** ✅ cumplido (comportamiento verificado ad hoc; no hay test versionado de este escenario específico, pero el mecanismo — default de Mongoose aplicado en hidratación — es el mismo que ya cubre `Product.test.js:29-40` para `imageURL`).

### TC-8 — Tests unitarios del modelo ampliados (CA-7)
- **Precondición:** ninguna.
- **Pasos:** `npm run test:unit` (`Base_Datos_StyleB`).
- **Dato de entrada:** N/A.
- **Resultado esperado:** los tests nuevos de `Product.test.js` ("images es [] por defecto...", "images acepta y persiste...") pasan; ningún test existente (`name`/`description`/`price`, defaults, `imageURL` con `undefined`, `price` no numérico, `category`) cambia de resultado.
- **Resultado real:** `npm test` completo (unit + integración) → `28 archivos, 268 passed | 21 expected fail (289)`, sin fallos inesperados. Los 2 tests nuevos de `images` (`Product.test.js:52-61` y `:63-79`) están incluidos y pasan. Los 21 "expected fail" son casos `.fails(...)` preexistentes de otros archivos (bugs documentados a propósito, no relacionados con este pendiente — confirmado por `grep .fails(` en `tests/`, ninguno en `Product.test.js` ni en `products.test.js`).
- **Estado:** ✅ cumplido.

### TC-9 — Consistencia de lectura: `getProducts`/`getProductById`/`searchProducts` no tocados (CA-8)
- **Precondición:** ninguna.
- **Pasos:** diff de `productController.js` contra `develop`; `GET /api/products` y `GET /api/products/:id` sobre un producto con `images` no vacío.
- **Dato de entrada:** producto creado con `images: [...]`.
- **Resultado esperado:** las tres funciones de lectura no cambian su lógica; `images` aparece en la respuesta sin código adicional en ellas.
- **Resultado real:** `git diff develop..HEAD -- Base_Datos_StyleB/src/controllers/productController.js` muestra cambios únicamente en `createProduct` (líneas 80, 87) y `updateProduct` (líneas 100, 103); `searchProducts` (líneas 3-54), `getProducts` (56-63) y `getProductById` (65-76) están byte-a-byte iguales a `develop`. `tests/integration/products.test.js` (`IT-PROD-01`, `IT-PROD-02`) pasa sin modificación y devuelve el documento completo (incluyendo `images` por no proyectar campos) — aunque ningún test ahí hace `expect` explícito sobre `images` en la respuesta de `GET`.
- **Estado:** ✅ cumplido.

### TC-10 — Sin cambios a rutas, permisos ni otros modelos (CA-9)
- **Precondición:** ninguna.
- **Pasos:** `git diff --stat develop..HEAD -- Base_Datos_StyleB`.
- **Dato de entrada:** N/A.
- **Resultado esperado:** solo los 4 archivos declarados en el spec, sin tocar rutas nuevas, `authMiddleware`/`isAdminMiddleware`, ni otros modelos (`Category`, `Cart`, `Order`, `User`, `Address`, `PaymentMethod`, `WishList`).
- **Resultado real:**
  ```
  Base_Datos_StyleB/src/controllers/productController.js |  7 +++---
  Base_Datos_StyleB/src/models/Product.js                 |  4 +++
  Base_Datos_StyleB/src/routes/productRoutes.js            | 10 ++++++++
  Base_Datos_StyleB/tests/unit/models/Product.test.js       | 29 ++++++++++++++++++++++
  4 files changed, 47 insertions(+), 3 deletions(-)
  ```
  Exactamente los 4 archivos previstos por el spec. `productRoutes.js` (`git diff`) solo añade las 4 líneas de `body("images")...` en cada validador — no toca ninguna línea de `router.get/post/put/delete(...)`, ni agrega `authMiddleware`/`isAdminMiddleware`. Ningún otro modelo tocado.
- **Estado:** ✅ cumplido.

## Quality gates (evidencia)
```
comando : npm test        (Base_Datos_StyleB, unit + integración)
resultado : Test Files 28 passed (28) | Tests 268 passed | 21 expected fail (289)
            Sin fallos inesperados. Duración 11.01s.

comando : npm run test:unit  (Base_Datos_StyleB) — incluido en la corrida completa de arriba;
          Product.test.js (11 tests, incluye los 2 nuevos de images) pasa íntegro.

verificación ad hoc (temporal, NO versionada — creada, ejecutada y borrada en esta sesión):
  tests/integration/__qa_images_verify.test.js → 7/7 pasaron
    - POST con images válidas -> 201, persiste array
    - POST sin images -> 201, images: []
    - POST con images no-array -> 422 (path "images")
    - POST con elemento no-URL -> 422 (path "images[0]")
    - POST con 11 elementos -> 422 (path "images")
    - PUT sin images no borra el existente
    - PUT con images actualiza el array
  tests/integration/__qa_ca6_verify.test.js → 1/1 pasó
    - documento insertado sin `images` (simulando pre-existente) -> Product.findById devuelve images: []

build      : N/A (backend Node, sin paso de build)
type-check : N/A (JS puro, sin TypeScript en el repo)
lint       : N/A (no hay script de lint configurado en Base_Datos_StyleB/package.json)
```

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | ✅ cumplido |
| CA-2 / CA-2a / CA-2b | TC-2 | ✅ cumplido |
| CA-3 (positivo) | TC-3 | ✅ cumplido |
| CA-3 (negativo) | TC-4 | ⚠️ parcial — correcto, sin test de regresión versionado |
| CA-4 | TC-5 | ⚠️ parcial — correcto, sin test de regresión versionado |
| CA-5 | TC-6 | ⚠️ parcial — correcto, sin test de regresión versionado |
| CA-6 | TC-7 | ✅ cumplido |
| CA-7 | TC-8 | ✅ cumplido |
| CA-8 | TC-9 | ✅ cumplido |
| CA-9 | TC-10 | ✅ cumplido |

**Resumen:** 7 de 10 casos cumplidos sin reservas; 3 parciales (TC-4, TC-5, TC-6) — el comportamiento implementado es **correcto** en los tres (verificado explícitamente con tests ad hoc en esta sesión, ejecutados y no versionados), pero **`tests/integration/products.test.js` no cubre `images` en ningún caso** (ni positivo en `POST`/`PUT`, ni los tres negativos de validación de CA-3, ni el caso de preservación parcial de CA-5). Esto es una brecha de cobertura de regresión, no un defecto funcional. No corresponde a este rol escribir o commitear esos tests (fuera de mandato de qa-test-designer); se reporta como hallazgo para que el equipo decida si `backend-builder` amplía `products.test.js` antes de cerrar el pendiente. Con esa salvedad, **veredicto global: APTO para gate G3** — todos los CA están funcionalmente satisfechos con evidencia directa, el gate `npm test` está en verde (268 passed, 0 fallos inesperados) y `git diff --stat` confirma el alcance exacto de 4 archivos sin tocar rutas/permisos/otros modelos.
