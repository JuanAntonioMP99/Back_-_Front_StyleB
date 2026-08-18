# Contratos API ↔ Frontend (Fase 8)

> Estrategia de pruebas de contrato entre la API (`Base_Datos_StyleB/`) y la SPA
> (`Style-Busters-main/`), y tabla de endpoints consumidos.

## Estrategia

**Dirigida por el consumidor, sin nueva dependencia.** El frontend depende de la *forma*
(nombres de campo y tipos) de cada respuesta. El contrato se fija en dos puntos que deben
coincidir:

1. **Backend (productor):** los tests de integración (`tests/integration/*.test.js`, supertest)
   ya afirman la forma real que devuelve cada controller (p. ej. `login` → `{token, refreshToken}`;
   `search` → `{products, pagination:{currentPage,totalPages,totalResults,hasNext,hasPrev}}`).
2. **Frontend (consumidor):** `src/Services/contract.test.js` afirma que los servicios entregan
   exactamente los campos que el código de la SPA lee, usando handlers MSW (`src/test/handlers.js`)
   que **modelan esa misma forma real**.

No se introduce Zod/JSON Schema/OpenAPI: para el tamaño del contrato actual, predicados locales
(`isStr`/`isNum` + `toHaveProperty`) son suficientes y evitan una dependencia nueva
(ver restricción del proyecto). Si el contrato crece, se reevalúa migrar a un esquema compartido.

## Tabla de contrato

| Endpoint | Consumidor frontend | Contrato validado | Riesgo |
|----------|---------------------|-------------------|--------|
| `POST /auth/login` | `authService.login` → `AuthContext.login` | ✅ `{ token, refreshToken }` (contract.test + apiClient.integration) | Bajo |
| `POST /auth/register` | `authService.register` → `RegisterForm` | ✅ 201 (apiClient.integration) | Bajo — `phone` se envía pero el modelo no lo tiene (`K11`) |
| `GET /products` | `productService.getAllProducts` → `HomePage`, `SearchResultsList` | ✅ array `{_id,name,price,...}` | Bajo |
| `GET /products/:id` | `productService.getProductById` → `ProductDetailsPage` | ✅ objeto; 404 → `NOT_FOUND` | Bajo |
| `GET /products/search` | `productService.searchProducts` | ✅ `{products, pagination}` | Medio — el FE también filtra en cliente |
| `GET /categories` | `categoryService.getAllCategories` | ⚠️ no cubierto por contract.test (servicio sin test de integración) | Medio |
| `GET /categories/:id/products` | `categoryService.getProductsByCategoryAndChildren` | ❌ **endpoint inexistente en el backend (`K18`)** | **Alto** — llamada que siempre fallará |
| `GET /cart/user/:id` | `cartService.getCartByUser` → `CartContext` | ✅ `{_id, products:[{product,quantity}]}`; 404 → `NOT_FOUND` | Medio |
| `POST /cart` | `cartService.createCart` → `CartContext.syncWithApi` | ✅ `{_id, products}` | Medio |
| `PUT /cart/:id` | `cartService.replaceCart` | ✅ carrito actualizado | Bajo |
| `DELETE /cart/:id` | `cartService.clearCart` | ✅ 204 | Bajo |
| `POST /orders` | `orderService.createOrder` (`buildOrderPayload`) | ✅ `{_id, status, paymentStatus, totalPrice}`; 422 → `VALIDATION` | Medio — `totalPrice` no se verifica en el backend (caso rojo `IT-ORD-11`) |
| `GET /orders/:id` | `orderService.getOrderById` | ✅ `{_id, status}` | Medio — sin owner-check en el backend (`IT-ORD-10`) |

## Riesgos abiertos (enlazados a issues)

- **`K18` (Alto):** `categoryService.getProductsByCategoryAndChildren` llama a
  `/categories/:id/products`, ruta que **no existe** en el backend. Cualquier consumidor de esa
  función recibirá 404. Pendiente: eliminar la función o crear la ruta.
- **`K11` (Bajo):** el registro envía `phone`, pero el modelo `User` no lo define → se descarta.
- **Contratos de escritura de catálogo (`K08`):** hoy `POST/PUT/DELETE /products` no exigen auth;
  el contrato de seguridad está cubierto en rojo en el backend, no en el frontend.
