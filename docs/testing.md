# Estrategia de pruebas — StyleBusters

Guía de las pruebas automatizadas del proyecto: unitarias (Vitest + React Testing
Library) y E2E (Cypress) para la SPA `Style-Busters-main/`, más el runner de
backend efímero que habilita los E2E.

> Contexto importante: la SPA estaba **rota en su estado inicial** (no compilaba).
> Para poder probarla se aplicaron reparaciones funcionales (ver
> [Defectos y reparaciones](#defectos-encontrados-y-reparaciones)). Todo lo aquí
> descrito refleja el estado ya reparado.

---

## 1. Estrategia general

| Nivel | Herramienta | Qué valida | Dónde |
|-------|-------------|------------|-------|
| **Unitario / componente** | Vitest + React Testing Library (jsdom) | Lógica pura, servicios (con `apiClient` mockeado), formularios y contexto, comportamiento observable de componentes | `Style-Busters-main/src/**/*.test.{js,jsx}` |
| **E2E** | Cypress (Electron headless) | Flujos completos en el navegador contra la **API real** + BD efímera | `Style-Busters-main/cypress/e2e/**` |

- **Unitario vs integración vs E2E:** las pruebas unitarias aíslan una unidad
  (mockeando red/o contexto). No hay una capa de "integración" separada en el
  front; el `CheckoutPage.test.jsx` actúa como test de integración ligera
  (varios componentes + servicios mockeados). Los E2E ejercen la pila completa:
  navegador → SPA → API Express → MongoDB efímero.
- **Principio:** se prueba **comportamiento observable** (roles, labels, textos,
  `data-testid`) por encima de detalles internos.

---

## 2. Dependencias instaladas

Frontend (`Style-Busters-main/package.json`, devDependencies):

- `vitest`, `@vitest/coverage-v8`, `jsdom`, `@vitejs/plugin-react`
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (v14), `@testing-library/dom`
- `cypress`, `start-server-and-test`, `cross-env`
- Además se añadió `axios` (faltaba y rompía la compilación).

Backend (`Base_Datos_StyleB`): ya tenía `vitest`, `supertest`,
`mongodb-memory-server` (reutilizados por el runner E2E).

---

## 3. Estructura de carpetas

```
Style-Busters-main/
├── vitest.config.js
├── cypress.config.js
├── cypress.env.json.example        # plantilla (copiar a cypress.env.json, git-ignored)
├── scripts/start-e2e.js            # arranca CRA sin navegador (evita shims rotos)
├── src/
│   ├── test/setup.js               # setup global de Vitest (jest-dom + cleanup + polyfills)
│   ├── utils/auth.test.js
│   ├── Services/{authService,productService,cartService,orderService}.test.js
│   ├── Context/CartContext.test.jsx
│   ├── Components/LoginForm/LoginForm.test.jsx
│   ├── Components/RegisterForm/RegisterForm.test.jsx
│   ├── Components/ProductCard/ProductCard.test.jsx
│   └── Pages/CheckoutPage.test.jsx
└── cypress/
    ├── e2e/
    │   ├── auth/register.cy.js
    │   ├── auth/login.cy.js
    │   └── checkout/checkout.cy.js
    ├── fixtures/{users.json,products.json}
    ├── support/{e2e.js,commands.js}
    └── utils/testData.js

Base_Datos_StyleB/
└── scripts/e2e-server.js           # API real + MongoDB efímero + seed determinista
```

---

## 4. Variables de entorno

Los E2E no llevan secretos hardcodeados. Se configuran vía `cypress.config.js`
(`env`) y pueden sobreescribirse:

| Variable | Default | Uso |
|----------|---------|-----|
| `apiUrl` | `http://localhost:4000/api` | Base de la API para `cy.request` |
| `TEST_USER_EMAIL` | `e2e@styleb.test` | Usuario de prueba sembrado |
| `TEST_USER_PASSWORD` | `Test1234!` | Contraseña del usuario de prueba |

Sobreescritura: variables `CYPRESS_TEST_USER_EMAIL`, `CYPRESS_TEST_USER_PASSWORD`,
`CYPRESS_apiUrl`, o un archivo `cypress.env.json` (git-ignored; copiar desde
`cypress.env.json.example`).

El backend E2E (`e2e-server.js`) fija su propio entorno de test (JWT secrets,
`ADMIN_SECRET`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`) y **nunca** usa la
BD Atlas de producción.

> Nota Windows: la ruta del repo contiene `&` (`Back_&_Front_StyleB`), lo que
> rompe los shims `.cmd` de npm/npx/cypress/vitest. Por eso **todos** los scripts
> invocan los binarios vía `node ./node_modules/...`. No usar `npx`.

---

## 5. Cómo ejecutar

Desde `Style-Busters-main/`:

```bash
# --- Unitarias ---
npm test                 # vitest run (una pasada)
npm run test:watch       # modo watch
npm run test:coverage    # con cobertura (reporte en ./coverage)

# --- E2E ---
# Opción A (todo-en-uno):
npm run e2e:open          # GUI: abre el Test Runner interactivo de Cypress
npm run e2e:ci            # GUI headed: corre en ventana de Chrome (default)
npm run e2e:ci:headless  # sin ventana (para CI Linux / Electron headless)

# Opción B (manual, 3 terminales):
#   1) cd ../Base_Datos_StyleB && npm run e2e:server   # API :4000 + Mongo efímero + seed
#   2) npm run start:e2e                                # CRA :3000 sin navegador
#   3) npm run cypress:open      # GUI interactivo (elige navegador en la UI)
#      npm run test:e2e:headed   # GUI headed (Chrome, ventana visible)
#      npm run test:e2e:headless # sin ventana
```

> Modo GUI: `e2e:open` abre la app de Cypress (eliges Chrome/Edge/Electron y ves
> los tests). `e2e:ci` corre headed en **Chrome** (`--browser chrome --headed`);
> si no tuvieras Chrome, cambia a Edge con `--browser edge`. Chrome y Edge están
> disponibles en el equipo. El modo headed en Chrome además evita el fallo del
> smoke-test de Electron visto en entornos sin GUI.

---

## 6. Datos de prueba: crear, preparar, limpiar

- **Usuario conocido (login/checkout):** lo siembra `e2e-server.js` en cada
  arranque (`e2e@styleb.test` / `Test1234!`, rol `customer`, contraseña hasheada
  con bcrypt).
- **Usuarios nuevos (registro):** se generan únicos por timestamp con
  `makeUniqueUser()` (`cypress-<ts>@example.com`) para evitar colisiones. El flujo
  de registro **nunca** usa una cuenta fija.
- **Productos / inventario:** los siembra `e2e-server.js` (1 categoría, 2 productos
  con stock). Los tests descubren un producto real vía `GET /products`.
- **Limpieza / reinicio entre ejecuciones:** la BD es **efímera** (mongodb-memory-server);
  cada arranque del backend parte de cero y re-siembra. No hay estado residual
  entre corridas, por lo que no se requiere borrado manual de usuarios/órdenes.
- **Aislamiento entre tests:** cada test es independiente; `cy.session()` cachea la
  sesión de login; el registro usa emails únicos.

> Limitación: el backend **no expone** endpoints de limpieza (borrar usuario /
> órdenes). La estrategia elegida (BD efímera por arranque) evita necesitarlos.
> Si se ejecutaran los E2E contra una BD persistente, quedarían datos de prueba.

---

## 7. Comandos personalizados de Cypress

### `cy.loginByApi({ email?, password? })`
Inicia sesión contra `POST /api/auth/login` (sin UI), valida `200`, guarda el
token en `localStorage["authToken"]` (igual que la app) y cachea con
`cy.session()`. No expone la contraseña (`log:false`). Defaults tomados de
`Cypress.env`.

### `cy.addProductToCart({ productId?, quantity? })`
Agrega un producto **desde la UI** (visita `/product/:id`, pulsa "Agregar al
carrito") y verifica que el contador del carrito (`cart-count`) se actualice. Si
no se pasa `productId`, usa el primer producto real del catálogo. Devuelve el
producto para aserciones posteriores.

### `cy.getFirstProduct()`
Devuelve el primer producto real de `GET /products`.

---

## 8. Qué está mockeado y qué es real en el checkout

| Parte | Estado en E2E |
|-------|---------------|
| Login / sesión | **Real** (API + JWT) |
| Catálogo / detalle de producto | **Real** (`GET /products`, `/products/:id`) |
| Carrito | **Real** (estado + persistencia local; sincroniza con `/cart` al estar autenticado) |
| Dirección de envío | **Mock del front** (`shippingService` lee `Data/shipping-address.json`), preseleccionada por defecto |
| Método de pago | **Mock del front** (`paymentService` lee `Data/paymentMethods.json`), preseleccionado por defecto |
| Creación de la orden | **Real** (`POST /api/orders`, respuesta `201`) |

- No existe pasarela de pago externa: **no se realizan cargos reales**. El "pago"
  es la creación de la orden en la API.
- El `paymentMethod` enviado en la orden es el `_id` (formato ObjectId válido) del
  método de pago mock. El backend valida el **formato** del ObjectId pero no
  verifica que el documento exista, por lo que la orden se crea con una referencia
  de pago "colgante". Esto se documenta como deuda (ver defectos).

### Servicios externos que no pueden probarse por completo
- **Pasarela de pago:** no hay integración; el checkout no cobra. Nada que mockear
  a nivel de límite externo.
- **Direcciones/pagos como CRUD real:** el backend tiene endpoints de pago
  (`/payment-methods`) pero el front usa datos mock; el CRUD real de
  direcciones/pagos no está cableado en la UI (fuera del alcance de esta tarea).

---

## 9. Tabla de `data-testid`

| Módulo | Componente | Elemento | `data-testid` | Archivo |
|--------|-----------|----------|---------------|---------|
| Registro | RegisterForm | Campo nombre | `register-name-input` | `src/Components/RegisterForm/RegisterForm.jsx` |
| Registro | RegisterForm | Campo correo | `register-email-input` | idem |
| Registro | RegisterForm | Campo contraseña | `register-password-input` | idem |
| Registro | RegisterForm | Confirmar contraseña | `register-confirm-password-input` | idem |
| Registro | RegisterForm | Botón registro | `register-submit-button` | idem |
| Registro | RegisterForm | Errores de campo | `register-{name,email,password,confirm-password}-error` | idem |
| Login | LoginForm | Campo correo | `login-email-input` | `src/Components/LoginForm/LoginForm.jsx` |
| Login | LoginForm | Campo contraseña | `login-password-input` | idem |
| Login | LoginForm | Botón login | `login-submit-button` | idem |
| Auth | RegisterErrorMessage | Mensaje de error | `form-error-message` | `src/Components/RegisterErrorMessage/RegisterErrorMessage.jsx` |
| Productos | ProductCard | Tarjeta | `product-card-{id}` | `src/Components/ProductCard/ProductCard.jsx` |
| Productos | ProductCard | Agregar al carrito | `product-card-add-button-{id}` | idem |
| Productos | ProductDetails | Detalle | `product-detail` | `src/Components/ProductDetails/ProductDetails.jsx` |
| Productos | ProductDetails | Agregar al carrito | `add-to-cart-button` | idem |
| Carrito | Header | Contador | `cart-count` | `src/Layout/Header/Header.jsx` |
| Carrito | CartView | Ítem | `cart-item-{id}` | `src/Components/CartView/CartView.jsx` |
| Carrito | CartView | Cantidad | `cart-item-quantity-{id}` | idem |
| Carrito | CartView | Aumentar / disminuir | `cart-item-{increase,decrease}-{id}` | idem |
| Carrito | CartView | Eliminar | `cart-item-remove-{id}` | idem |
| Carrito | CartPage | Subtotal | `cart-subtotal` | `src/Pages/CartPage.jsx` |
| Carrito | CartPage | Continuar al checkout | `cart-checkout-button` | idem |
| Checkout | CheckoutPage | Resumen del pedido | `checkout-order-summary` | `src/Pages/CheckoutPage.jsx` |
| Checkout | CheckoutPage | Total | `checkout-total` | idem |
| Checkout | CheckoutPage | Confirmar compra | `checkout-confirm-button` | idem |
| Checkout | CheckoutPage | Error de orden | `checkout-error` | idem |
| Confirmación | ConfirmationPage | Contenedor éxito | `order-success` | `src/Pages/ConfirmationPage.jsx` |
| Confirmación | ConfirmationPage | Número de orden | `order-number` | idem |

---

## 10. Interceptores de red usados

| Alias | Patrón |
|-------|--------|
| `@registerRequest` | `POST **/auth/register` |
| `@loginRequest` | `POST **/auth/login` |
| `@createOrder` | `POST **/api/orders` |

Se evitan interceptores genéricos (`**`); cada alias apunta a un método+ruta.

---

## 11. Errores conocidos / limitaciones de ejecución

- **Cypress no arranca en el entorno sandbox de desarrollo actual** (Windows
  headless): el binario de Electron falla el smoke-test
  (`Cypress.exe: bad option: --smoke-test`). Los specs están completos y son
  ejecutables en un entorno con GUI/CI normal. La ruta crítica del checkout
  (login → producto → `POST /orders` → `201`) se validó a nivel de API.
- Ver [Defectos encontrados y reparaciones](#defectos-encontrados-y-reparaciones).

---

## 12. Defectos encontrados y reparaciones

Reparaciones aplicadas para que la app compile/funcione (autorizadas):
`axios` faltante, imports rotos en `App.jsx` y páginas, módulos inexistentes
(`RegisterErrorMessage`, `ThemeContext`, `Breadcrumb`, `categories.json`),
`index.js` de `Common/Button` e `Input`, `useCart().cart`→`items` en checkout,
checkout ahora crea orden real (`POST /orders`) en vez de `localStorage`,
normalización de casing de imports (crítico para CI en Linux), `Input`/`Button`
ahora reenvían props (`name`, `required`, `data-testid`, `title`), fix de
`updateQuantity(<1)` en el carrito, y `HomePage` tolera el shape array de
`GET /products`.

Defectos de backend NO corregidos (documentados): la respuesta de
`POST /orders` **filtra el hash de contraseña** del usuario populado; `POST /orders`
no verifica que el `paymentMethod` referenciado exista; escalada de privilegios
en registro si `ADMIN_SECRET` no está definido (mitigado sólo en el runner E2E).

---

## 13. CI/CD

Workflow propuesto: `.github/workflows/ci.yml` (dos jobs, Ubuntu):

1. **unit**: instala deps del front, corre `npm run test:coverage` y `npm run build`.
2. **e2e**: instala deps de front y backend, cachea el binario de Cypress y corre
   `npm run e2e:ci` (levanta backend efímero + CRA + Cypress headless). Sube
   `cypress/videos` y `cypress/screenshots` como artefactos si el job falla.

El pipeline **falla** si falla cualquier prueba (no se usa `|| true`).
