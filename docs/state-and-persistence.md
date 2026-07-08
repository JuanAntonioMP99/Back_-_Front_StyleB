# Estado y persistencia — dónde vive cada dato

> Estado actual real (2026-07-07). El objetivo es **backend/MongoDB como fuente de verdad única**; hoy no lo es.

## Mapa por dominio

| Dominio | Backend (API/Mongo) | Frontend hoy usa | Gap |
|---------|:---:|---|---|
| Productos | ✅ | API (`productService`) | — |
| Categorías | ✅ | API (`categoryService`) | Llama a `/categories/:id/products` (endpoint inexistente) |
| Carrito | ✅ | API + `localStorage["cart"]` (merge) | `sync` usa `user.id` que el login falso no provee; `useCart().cart` no existe (es `items`) |
| Autenticación | ✅ (endpoints) | **Login simulado** en `AuthContext` (no toca API) | `authService` y `utils/auth` huérfanos |
| Direcciones | 🟡 modelo sí, **rutas no montadas** | Mock (`shippingService`) + estado en memoria | Sin persistencia real |
| Métodos de pago | 🟡 rutas sí (delete roto) | Mock (`paymentService`) + estado en memoria | Sin persistencia real; datos sensibles |
| Órdenes | ✅ | `localStorage["orders"]` (CheckoutPage) | No se crea orden real |
| Usuarios | ✅ | Mock (`userService` sobre `users.json`) | — |
| Wishlist | 🟡 modelo (ref bug) | **No cableado** (no hay `wishlistService`) | — |

## Claves de `localStorage` en uso

| Clave | Escrita por | Leída por |
|-------|-------------|-----------|
| `authToken` | `utils/auth.saveToken` (hoy nadie la escribe) | `apiClient` (interceptor) |
| `user` | `AuthContext` (login falso) | `AuthContext` |
| `cart` | `CartContext` | `CartContext` |
| `orders` | `CheckoutPage.handleCreateOrder` | (historial de órdenes, hipótesis) |
| `shippingAddresses`, `paymentMethods`, `orders` | `STORAGE_KEYS` en `storageHelpers` | normalizadores (`normalizeAddress/normalizePayment`) |

## Datos mock (JSON en el bundle)

`Style-Busters-main/src/Data/`: `products.json`, `users.json`, `paymentMethods.json`, `shipping-address.json`, `homeImages.json`. Actúan como fuente de datos de los servicios mock. **Objetivo:** reconvertir en *seeds* de MongoDB y retirar de la capa de servicios.

## Estrategia de normalización (resumen)

1. Backend = fuente de verdad para auth, carrito, direcciones, pagos, órdenes, usuarios, wishlist.
2. `localStorage` queda solo como caché de UX (token, carrito de invitado).
3. Migración mock→API por módulo (ver [backlog.md](backlog.md), épica E4).
