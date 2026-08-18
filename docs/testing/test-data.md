# Datos de prueba — StyleBusters

> Estrategia común de datos para los cuatro niveles. Cada suite crea sus datos de
> forma consistente y los limpia entre pruebas; ninguna usa la base de datos de
> desarrollo o producción.

## 1. Backend — factories (`tests/helpers/factories.js`)

Crean documentos **reales** en la Mongo en memoria (`mongodb-memory-server`). Los overrides
permiten a cada test fijar solo el campo que le interesa.

| Factory | Entidad | Defaults / notas |
|---------|---------|------------------|
| `createUser(overrides)` | User | email único (`Date.now`+random), password hasheado con bcrypt, `role:"customer"` |
| `createAdmin(overrides)` | User | `createUser` con `role:"admin"` |
| `createCategory(overrides)` | Category | nombre aleatorio, descripción de prueba |
| `createProduct(overrides)` | Product | `price:100`, `stock:10` |
| `createCart({user,products})` | Cart | crea el user si falta; `products` = líneas `{product, quantity}` |
| `createPaymentMethod({user,...})` | PaymentMethod | `type:"credit_card"`, `numCard` aleatorio (evita el `findOne({numCard})` del controller) |
| `createOrder({user,products,paymentMethod})` | Order | rellena user + un producto + método de pago; `totalPrice:100` |
| `createWishlist({user,products})` | WishList | crea el user si falta |
| `tokenFor(user)` / `authHeader(user)` | JWT | firma `{userId,name,role}` con `JWT_SECRET` de test |
| `expiredTokenFor(user)` | JWT | token válido pero expirado (para el 401) |

**Creación:** `await createX(...)` dentro del test.
**Limpieza:** `tests/setup.js` borra todas las colecciones en `afterEach`; cada archivo usa su
propia BD (`dbName` con UUID) dentro de una única instancia de mongod (`tests/globalSetup.js`).

## 2. Integración frontend — MSW (`src/test/`)

| Recurso | Método de creación | Limpieza |
|---------|--------------------|----------|
| `handlers.js` | Handlers por defecto con la forma real de la API (`/auth/login`, `/auth/register`, `/products`, `/products/search`, `/products/:id`) | `server.resetHandlers()` en `afterEach` |
| `mswServer.js` | `setupServer(...handlers)`; ciclo `listen/close` por archivo de integración | `server.close()` en `afterAll` |
| `token.js` | `makeToken(payload)` — JWT decodificable por `utils/auth`, con `exp` futura por defecto | — |

Casos especiales por id (para forzar caminos de error sin cambiar handlers globales):
`GET /products/missing` → 404, `GET /products/boom` → 500. Overrides puntuales con `server.use(...)`.

## 3. E2E — Cypress (`cypress/`)

| Recurso | Método de creación | Limpieza |
|---------|--------------------|----------|
| `fixtures/users.json`, `fixtures/products.json` | Datos estáticos de referencia | — (estáticos) |
| `utils/testData.js` | Datos derivados / helpers de datos de prueba | — |
| `cy.loginByApi({email,password})` | Login por API real + token en `localStorage`; cacheado con `cy.session` | sesión efímera |
| `cy.getFirstProduct()` | Toma el primer producto del catálogo real sembrado | — |
| `cy.addProductToCart({productId,quantity})` | Agrega al carrito **desde la UI** (valida contador) | — |

Credenciales de test: `cypress.config.js` (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`),
sobreescribibles por env `CYPRESS_*` o `cypress.env.json` (gitignoreado). La BD del backend E2E
es **efímera por arranque** (`scripts/e2e-server.js` fija su propio entorno y nunca usa Atlas).

## 4. Perfiles de datos requeridos por la estrategia

| Perfil | Cómo se obtiene |
|--------|-----------------|
| Usuario válido / admin / sin permisos | `createUser` / `createAdmin` / `createUser` (customer) + `authHeader` |
| Usuario duplicado | crear dos con el mismo `email` (índice `unique`) |
| Producto disponible / agotado | `createProduct({stock:10})` / `createProduct({stock:0})` |
| Carrito con productos | `createCart({user, products:[{product, quantity}]})` |
| Orden válida / con total manipulado | `createOrder(...)` / payload con `totalPrice` distinto (caso rojo `IT-ORD-11`) |
| Método de pago (con/ sin default) | `createPaymentMethod({isDefault:true|false})` |
