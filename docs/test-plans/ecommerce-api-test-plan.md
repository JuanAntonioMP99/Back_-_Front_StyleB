# Plan de Pruebas: ecommerce-api (backend `Base_Datos_StyleB/`)

- **Ámbito:** backend `Base_Datos_StyleB/` — API REST Express 5 + Mongoose 9 (ESM)
- **Fecha:** 2026-07-16
- **Autor (rol):** qa-test-designer
- **Runner:** Vitest 4 · supertest · mongodb-memory-server
- **Issues relacionados:** [`docs/known-issues.md`](../known-issues.md)

Plan único para pruebas **unitarias** y **de integración** de todo el backend. Cubre
estrategia, configuración, matriz de casos con identificador estable y seguimiento
de progreso ejecutable.

---

## 1. Objetivo y alcance

**Objetivo:** disponer de una red de seguridad automatizada que permita refactorizar
el backend y cerrar los issues `K0x`/`K1x` sin regresiones silenciosas.

**Dentro de alcance:**

| Capa | Qué se prueba | Tipo |
|------|---------------|------|
| Middlewares | `authMiddleware`, `isAdmin`, `validate`, `errorHandler`, `logger` | Unitaria |
| Config | `env.js` (parseo/validación de entorno) | Unitaria |
| Modelos | Schemas Mongoose: required, enum, default, min/max | Unitaria (con BD en memoria) |
| Controllers + rutas | Los 8 routers montados bajo `/api` | Integración (supertest) |
| App | Ruta raíz, 404, CORS, cadena de middlewares | Integración |

**Fuera de alcance:** frontend `Style-Busters-main/` (plan aparte), `scripts/seed.js`,
rendimiento/carga, y `addressController.js` (sin rutas montadas → no alcanzable vía HTTP;
solo se prueba si se monta `addressRoutes`, ver `K04`).

---

## 2. Estrategia

Pirámide invertida-ligera, deliberada para este proyecto: la lógica de negocio vive
**dentro de los controllers**, acoplada a Express y Mongoose. Extraer una capa de
servicios solo para poder testear sería un refactor no pedido, así que **la integración
vía supertest es el instrumento principal** (mayor valor por caso escrito) y lo unitario
se reserva a piezas puras y aisladas (middlewares, `env.js`, schemas).

- **Integración (~70%):** petición HTTP real contra la app importada, BD en memoria real.
  Prueban ruta + validadores + auth + controller + schema + respuesta, tal como corre en prod.
- **Unitaria (~30%):** middlewares y config con dobles (`vi.fn()`), sin BD ni HTTP.
- **Sin mocks de Mongoose.** Se usa `mongodb-memory-server`: valida schemas, `populate`,
  índices `unique` y casts de `ObjectId` — precisamente lo que los mocks ocultan.

### Principios

1. **Un test = un comportamiento observable.** Assert sobre status + body, no sobre internals.
2. **Aislamiento total.** `afterEach` limpia todas las colecciones; ningún test depende del orden.
3. **Los tests documentan el comportamiento REAL**, no el deseado. Cuando el código tiene un
   defecto conocido, el test se marca `.fails()`/`skip` y se enlaza al issue `K0x` (§8).
4. **Negativos obligatorios.** Cada endpoint prueba al menos: éxito, 401/403 si aplica,
   422 de validación, 404 de no encontrado.

---

## 3. Configuración y arquitectura de tests

### Archivos

```
Base_Datos_StyleB/
├── vitest.config.js            # config del runner + trinquete de cobertura
└── tests/
    ├── setup.js                # mongodb-memory-server + env determinista + limpieza
    ├── helpers/
    │   └── factories.js        # createUser/createAdmin/createProduct/… + tokenFor/authHeader
    ├── unit/
    │   ├── middlewares/*.test.js
    │   ├── config/*.test.js
    │   └── models/*.test.js
    └── integration/
        └── *.test.js           # un archivo por router
```

### Decisiones de configuración (y por qué)

| Decisión | Motivo |
|----------|--------|
| `environment: "node"` | La API no usa DOM. |
| `setupFiles: ["tests/setup.js"]` | Arranca mongod en memoria y fija `JWT_SECRET`/`ADMIN_SECRET` antes de importar módulos. |
| `fileParallelism: false` | Cada archivo levanta su propio mongod; en paralelo compiten por RAM y los tiempos se vuelven erráticos. Subir a `true` si el suite crece y la duración molesta. |
| `hookTimeout: 60000` | La **primera** ejecución descarga el binario de MongoDB (~100 MB); sin esto, el primer run falla por timeout. |
| `restoreMocks`/`clearMocks` | Evita fuga de estado de `vi.fn()` entre tests. |
| `coverage.exclude: db.conf.js` | `connectDB()` no se ejecuta en tests (los tests conectan a la BD en memoria) y hace `process.exit(1)` en error. |

### Precondición de testabilidad (ya resuelta)

`server.js` **exporta la app** y solo hace `connectDB()` + `app.listen()` bajo el guard
`isMain` (`process.argv[1] === fileURLToPath(import.meta.url)`). Esto es lo que permite a
supertest importar la app sin abrir puerto ni conectar a la Mongo real. **No romper este
guard**: sin él, todo el suite de integración deja de funcionar.

`env.js` se lee en tiempo de import, por eso `setup.js` fija `process.env` en la primera línea.

---

## 4. Cómo ejecutar

```bash
cd Base_Datos_StyleB

npm test                 # todo el suite (unit + integración)
npm run test:watch       # modo watch durante desarrollo
npm run test:unit        # solo tests/unit
npm run test:integration # solo tests/integration
npm run test:coverage    # con cobertura + verificación de umbrales
```

> **Nota de entorno (Windows).** La ruta del repo contiene `&`
> (`Back_&_Front_StyleB`), que rompe los shims `.cmd` de `npm`/`npx`: `npx vitest` falla con
> `MODULE_NOT_FOUND`. Por eso los scripts invocan el entrypoint JS directamente
> (`node ./node_modules/vitest/vitest.mjs`), que funciona en cualquier ruta. Usar
> **siempre `npm test`**, no `npx vitest`. Misma causa afecta a `npm run dev` (nodemon).

**Requisitos:** Node ≥ 20 (validado en v24.15.0). No requiere MongoDB instalado ni `.env`:
`setup.js` provee los valores. La primera ejecución descarga el binario de mongod y tarda más.

---

## 5. Convenciones

- **Nombre de archivo:** `<módulo>.test.js`, espejo de la ruta en `src/`.
- **Estructura:** `describe("<MÉTODO> /ruta")` → `it("comportamiento esperado")`, patrón AAA.
- **Idioma:** descripciones en español, en indicativo ("devuelve 401 si…").
- **ID de caso:** `UT-*` (unitario) / `IT-*` (integración). El ID es estable y se referencia
  desde la matriz (§6). No reutilizar IDs de casos eliminados.
- **Datos:** siempre vía `tests/helpers/factories.js`. Nunca literales `ObjectId` compartidos
  entre tests.
- **Auth:** `authHeader(user)` para token válido; `expiredTokenFor(user)` para el caso de expirado.

---

## 6. Matriz de pruebas

**Estado:** ✅ implementado y en verde · ⬜ pendiente · 🔴 escrito y fallando (defecto abierto)
**Prioridad:** P0 crítico (seguridad/dinero) · P1 alto · P2 medio

### 6.1 Unitarias — Middlewares

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| UT-MW-AUTH-01 | Sin header `Authorization` → 401 `{message:"Unauthorized"}`, no llama `next()` | P0 | ⬜ |
| UT-MW-AUTH-02 | Header malformado (sin `Bearer `) → 401 | P0 | ⬜ |
| UT-MW-AUTH-03 | Token con firma inválida → 401 `{message:"invalid or expired token"}` | P0 | ⬜ |
| UT-MW-AUTH-04 | Token expirado → 401 | P0 | ⬜ |
| UT-MW-AUTH-05 | Token válido → asigna `req.user` con el payload y llama `next()` | P0 | ⬜ |
| UT-MW-ADM-01 | Sin `req.user` → 401 `{message:"Authentication is required"}` | P0 | ✅ |
| UT-MW-ADM-02 | `role !== "admin"` → 403 `{message:"Admin access required"}` | P0 | ✅ |
| UT-MW-ADM-03 | `role === "admin"` → llama `next()` | P0 | ✅ |
| UT-MW-VAL-01 | Sin errores de validación → llama `next()` | P1 | ⬜ |
| UT-MW-VAL-02 | Con errores → 422 `{errors:[…]}`, no llama `next()` | P1 | ⬜ |
| UT-MW-ERR-01 | Responde 500 `{status:"error",message:"Internal Server Error"}` | P1 | ⬜ |
| UT-MW-ERR-02 | No re-envía si `res.headersSent` es `true` | P2 | ⬜ |
| UT-MW-ERR-03 | Escribe la entrada en `logs/error.log` | P2 | ⬜ |
| UT-MW-LOG-01 | Llama `next()` y emite `ISO | método | url` | P2 | ⬜ |

### 6.2 Unitarias — Config `env.js`

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| UT-ENV-01 | Sin `CORS_ALLOWED_ORIGINS` → default `["http://localhost:3000"]` | P1 | ⬜ |
| UT-ENV-02 | Lista con espacios y coma colgante → array limpio (`trim`+`filter`) | P1 | ⬜ |
| UT-ENV-03 | `NODE_ENV=production` sin `CORS_ALLOWED_ORIGINS` → lanza error | P0 | ⬜ |
| UT-ENV-04 | `NODE_ENV=production` con origins válidos → no lanza | P1 | ⬜ |
| UT-ENV-05 | `port` toma `PORT`; sin `PORT` → default `3000` | P2 | ⬜ |

> `env.js` se evalúa al importar. Para probar variantes: `vi.resetModules()` + reasignar
> `process.env` + `await import("../../../src/config/env.js")` dentro de cada test.

### 6.3 Unitarias — Modelos (schema)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| UT-MOD-USER-01 | Falta `name`/`email`/`password` → `ValidationError` | P1 | ⬜ |
| UT-MOD-USER-02 | `email` duplicado → error de índice `unique` (E11000) | P1 | ⬜ |
| UT-MOD-USER-03 | `email` se normaliza a minúsculas y con `trim` | P2 | ⬜ |
| UT-MOD-USER-04 | `role` por defecto `"customer"`; valor fuera del enum → error | P0 | ⬜ |
| UT-MOD-PROD-01 | Falta `name`/`description`/`price` → `ValidationError` | P1 | ⬜ |
| UT-MOD-PROD-02 | `stock` por defecto `0`; `imageURL` con default placeholder | P2 | ⬜ |
| UT-MOD-CAT-01 | Falta `name` → `ValidationError`; `parentCategory` default `null` | P2 | ⬜ |
| UT-MOD-CART-01 | Falta `user` → `ValidationError` | P1 | ⬜ |
| UT-MOD-CART-02 | `products[].quantity < 1` → `ValidationError` (min:1) | P1 | ⬜ |
| UT-MOD-ORD-01 | Falta `user`/`paymentMethod`/`totalPrice` → `ValidationError` | P1 | ⬜ |
| UT-MOD-ORD-02 | `status` default `"pending"`; fuera del enum → error | P1 | ⬜ |
| UT-MOD-ORD-03 | `paymentStatus` default `"pending"`; fuera del enum → error | P1 | ⬜ |
| UT-MOD-PAY-01 | `type` fuera del enum → `ValidationError` | P1 | ⬜ |
| UT-MOD-PAY-02 | `isDefault` default `false` | P2 | ⬜ |
| UT-MOD-WISH-01 | Falta `user` → `ValidationError` | P2 | ⬜ |
| UT-MOD-ADDR-01 | `postalCode` fuera de rango / `addressType` fuera del enum → error | P2 | ⬜ |

### 6.4 Integración — App y cross-cutting

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-APP-01 | `GET /` → 200 `"API Ecommerce con MongoDB"` | P2 | ⬜ |
| IT-APP-02 | Ruta inexistente → 404 `{error,method,url}` | P1 | ⬜ |
| IT-APP-03 | Origin permitido → cabecera `Access-Control-Allow-Origin` | P1 | ⬜ |
| IT-APP-04 | Origin no permitido → rechazado por CORS | P0 | ⬜ |
| IT-APP-05 | Petición sin `Origin` (curl/tests) → permitida | P2 | ⬜ |
| IT-APP-06 | JSON malformado → no responde 200 ni tumba el proceso | P1 | ⬜ |

### 6.5 Integración — Auth (`/api/auth`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-AUTH-01 | `POST /register` válido → 201, sin `password` en el body | P0 | ✅ |
| IT-AUTH-02 | `POST /register` persiste el hash bcrypt, nunca la contraseña en claro | P0 | ✅ |
| IT-AUTH-03 | `POST /register` con `adminSecret` correcto → `role:"admin"` | P0 | ✅ |
| IT-AUTH-04 | `POST /register` con `adminSecret` incorrecto → `role:"customer"` | P0 | ✅ |
| IT-AUTH-05 | `POST /register` con email duplicado → 400 `"User already exist"` | P1 | ✅ |
| IT-AUTH-06 | `POST /login` válido → 200 con `token` y `refreshToken` | P0 | ✅ |
| IT-AUTH-07 | `POST /login` firma el refresh con `JWT_REFRESH_TOKEN` (no con `JWT_SECRET`) | P0 | ✅ |
| IT-AUTH-08 | `POST /login` usuario inexistente → 400 | P1 | ✅ |
| IT-AUTH-09 | `POST /login` contraseña incorrecta → 400, sin filtrar token | P0 | ✅ |
| IT-AUTH-10 | **`register` SIN `adminSecret` y con `ADMIN_SECRET` sin definir → NO debe crear admin** | P0 | ⬜ 🔒 `K01` |
| IT-AUTH-11 | `register` sin `password` → no crea usuario (hoy `bcrypt.hash(undefined)` lanza → 500) | P1 | ⬜ |

### 6.6 Integración — Products (`/api/products`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-PROD-01 | `GET /products` → 200 array con `category` poblada | P2 | ⬜ |
| IT-PROD-02 | `GET /products/:id` existente → 200 | P2 | ⬜ |
| IT-PROD-03 | `GET /products/:id` inexistente → 404 | P1 | ⬜ |
| IT-PROD-04 | `GET /products/:id` con id no-ObjectId → 422 | P1 | ⬜ |
| IT-PROD-05 | `POST /products` válido → 201 | P1 | ⬜ |
| IT-PROD-06 | `POST /products` sin `name`/`price` → 422 | P1 | ⬜ |
| IT-PROD-07 | `POST /products` con `price` negativo → 422 | P1 | ⬜ |
| IT-PROD-08 | `PUT /products/:id` → 200 con campos actualizados | P2 | ⬜ |
| IT-PROD-09 | `DELETE /products/:id` → 204 sin body | P2 | ⬜ |
| IT-PROD-10 | **`POST/PUT/DELETE /products` sin token → debe ser 401** | P0 | ⬜ 🔒 `K08` |
| IT-SRCH-01 | `?q=` filtra por `name` **o** `description`, case-insensitive | P1 | ⬜ |
| IT-SRCH-02 | `?minPrice`/`?maxPrice` acotan por rango | P1 | ⬜ |
| IT-SRCH-03 | `?inStock=true` → solo `stock>0`; `=false` → solo `stock<=0` | P1 | ⬜ |
| IT-SRCH-04 | `?category=` filtra por categoría | P2 | ⬜ |
| IT-SRCH-05 | `?sort=price&order=desc` ordena descendente | P2 | ⬜ |
| IT-SRCH-06 | Paginación: `page`/`limit` + `hasNext`/`hasPrev`/`totalPages` correctos | P1 | ⬜ |
| IT-SRCH-07 | Sin resultados → 200 con `products:[]` y `totalResults:0` | P2 | ⬜ |
| IT-SRCH-08 | `q` con metacaracteres de regex (`.*`, `(`) no rompe ni filtra de más | P1 | ⬜ |

### 6.7 Integración — Categories (`/api/categories`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-CAT-01 | `GET /categories` → 200 con `parentCategory` poblada | P2 | ⬜ |
| IT-CAT-02 | `GET /categories/:id` inexistente → 404 | P1 | ⬜ |
| IT-CAT-03 | `POST /categories` como admin → 201 | P1 | ⬜ |
| IT-CAT-04 | `POST /categories` sin token → 401 | P0 | ⬜ |
| IT-CAT-05 | `POST /categories` como customer → 403 | P0 | ⬜ |
| IT-CAT-06 | `POST /categories` con nombre duplicado → 409 | P1 | ⬜ |
| IT-CAT-07 | `PUT /categories/:id` como admin → 200 | P2 | ⬜ |
| IT-CAT-08 | `DELETE /categories/:id` como admin → 204 | P2 | ⬜ |
| IT-CAT-09 | `DELETE /categories/:id` como customer → 403 | P0 | ⬜ |

### 6.8 Integración — Users (`/api/users`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-USER-01 | `GET /users` como admin → 200, **ningún** objeto incluye `password` | P0 | ⬜ |
| IT-USER-02 | `GET /users` sin token → 401 | P0 | ⬜ |
| IT-USER-03 | `GET /users` como customer → 403 | P0 | ⬜ |
| IT-USER-04 | `GET /users/:id` autenticado → 200 sin `password` | P0 | ⬜ |
| IT-USER-05 | `GET /users/:id` con id inválido → 422 | P1 | ⬜ |
| IT-USER-06 | `POST /users` como admin → 201 sin `password` | P1 | ⬜ |
| IT-USER-07 | `POST /users` email duplicado → 409 | P1 | ⬜ |
| IT-USER-08 | `POST /users` con `password` corta (<6) → 422 | P1 | ⬜ |
| IT-USER-09 | `POST /users` con `role` fuera del enum → 422 | P1 | ⬜ |
| IT-USER-10 | `PUT /users/:id` re-hashea la contraseña (no la guarda en claro) | P0 | ⬜ |
| IT-USER-11 | **`PUT /users/:id` sin `password` en el body → no debe romper ni borrar la contraseña** | P0 | ⬜ |
| IT-USER-12 | `DELETE /users/:id` como admin → 204 | P2 | ⬜ |

### 6.9 Integración — Cart (`/api/cart`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-CART-01 | `GET /cart` como admin → 200 con `user` y `products.product` poblados | P2 | ⬜ |
| IT-CART-02 | `GET /cart` como customer → 403 | P0 | ⬜ |
| IT-CART-03 | `GET /cart/user/:id` autenticado → 200 | P1 | ⬜ |
| IT-CART-04 | `GET /cart/user/:id` sin carrito → 404 | P2 | ⬜ |
| IT-CART-05 | `POST /cart` válido → 201 con poblados | P1 | ⬜ |
| IT-CART-06 | `POST /cart` con `quantity < 1` → 400 | P1 | ⬜ |
| IT-CART-07 | `PUT /cart/:id` → 200 actualizado | P2 | ⬜ |
| IT-CART-08 | `PUT /cart/:id` inexistente → 404 | P2 | ⬜ |
| IT-CART-09 | `DELETE /cart/:id` → 204 | P2 | ⬜ |
| IT-CART-10 | **`POST /cart` sin `products` → debe ser 400, hoy responde 404** | P2 | ⬜ 🔒 `K09` |
| IT-CART-11 | **`DELETE /cart/:id` inexistente → debe ser 404, hoy responde 400** | P2 | ⬜ 🔒 `K09` |
| IT-CART-12 | **Un customer no debe poder leer/modificar el carrito de otro usuario** | P0 | ⬜ 🔒 nuevo |

### 6.10 Integración — Orders (`/api/orders`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-ORD-01 | `GET /orders` como admin → 200 con poblados | P2 | ⬜ |
| IT-ORD-02 | `GET /orders` como customer → 403 | P0 | ⬜ |
| IT-ORD-03 | `GET /orders/:id` autenticado → 200 | P1 | ⬜ |
| IT-ORD-04 | `GET /orders/:id` inexistente → 404 | P1 | ⬜ |
| IT-ORD-05 | `POST /orders` válido → 201, `status`/`paymentStatus` default `"pending"` | P0 | ⬜ |
| IT-ORD-06 | `POST /orders` sin `paymentMethod`/`totalPrice` → 422 | P1 | ⬜ |
| IT-ORD-07 | `PUT /orders/:id` cambia `status` → 200 | P1 | ⬜ |
| IT-ORD-08 | `PUT /orders/:id` con `status` fuera del enum → 422 | P1 | ⬜ |
| IT-ORD-09 | **`PUT /orders/:id` inexistente → debe ser 404; hoy 204 con body (inválido en HTTP)** | P1 | ⬜ 🔒 `K09` |
| IT-ORD-10 | **Un customer no debe poder leer la orden de otro usuario** | P0 | ⬜ 🔒 nuevo |
| IT-ORD-11 | **`totalPrice` del body no debe aceptarse sin verificar contra el precio real** | P0 | ⬜ 🔒 nuevo |

### 6.11 Integración — Payment Methods (`/api/payment-methods`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-PAY-01 | `GET /payment-methods` como admin → 200 | P2 | ⬜ |
| IT-PAY-02 | `GET /payment-methods` como customer → 403 | P0 | ⬜ |
| IT-PAY-03 | `GET /payment-methods/user/:id` como admin → 200, ordenado `isDefault` primero | P2 | ⬜ |
| IT-PAY-04 | `GET /payment-methods/:id` inexistente → 404 | P1 | ⬜ |
| IT-PAY-05 | `POST /payment-methods` válido → 201 | P1 | ⬜ |
| IT-PAY-06 | `POST /payment-methods` con `type` fuera del enum → 422 | P1 | ⬜ |
| IT-PAY-07 | `POST /payment-methods` con `numCard` duplicado → 409 | P1 | ⬜ |
| IT-PAY-08 | `POST` con `isDefault:true` → desmarca los demás del mismo usuario | P1 | ⬜ |
| IT-PAY-09 | `PUT /payment-methods/:id` con `isDefault:true` → desmarca los demás, no a sí mismo | P1 | ⬜ |
| IT-PAY-10 | **`DELETE /payment-methods/:id` → hoy lanza `ReferenceError: addressId` (500 siempre)** | P0 | ⬜ 🔒 `K05` |
| IT-PAY-11 | **La respuesta no debe exponer `cvv` ni el `numCard` completo** | P0 | ⬜ 🔒 `K10` |
| IT-PAY-12 | **Un customer no debe poder modificar el método de pago de otro usuario** | P0 | ⬜ 🔒 nuevo |

### 6.12 Integración — Wishlist (`/api/wishlist`)

| ID | Caso | Prioridad | Estado |
|----|------|-----------|--------|
| IT-WISH-01 | `GET /wishlist` como admin → 200 | P2 | ⬜ |
| IT-WISH-02 | `GET /wishlist` como customer → 403 | P0 | ⬜ |
| IT-WISH-03 | `GET /wishlist/user/:id` sin wishlist → 404 | P2 | ⬜ |
| IT-WISH-04 | `POST /wishlist` crea la wishlist si no existe → 200 | P1 | ⬜ |
| IT-WISH-05 | `POST /wishlist` producto ya presente → 200 `"Product already in wishlist"`, sin duplicar | P1 | ⬜ |
| IT-WISH-06 | `DELETE /wishlist/:id/product` elimina solo ese producto | P1 | ⬜ |
| IT-WISH-07 | `DELETE /wishlist/:id` → 204 | P2 | ⬜ |
| IT-WISH-08 | **`products` puebla con `ref:"User"`; debería ser `"Product"`** | P1 | ⬜ 🔒 `K06` |

---

## 7. Plan de ejecución por fases

Cada fase es un PR. **Ninguna fase se cierra sin que `npm test` esté en verde** y sin subir
el trinquete de cobertura en `vitest.config.js`.

| Fase | Contenido | IDs | Umbral líneas al cerrar |
|------|-----------|-----|-------------------------|
| **0 — Andamiaje** ✅ | Config, `setup.js`, factories, prueba de concepto Auth + isAdmin | UT-MW-ADM-*, IT-AUTH-01..09 | **32%** (actual) |
| **1 — Seguridad P0** | Resto de middlewares, `env.js`, y todos los 401/403 de cada router | UT-MW-AUTH-*, UT-ENV-*, IT-*-401/403 | 50% |
| **2 — Catálogo** | Products (+ search/paginación), Categories | IT-PROD-*, IT-SRCH-*, IT-CAT-* | 65% |
| **3 — Usuarios y datos** | Users, modelos | IT-USER-*, UT-MOD-* | 75% |
| **4 — Compra** | Cart, Orders, Payment Methods, Wishlist | IT-CART-*, IT-ORD-*, IT-PAY-*, IT-WISH-* | 85% |
| **5 — App y defectos** | Cross-cutting + activar los tests 🔒 al cerrar cada `K0x` | IT-APP-*, todos los 🔒 | 85% + 0 🔒 abiertos |

### Trinquete de cobertura

`vitest.config.js` fija los umbrales en la cobertura **real** medida (Fase 0: 32.22% líneas).
Regla: **los umbrales nunca bajan.** Al cerrar cada fase se suben al nuevo mínimo alcanzado,
de modo que un PR posterior no pueda reducir la cobertura sin fallar el gate.

La cobertura es un **suelo, no un objetivo**: 85% con los casos P0 de seguridad sin cubrir
sería un suite que no vale nada. La columna Prioridad manda sobre el porcentaje.

---

## 8. Casos marcados 🔒 (defecto conocido)

Los casos 🔒 describen el comportamiento **correcto**, no el actual. El código de hoy los
hace fallar. Protocolo:

1. Escribir el test con el assert **correcto**.
2. Marcarlo `it.fails(…)` (Vitest lo exige rojo) o `it.skip(…)` con el `K0x` en la descripción.
3. Al corregir el defecto, quitar la marca. El test pasa a verde y **bloquea la regresión**.

`it.fails()` es preferible a `skip`: si alguien arregla el bug sin quitar la marca, el suite
falla y avisa de que el test ya puede activarse.

| Caso | Issue | Resumen |
|------|-------|---------|
| IT-AUTH-10 | `K01` 🔴 | Sin `ADMIN_SECRET` definido, `undefined === undefined` → todo registro es admin |
| IT-PROD-10 | `K08` 🟠 | Escritura de catálogo sin autenticación |
| IT-PAY-10 | `K05` 🟠 | `deletePaymentMethod` referencia `addressId` inexistente → 500 |
| IT-PAY-11 | `K10` 🟠 | `cvv`/`numCard` en claro y expuestos en respuesta |
| IT-WISH-08 | `K06` 🟠 | `WishList.products` con `ref:"User"` en vez de `"Product"` |
| IT-CART-10/11, IT-ORD-09 | `K09` ⚪ | Códigos HTTP incorrectos (404 por 400, 204 con body) |
| IT-CART-12, IT-ORD-10/11, IT-PAY-12 | nuevo | Sin comprobación de propietario: `authMiddleware` verifica identidad pero ningún controller compara `req.user.userId` con el dueño del recurso |

---

## 9. Seguimiento de progreso

Actualizar esta tabla al cerrar cada PR (fuente de verdad: `npm run test:coverage`).

| Métrica | Fase 0 (2026-07-16) | Objetivo final |
|---------|---------------------|----------------|
| Archivos de test | 2 | ~22 |
| Casos en verde | **12** | ~120 |
| Casos totales en matriz | 12 / **118** | 118 |
| Cobertura líneas | **32.22%** | ≥85% |
| Cobertura statements | **31.96%** | ≥85% |
| Cobertura funciones | **15.38%** | ≥85% |
| Cobertura ramas | **11.49%** | ≥75% |
| Casos 🔒 abiertos | 12 | 0 |

### Evidencia — Fase 0

```
# comando            : resultado
tests                : ✅ 12 passed (2 files) — 5.32s
test:coverage        : ✅ exit 0 — líneas 32.22% / stmts 31.96% / funcs 15.38% / ramas 11.49%
import de server.js  : ✅ OK (no abre puerto, no conecta a Mongo real)
lint / type-check    : n/a (el proyecto no tiene ESLint ni TypeScript configurados)
```

---

## 10. Integración continua

El suite no requiere servicios externos (`mongodb-memory-server` levanta su propio mongod),
así que corre en CI sin dependencias:

```yaml
- run: npm ci
  working-directory: Base_Datos_StyleB
- run: npm run test:coverage
  working-directory: Base_Datos_StyleB
```

Cachear `~/.cache/mongodb-binaries` acelera notablemente los runs. El gate de cobertura ya
hace fallar el job por sí solo (exit 1) si algún umbral retrocede.
