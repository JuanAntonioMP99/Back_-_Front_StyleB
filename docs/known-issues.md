# Issues conocidos y gaps — StyleBusters

> Registro de bugs, inconsistencias y deuda detectados en el código real (2026-07-07).
> Severidad: 🔴 Crítico · 🟠 Alto · 🟡 Medio · ⚪ Bajo. Cada item enlaza a su épica en [backlog.md](backlog.md).

## Seguridad

<a id="K01"></a>**K01 🔴 Escalada de privilegios en registro.** `authController.register` calcula `role = adminSecret === process.env.ADMIN_SECRET ? "admin" : "customer"`. El `.env` **no define `ADMIN_SECRET`**, así que es `undefined`; un registro **sin** campo `adminSecret` cumple `undefined === undefined` → **todos los usuarios se crean como `admin`**. → E1/E2.

**K00 🔴 Secretos versionados.** No existe `.gitignore`; `Base_Datos_StyleB/.env` está trackeado (`JWT_SECRET=secret_token`, etc.). Además `node_modules/` (~42k archivos) y `build/` están en git. → E1.

**K10 🟠 Datos sensibles de tarjeta.** `PaymentMethod` guarda `numCard` y `cvv` como String en claro. No debe persistirse CVV; el PAN debe enmascararse/tokenizarse. → E1/E4.

<a id="K21"></a>**K21 🔴 `errorHandler` nunca captura: fuga de stack trace y cero logging.** En `server.js` el `app.use(errorHandler)` está **antes** de montar las rutas (`app.use("/api", routes)`). Express solo enruta errores a un middleware de aridad 4 registrado **después** del código que falla, así que `errorHandler` no se ejecuta para ninguna ruta de `/api`. Consecuencias verificadas forzando una caída de BD contra `GET /api/products`: (1) responde el handler por defecto de Express con `Content-Type: text/html` y el **stack trace completo con rutas absolutas del servidor** en vez de `{status:"error", message:"Internal Server Error"}`; (2) **ningún error llega a `logs/error.log`**, porque quien escribe ese fichero es precisamente `errorHandler`. La corrección es mover `app.use(errorHandler)` al final, después del handler 404. Nota: `errorHandler` está cubierto al 100% por tests unitarios y funciona bien de forma aislada — el defecto es de **cableado**, no de su lógica. Detectado por el plan de pruebas (IT-APP-07). → E1/E3.

## Backend

<a id="K02"></a>**K02 🟠 URI de BD ignora el entorno.** `db.conf.js` hardcodea `mongodb://localhost:27017/StyleBusters` e **ignora** `MONGODB_URI` del `.env` (`ecommerce-db-fusion`). La BD real difiere de la documentada en `.env`. → E3.

**K04 🟠 Dominio Direcciones roto y sin rutas.** `addressController.js` importa `"../models/Address"` sin `.js` (rompe en ESM), `updateAddress` usa `userId` no definido, y **no hay `addressRoutes`** montadas. → E3.

**K05 🟠 `deletePaymentMethod` roto.** Referencia `addressId` (variable inexistente); la ruta falla siempre. → E3.

**K06 🟠 `WishList.products` con `ref` incorrecto.** Apunta a `"User"`, debería ser `"Product"`. → E3.

**K07 🟡 `addProductToCart` roto y sin ruta.** `populate("products.productId")` cuando el campo es `products.product`; además no está expuesto en ninguna ruta. → E3.

**K08 🟠 Escritura de catálogo sin auth.** `POST/PUT/DELETE /products` no exigen autenticación ni rol. → E3.

**K09 ⚪ Códigos HTTP incorrectos.** `createCart` responde 404 en fallo de validación; `updateOrderStatus` responde 204 con body cuando no encuentra. → E3.

<a id="K20"></a>**K20 🟠 `min`/`max` no validan longitud en campos `String`.** En Mongoose `min`/`max` aplican solo a `Number`/`Date`; para cadenas son `minlength`/`maxlength`. Los declaran sobre `String` y por tanto **no validan nada**: `Address.postalCode` (`min:4, max:6`), `Address.phone` (`max:10`), `PaymentMethod.numCard` (`max:16`) y `PaymentMethod.cvv` (`max:3`). Verificado: un `postalCode` de 15 caracteres, un `phone` de 18, un `numCard` de 40 y un `cvv` de 9 se guardan sin error. Agrava [K10](#K10) (el PAN no tiene cota de longitud). Contraste: `Cart.products.quantity` (`min:1` sobre `Number`) sí valida. Detectado por el plan de pruebas (UT-MOD-ADDR-02, UT-MOD-PAY-03). → E3.

**K11 ⚪ Campo `phone` fantasma.** `register` devuelve `phone` y `authService` lo envía, pero `User` no tiene ese campo → se descarta. → E3.

**K12 ⚪ Expiraciones JWT hardcodeadas.** `JWT_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` del `.env` no se usan. → E3.

## Frontend

<a id="K03"></a>**K03 🔴 Login simulado.** `AuthContext.login` valida `password === "123456"` y emite `token: "token-falso-123"`; **no** llama a `authService` ni a `saveToken`. Resultado: `apiClient` nunca envía token válido → rutas protegidas darían 401. → E2.

**K13 🔴 `App.jsx` no compila.** Importa páginas/carpetas con nombres inexistentes (`pages/Cart`, `Home`, `CategoryPage`, `Orders`, `WishList`, `Setttings`, `Product`, `OrderConfirmation`; `context/`, `layout/` en minúscula) frente al árbol real (`CartPage`, `HomePage`, `ConfirmationPage`, `ProductDetailsPage`, `Context/`, `Layout/`). → E5.

**K14 🟠 Checkout desconectado.** `CheckoutPage` usa mocks y guarda la orden en `localStorage["orders"]`; direcciones/pagos son estado en memoria (`_id: Date.now()`). No crea orden real. → E4.

**K15 🟠 `useCart().cart` inexistente.** El contexto expone `items`, pero `CheckoutPage` desestructura `cart` → `cart.length` lanza en runtime. → E4/E5.

**K16 🟡 `login(email)` con aridad incorrecta.** `CheckoutPage.handleLogin` llama `login(email)` sin password; con el login actual siempre falla. → E2.

**K17 ⚪ Inconsistencias menores.** `debugger;` olvidado en `CheckoutPage`; la nota de UI dice contraseña "12345" vs "123456" del `AuthContext`; casing de imports (`../components/`, `../Common/`) inconsistente con carpetas reales. → E5.

**K18 🟡 Endpoint fantasma.** `categoryService.getProductsByCategoryAndChildren` llama `/categories/:id/products`, que no existe en el backend. → E5.

**K19 🟡 Wishlist no cableada.** No existe `wishlistService` ni UI que consuma `/api/wishlist`. → E4.
