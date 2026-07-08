# CLAUDE.md / AGENTS.md

Guía del repositorio para agentes de IA. Todo lo aquí descrito está tomado del código real del proyecto.

El workspace contiene **dos proyectos independientes** (no hay workspace raíz ni scripts que los unan):

- `Base_Datos_StyleB/` — API REST. Node.js + Express 5 + Mongoose 9. ESM (`"type": "module"`). MongoDB en `mongodb://localhost:27017/StyleBusters`.
- `Style-Busters-main/` — SPA. React 19 + react-router-dom 7 (Create React App / `react-scripts`).

---

## 1. Estructura de directorios (solo `src/`)

### Backend — `Base_Datos_StyleB/src/`

```
src/
├── config/
│   └── db.conf.js
├── controllers/
│   ├── addressController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── paymentMethodController.js
│   ├── productController.js
│   ├── userController.js
│   └── wishlistController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── isAdminMiddleware.js
│   ├── logger.js
│   └── validation.js
├── models/
│   ├── Address.js
│   ├── Cart.js
│   ├── Category.js
│   ├── Order.js
│   ├── PaymentMethod.js
│   ├── Product.js
│   ├── User.js
│   └── WishList.js
└── routes/
    ├── authRoutes.js
    ├── cartRoutes.js
    ├── categoryRoutes.js
    ├── index.js
    ├── orderRoutes.js
    ├── paymentMethodRoutes.js
    ├── productRoutes.js
    ├── userRoutes.js
    └── wishlistRoutes.js
```

(Entrada del servidor: `Base_Datos_StyleB/server.js`, fuera de `src/`.)

### Frontend — `Style-Busters-main/src/`

```
src/
├── App/
│   ├── App.css
│   ├── App.jsx
│   └── index.js
├── Components/
│   ├── BannerCarousel/        (BannerCarousel.jsx + .css)
│   ├── CartView/              (CartView.jsx + .css)
│   ├── Checkout/
│   │   ├── Address/           (AddressForm.jsx, AddressItem.jsx, AddressList.jsx, Address.css)
│   │   ├── PaymentMethods/    (PaymentForm.jsx, PaymentItem.jsx, PaymentList.jsx, Payment.css)
│   │   └── Shared/            (SummarySection.jsx + .css)
│   ├── Common/
│   │   ├── Badge/             (Badge.jsx, Badge.css, index.js)
│   │   ├── Button/            (Button.jsx + .css)
│   │   ├── ErrorMessage/      (ErrorMessage.jsx + .css)
│   │   ├── Icon/              (Icon.jsx + .css)
│   │   ├── Input/             (Input.jsx + .css)
│   │   └── Loading/           (Loading.jsx + .css)
│   ├── ImageCarousel/         (ImageCarousel.jsx + .css)
│   ├── List/                  (List.jsx + .css)
│   ├── LoginForm/             (LoginForm.jsx + .css)
│   ├── ProductCard/           (ProductCard.jsx + .css)
│   ├── ProductDetails/        (ProductDetails.jsx + .css)
│   ├── ProfileCard/           (ProfileCard.jsx + .css)
│   ├── RegisterForm/          (RegisterForm.jsx + .css)
│   └── SearchResultsList/     (SearchResultsList.jsx + .css)
├── Context/
│   ├── AuthContext.jsx
│   └── CartContext.jsx
├── Data/
│   ├── homeImages.json
│   ├── paymentMethods.json
│   ├── products.json
│   ├── shipping-address.json
│   └── users.json
├── Layout/
│   ├── Footer/                (Footer.jsx + .css)
│   ├── Header/                (Header.jsx + .css)
│   ├── Navigation/            (Navigation.jsx + .css)
│   ├── Layout.jsx
│   └── Layout.css
├── Pages/
│   ├── CartPage.jsx + .css
│   ├── CheckoutPage.jsx + .css
│   ├── ConfirmationPage.jsx + .css
│   ├── HomePage.jsx + .css
│   ├── Login.jsx + .css
│   ├── ProductDetailsPage.jsx / ProductDetailPage.css
│   ├── Profile.jsx + .css
│   ├── ProtectedRoute.jsx
│   ├── Register.jsx
│   └── SearchResults.jsx
├── Services/
│   ├── apiClient.js
│   ├── authService.js
│   ├── cartService.js
│   ├── categoryService.js
│   ├── paymentService.js
│   ├── productService.js
│   ├── shippingService.js
│   └── userService.js
├── utils/
│   ├── auth.js
│   └── storageHelpers.js
├── App.test.js
├── index.css
├── index.js
├── logo.svg
├── reportWebVitals.js
└── setupTests.js
```

---

## 2. Mapa de rutas de la API

Todas las rutas se montan bajo el prefijo **`/api`** (`server.js`: `app.use("/api", routes)`).
`authRoutes` se monta bajo `/api/auth`; el resto de routers se montan sin subprefijo adicional en `routes/index.js`.

Leyenda de la columna **Auth**:
- `—` = sin middleware de autenticación.
- `auth` = requiere `authMiddleware` (token JWT Bearer válido).
- `auth + admin` = requiere `authMiddleware` + `isAdminMiddleware` (`role === "admin"`).

### Raíz (`server.js`)

| Método | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/` | — | responde `"API Ecommerce con MongoDB"` |
| (cualquiera) | `*` (no encontrada) | — | 404 `{ error, method, url }` |

### Auth — `authRoutes.js`

| Método | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | `register` |
| POST | `/api/auth/login` | — | `login` |

### Products — `productRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/products/search` | — | — | `searchProducts` |
| GET | `/api/products` | — | — | `getProducts` |
| GET | `/api/products/:id` | — | `productIdValidation` | `getProductById` |
| POST | `/api/products` | — | `createProductValidation` | `createProduct` |
| PUT | `/api/products/:id` | — | `updateProductValidation` | `updateProduct` |
| DELETE | `/api/products/:id` | — | `productIdValidation` | `deleteProduct` |

### Categories — `categoryRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/categories` | — | — | `getCategories` |
| GET | `/api/categories/:id` | — | `categoryIdValidation` | `getCategoryById` |
| POST | `/api/categories` | auth + admin | `createCategoryValidation` | `createCategory` |
| PUT | `/api/categories/:id` | auth + admin | `updateCategoryValidation` | `updateCategory` |
| DELETE | `/api/categories/:id` | auth + admin | `categoryIdValidation` | `deleteCategory` |

### Cart — `cartRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/cart` | auth + admin | — | `getCarts` |
| GET | `/api/cart/:id` | auth + admin | `cartIdValidation` | `getCartById` |
| GET | `/api/cart/user/:id` | auth | `userIdValidation` | `getCartByUser` |
| POST | `/api/cart` | auth | `createCartValidation` | `createCart` |
| PUT | `/api/cart/:id` | auth | `putCartValidation` | `updateCart` |
| DELETE | `/api/cart/:id` | auth | `cartIdValidation` | `deleteCart` |

### Orders — `orderRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/orders` | auth + admin | — | `getOrders` |
| GET | `/api/orders/:id` | auth | `orderIdValidation` | `getOrderById` |
| POST | `/api/orders` | auth | `createOrderValidation` | `createOrder` |
| PUT | `/api/orders/:id` | auth | `updateOrderStatusValidation` | `updateOrderStatus` |

### Payment Methods — `paymentMethodRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/payment-methods` | auth + admin | — | `getPaymentMethods` |
| GET | `/api/payment-methods/user/:id` | auth + admin | `paymentIdValidation` | `getPaymentMethodsByUserId` |
| GET | `/api/payment-methods/:id` | auth + admin | `paymentIdValidation` | `getPaymentMethodById` |
| POST | `/api/payment-methods` | auth | `createPaymentValidation` | `createPaymentMethod` |
| PUT | `/api/payment-methods/:id` | auth | `updatePaymentValidation` | `updatePaymentMethod` |
| DELETE | `/api/payment-methods/:id` | auth | `paymentIdValidation` | `deletePaymentMethod` |

### Users — `userRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/users` | auth + admin | — | `getUsers` |
| GET | `/api/users/:id` | auth | `userIdValidation` | `getUserById` |
| POST | `/api/users` | auth + admin | `createUserValidation` | `createUser` |
| PUT | `/api/users/:id` | auth + admin | `userIdValidation` + `updateUserValidation` | `updateUser` |
| DELETE | `/api/users/:id` | auth + admin | `userIdValidation` | `deleteUser` |

### Wishlist — `wishlistRoutes.js`

| Método | Path | Auth | Validador | Controller |
|--------|------|------|-----------|-----------|
| GET | `/api/wishlist` | auth + admin | — | `getWishlists` |
| GET | `/api/wishlist/user/:id` | auth | `userIdValidation` | `getWishlistByUser` |
| POST | `/api/wishlist` | auth | `addProductValidation` | `addProductToWishlist` |
| DELETE | `/api/wishlist/:id/product` | auth | `removeProductValidation` | `removeProductFromWishlist` |
| DELETE | `/api/wishlist/:id` | auth | `wishlistIdValidation` | `deleteWishlist` |

> `addressController.js` existe con handlers (`getUserAddresses`, `getAddressById`, `createAddress`, `updateAddress`, `deleteAddress`) pero **no tiene archivo de rutas** ni se monta en `routes/index.js`.

---

## 3. Modelos Mongoose

Todos los esquemas se crean con `new mongoose.Schema({...}, { timestamps: true })` y se exportan con `mongoose.model(...)` como `export default`.

### User — `models/User.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| name | String | required, trim |
| email | String | required, unique, trim, lowercase |
| password | String | required |
| role | String | enum `["customer", "admin"]`, default `"customer"` |

### Product — `models/Product.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| name | String | required, trim |
| description | String | required |
| price | Number | required |
| stock | Number | default `0` |
| imageURL | String | required, default `"https://placehold.co/600x400"` |
| category | ObjectId | ref `"Category"` |

### Category — `models/Category.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| name | String | required, trim |
| description | String | — |
| imageURL | String | default `"https://placehold.co/800x600.png"` |
| parentCategory | ObjectId | ref `"Category"`, required `false`, default `null` |

### Cart — `models/Cart.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| user | ObjectId | ref `"User"`, required |
| products | Array | lista de objetos |
| products[].product | ObjectId | ref `"Product"`, required |
| products[].quantity | Number | required, min `1` |

### Order — `models/Order.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| user | ObjectId | ref `"User"`, required |
| products | Array | lista de objetos |
| products[].productId | ObjectId | ref `"Product"`, required |
| products[].quantity | Number | required, min `1` |
| products[].price | Number | required |
| paymentMethod | ObjectId | ref `"PaymentMethod"`, required |
| shippingCost | Number | required, default `0` |
| totalPrice | Number | required |
| status | String | enum `["pending", "processing", "shipped", "delivered", "cancelled"]`, default `"pending"` |
| paymentStatus | String | enum `["pending", "paid", "failed", "refunded"]`, default `"pending"` |

### Address — `models/Address.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| user | ObjectId | ref `"User"`, required |
| address | String | required, trim |
| city | String | required, trim |
| state | String | required, trim |
| postalCode | String | required, min `4`, max `6`, trim |
| country | String | required, trim |
| phone | String | required, max `10`, trim |
| isDefault | Boolean | default `false` |
| addressType | String | enum `["home", "work", "other"]`, default `"home"` |

### PaymentMethod — `models/PaymentMethod.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| user | ObjectId | ref `"User"`, required |
| type | String | required, enum `["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"]` |
| name | String | required, trim |
| numCard | String | required, max `16`, trim |
| dueDate | String | required, trim |
| cvv | String | required, max `3`, trim |
| isDefault | Boolean | default `false` |

### WishList — `models/WishList.js`
| Campo | Tipo | Reglas |
|-------|------|--------|
| user | ObjectId | ref `"User"`, required |
| products | Array de ObjectId | ref `"User"`, required |

---

## 4. Validadores (por nombre)

Definidos con `body` / `param` de `express-validator` dentro de cada archivo de rutas. `authRoutes.js` no define validadores.

| Archivo de rutas | Validadores |
|------------------|-------------|
| `productRoutes.js` | `productIdValidation`, `createProductValidation`, `updateProductValidation` |
| `categoryRoutes.js` | `categoryIdValidation`, `createCategoryValidation`, `updateCategoryValidation` |
| `cartRoutes.js` | `cartIdValidation`, `userIdValidation`, `createCartValidation`, `putCartValidation` |
| `orderRoutes.js` | `orderIdValidation`, `createOrderValidation`, `updateOrderStatusValidation` |
| `paymentMethodRoutes.js` | `paymentIdValidation`, `createPaymentValidation`, `updatePaymentValidation` |
| `userRoutes.js` | `userIdValidation`, `createUserValidation`, `updateUserValidation` |
| `wishlistRoutes.js` | `wishlistIdValidation`, `userIdValidation`, `addProductValidation`, `removeProductValidation` |

---

## 5. Patrón exacto de código

### Backend

**Módulos:** ESM en todo el backend (`import` / `export`, `"type": "module"` en `package.json`). Los imports de archivos locales incluyen la extensión `.js`.

**Modelo** (`models/*.js`):
```js
import mongoose from "mongoose";

const xSchema = new mongoose.Schema(
  { /* campos */ },
  { timestamps: true },
);

const X = mongoose.model("X", xSchema);

export default X;
```

**Controller** (`controllers/*.js`): funciones `async (req, res, next)` con `try/catch`; en el `catch` siempre `next(error)`. Se usan las dos formas indistintamente en el repo — arrow const (`const fn = async (req, res, next) => {}`) y `async function fn(req, res, next) {}`. Exportación nombrada al final con `export { ... }`.
```js
import X from "../models/X.js";

const getX = async (req, res, next) => {
  try {
    const data = await X.find().populate("campoRef");
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export { getX /*, ... */ };
```
- Lectura de parámetros: `const { id } = req.params;` y campos vía `const { ... } = req.body;`.
- Respuestas siempre con `res.status(código).json(...)`; `204` con `res.status(204).send()`.
- No encontrado: `return res.status(404).json({ message: "X not found" })`.
- Relaciones cargadas con `.populate("campo")` / `.populate("campo.subcampo")`.
- Contraseñas hasheadas con `bcrypt` (`saltRounds = 10`), y se excluyen con `.select("-password")` o borrando la propiedad del objeto antes de responder.

**Ruta** (`routes/*.js`):
```js
import express from "express";
import { body, param } from "express-validator";
import { getX, createX } from "../controllers/xController.js";
import validate from "../middlewares/validation.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";

const router = express.Router();

const xIdValidation = [
  param("id").isMongoId().withMessage("X ID must be a valid MongoDB ObjectId"),
];

router.get("/x", authMiddleware, isAdmin, getX);
router.post("/x", authMiddleware, createXValidation, validate, createX);

export default router;
```
- Orden de la cadena de middlewares: `authMiddleware` → `isAdmin` → `[arrays de validación]` → `validate` → `controller`.
- Los arrays de validación se declaran como constantes locales al inicio del archivo.

**Router central** (`routes/index.js`): agrega todos los routers; `authRoutes` va bajo `/auth`, el resto con `router.use(xRoutes)`.

**Middlewares** (`middlewares/*.js`): `export default` de una función.
- `authMiddleware`: lee `req.headers["authorization"]?.split(" ")[1]`, verifica con `jwt.verify(token, process.env.JWT_SECRET)`, asigna `req.user = decoded`. Sin token → `401`; token inválido → `401`.
- `isAdmin`: sin `req.user` → `401`; `req.user.role !== "admin"` → `403`.
- `validate`: usa `validationResult(req)`; si hay errores → `422` con `{ errors: errors.array() }`.
- `errorHandler`: escribe a `logs/error.log` (con `fs.appendFile`) y responde `500` con `{ status: "error", message: "Internal Server Error" }`.
- `logger`: imprime `ISO | método | url` y llama a `next()`.

**Auth (tokens)** en `authController.js`:
- Access token: `jwt.sign({ userId, name, role }, process.env.JWT_SECRET, { expiresIn: "1h" })`.
- Refresh token: `jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN, { expiresIn: "7d" })`.
- Rol admin en registro cuando `adminSecret === process.env.ADMIN_SECRET`.

**Servidor** (`server.js`): `express.json()`, `cors({ origin: "http://localhost:3000", credentials: true })`, `logger`, `errorHandler`, `connectDB()`, rutas bajo `/api`, handler 404 al final, `app.listen(process.env.PORT || 3000)`.

**Config DB** (`config/db.conf.js`): `mongoose.connect("mongodb://localhost:27017/StyleBusters")` (cadena hardcodeada); en error `process.exit(1)`.

**Variables de entorno usadas:** `PORT`, `JWT_SECRET`, `JWT_REFRESH_TOKEN`, `ADMIN_SECRET` (cargadas con `dotenv.config()`).

### Frontend

**Cliente HTTP** (`Services/apiClient.js`): instancia de `axios` con `baseURL: "http://localhost:4000/api"`, `timeout: 10000`, `headers: { "Content-Type": "application/json" }`.
- Interceptor de request: inyecta `Authorization: Bearer <token>` leyendo `localStorage.getItem("authToken")`.
- Interceptor de response: función `classifyError` que mapea el error a `{ kind, status, ... }` (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION`, `SERVER_ERROR`, `CLIENT_ERROR`, `TIMEOUT`, `NETWORK`, `UNKNOWN`) y hace `Promise.reject(classified)`.

**Servicios conectados a la API** (`authService`, `productService`, `cartService`, `categoryService`): funciones `async` que llaman a `apiClient.<método>(...)` y retornan `response.data` (en `authService.login` se retorna un objeto `{ token, refreshToken }` construido desde `response.data`).
```js
import apiClient from "./apiClient.js";

export async function getAllProducts() {
  const response = await apiClient.get("/products");
  return response.data;
}
```

**Servicios mock** (`paymentService`, `shippingService`, `userService`): leen un JSON de `../Data/` y devuelven una `Promise` con `setTimeout` (delay simulado). No usan `apiClient`.
```js
import data from "../Data/x.json";

export function getX() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data || []), 600);
  });
}
```

**Contextos** (`Context/*.jsx`): API de Context de React con Provider + hook (`useAuth`, `useCart`). Persistencia en `localStorage`. `CartContext` combina carrito local y de servidor (`mergeCarts`) y sincroniza con la API (`syncWithApi`). `useCart` lanza error si se usa fuera del provider.

**Utils:**
- `utils/auth.js`: `saveToken` / `getToken` / `clearToken` sobre `localStorage` (clave `"authToken"`), `decodeToken` (parse manual del payload JWT con `atob`), `isTokenExpired`.
- `utils/storageHelpers.js`: `readLocalJSON` / `writeLocalJSON`, `normalizeAddress`, `normalizePayment`, constantes `STORAGE_KEYS`.

**Componentes:** un directorio por componente con `<Nombre>.jsx` + `<Nombre>.css` colocados juntos.

**Enrutado** (`App/App.jsx`): `BrowserRouter` → `AuthProvider` → `CartProvider` → `Layout` → `Routes`. Rutas protegidas envueltas en `<ProtectedRoute>`.

---

## 6. Skills / Guías de referencia

Guías de conocimiento asociadas al proyecto, clasificadas por dominio. Se ubican en `.claude/skills/` (un archivo `.md` por skill). El agente debe consultar la guía correspondiente al tipo de trabajo antes de tocar el código de esa área.

### Backend — `Base_Datos_StyleB/`
| Skill | Archivo | Ámbito |
|-------|---------|--------|
| Node.js Best Practices | `.claude/skills/Node.js Best Practices.md` | Convenciones de Node.js / ESM del backend |
| Express + MongoDB | `.claude/skills/Express + MongoDB.md` | Integración Express 5 + Mongoose |
| MongoDB Patterns | `.claude/skills/MongoDB Patterns.md` | Modelado y consultas Mongoose |
| API Best Practices | `.claude/skills/API Best Practices.md` | Diseño de rutas y respuestas de la API REST |

### Frontend — `Style-Busters-main/`
| Skill | Archivo | Ámbito |
|-------|---------|--------|
| React | `.claude/skills/React.md` | Componentes, hooks y contextos React 19 |
| Frontend Design | `.claude/skills/Frontend Design.md` | UI / estructura de la SPA |

### Transversal (ambos proyectos)
| Skill | Archivo | Ámbito |
|-------|---------|--------|
| Git Workflow | `.claude/skills/Git Workflow.md` | Flujo de ramas y commits |
| Testing Strategies | `.claude/skills/Testing Strategies.md` | Estrategia de pruebas |
| SSDLC | `.claude/skills/SSDLC.md` | Seguridad / ciclo de vida seguro (SSDLC) |

> El contenido real de las 9 guías ya está incorporado en `.claude/skills/` (transcrito a UTF-8). El protocolo `SSDLC.md` es el marco operativo de referencia y él mismo exige leer los `skills` antes de cualquier tarea.

---

## 7. Restricciones para el agente

- **Basar todo cambio en el código real del repositorio.** No inventar rutas, campos, validadores ni comportamiento que no exista en el código.
- **No incluir sugerencias, mejoras, refactors ni "buenas prácticas"** salvo que se pidan explícitamente.
- **No documentar ni listar** trabajo pendiente, deuda técnica, TODOs ni posibles bugs.
- **No reportar** inconsistencias entre archivos como parte de la salida a menos que se pida de forma explícita.
- Al describir la API, los modelos o los validadores, reflejar **exactamente** lo que dice el código, sin normalizar ni "corregir" sobre la marcha.
