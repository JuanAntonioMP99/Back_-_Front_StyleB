# Matriz integral de pruebas — StyleBusters (full stack)

> Trazabilidad **inicial** por escenario y nivel. Generada en la auditoría del 2026-07-30
> sobre el código y las pruebas **reales** del repo. Es el punto de partida de la estrategia
> integral (ver [strategy.md](strategy.md) cuando se cree) y se actualiza al cerrar cada bloque.
>
> Alcance de la auditoría: backend `Base_Datos_StyleB/` + frontend `Style-Busters-main/`.

## Leyenda

**Estado** (valores permitidos): `Implementado` · `En progreso` · `Pendiente` · `Fallando` · `Bloqueado` · `No aplica`.

- `Fallando` incluye los casos escritos a propósito en rojo (`it.fails()`), que documentan un
  defecto conocido `K0x`. En backend Vitest los reporta como *expected fail* (verde global),
  pero desde la óptica del producto **el comportamiento correcto aún no existe**.
- `No aplica` = el escenario no corresponde a ese nivel; se justifica en la columna Notas.
- Los IDs `UT-*`/`IT-*` referencian [docs/test-plans/ecommerce-api-test-plan.md](../test-plans/ecommerce-api-test-plan.md).

## Estado actual medido

| Suite | Archivos | Tests | Resultado | Cobertura líneas |
|-------|----------|-------|-----------|------------------|
| Backend (unit + API integración) — **tras bloque API** (2026-07-30) | 25 | 224 pass + 21 expected-fail (245) | ✅ verde | **78.9 %** |
| Backend — estado inicial de la auditoría | 18 | 151 pass + 10 expected-fail (161) | ✅ verde | 56.47 % |
| Frontend (unit + integración + contrato) — **tras ampliación** (2026-07-30) | 19 | 91 pass | ✅ verde | **47.03 %** |
| Frontend — tras bloque FE inicial (2026-07-30) | 14 | 68 pass | ✅ verde | 38.35 % |
| Frontend — estado inicial de la auditoría | 10 | 48 pass | ✅ verde | 34.5 % |
| E2E Cypress | 3 specs | register / login / checkout | ⚠️ configurado; se ejecuta en CI Linux (no corre en este entorno Windows) | — |

> **Bloque completado (2026-07-30) — Frontend: unit faltante + integración MSW.**
> Nuevos: `ProtectedRoute.test.jsx`, `AuthContext.test.jsx` (unit),
> `apiClient.integration.test.js` y `LoginForm.integration.test.jsx` (integración con **MSW**
> ejerciendo el `apiClient` real). Infra: `src/test/{handlers,mswServer,token}.js` + dep `msw`.
>
> **Ampliación completada (2026-07-30) — más FE + contratos (Fase 8).**
> Integración MSW: `HomePage.integration.test.jsx`, `SearchResultsList.integration.test.jsx`,
> `cartOrder.integration.test.js` (cart/order a nivel de servicio, incl. error al crear orden).
> Unit: `CartPage.test.jsx`. Contrato: `src/Services/contract.test.js` + [contracts.md](contracts.md).
> Handlers MSW ampliados a cart/orders. Trinquete FE subido a 44/36/32/43.

> **Bloque completado (2026-07-30) — API integración por recurso.** Se añadieron
> `tests/integration/{products,categories,users,cart,orders,paymentMethods,wishlist}.test.js`
> (supertest + factories) y se ampliaron las factories con Cart/Order/PaymentMethod/WishList.
> La columna **API integración** pasa a `Implementado` para PROD/CAT/USER/CART/ORD/PAY/WISH.
> Los owner-checks P0 y los defectos `K0x` quedan como tests en rojo (`it.fails`), sin tocar
> la lógica de negocio. Trinquete de cobertura subido a 74/60/80/74 en `vitest.config.js`.

---

## Matriz por escenario

| ID | Módulo | Escenario | Backend unit | API integración | Frontend unit | Frontend integración | E2E | Prioridad | Estado | Notas |
|----|--------|-----------|:---:|:---:|:---:|:---:|:---:|-----------|--------|-------|
| AUTH-001 | Registro | Registro válido → 201 sin password | ✅ `UT-MOD-USER-*` | ✅ `IT-AUTH-01/02/12` | ✅ `RegisterForm.test` | Pendiente | ✅ `register.cy.js` | Crítica | Implementado | Falta FE-integración con red mockeada |
| AUTH-002 | Registro | Email duplicado → error | No aplica | ✅ `IT-AUTH-05` | ✅ `RegisterForm.test` | Pendiente | ✅ `register.cy.js` | Alta | Implementado | Unit BE: cubierto por índice unique `UT-MOD-USER-05` |
| AUTH-003 | Registro | Escalada de privilegios (sin `ADMIN_SECRET` → admin) | ✅ | ✅ rojo `IT-AUTH-10` | No aplica | No aplica | No aplica | Crítica | Fallando | Defecto `K01`; test en rojo protege la corrección |
| AUTH-004 | Login | Login válido → token + refreshToken | No aplica | ✅ `IT-AUTH-06/07` | ✅ `LoginForm.test`, `authService.test` | Pendiente | ✅ `login.cy.js` | Crítica | Implementado | |
| AUTH-005 | Login | Credenciales inválidas → error, sin filtrar token | No aplica | ✅ `IT-AUTH-08/09` | ✅ `LoginForm.test` | Pendiente | ✅ `login.cy.js` | Alta | Implementado | |
| AUTH-006 | Login | Estado de carga / botón deshabilitado | No aplica | No aplica | ✅ `LoginForm.test` | No aplica | Pendiente | Media | Implementado | Comportamiento de UI |
| AUTH-007 | Autorización | Rutas `auth`/`admin` → 401/403 según rol | ✅ `UT-MW-AUTH-*`, `UT-MW-ADM-*` | ✅ `IT-AUTHZ-01..08` | No aplica | No aplica | Pendiente | Crítica | Implementado | Matriz de 14+14 rutas |
| AUTH-008 | Autorización | Ruta protegida redirige a login (SPA) | No aplica | No aplica | Pendiente | Pendiente | Pendiente | Alta | Pendiente | `ProtectedRoute.jsx` sin test |
| AUTH-009 | Sesión | Persistencia de token / logout | No aplica | No aplica | Parcial `utils/auth.test` | Pendiente | Pendiente | Alta | En progreso | `AuthContext` logout sin test directo |
| PROD-001 | Productos | Listado del catálogo | No aplica | Pendiente `IT-PROD-01` | ✅ `productService.test` | Pendiente | ✅ (vía checkout) | Alta | En progreso | BE integración pendiente |
| PROD-002 | Productos | Detalle por id / 404 / id inválido | No aplica | Pendiente `IT-PROD-02..04` | ✅ `productService.test` | Pendiente | Pendiente | Alta | Pendiente | |
| PROD-003 | Productos | Card: precio, imagen, navegación a detalle | No aplica | No aplica | ✅ `ProductCard.test` | Pendiente | Pendiente | Media | Implementado | |
| PROD-004 | Productos | Búsqueda / filtros / paginación | No aplica | Pendiente `IT-SRCH-01..08` | Pendiente | Pendiente | Pendiente | Alta | Pendiente | `searchProducts` sin cobertura |
| PROD-005 | Productos | Escritura de catálogo sin auth → debe ser 401/403 | No aplica | ✅ rojo `IT-PROD-10..13` | No aplica | No aplica | No aplica | Crítica | Fallando | Defecto `K08` |
| CAT-001 | Categorías | Listado / CRUD admin | No aplica | Pendiente `IT-CAT-01..09` | Pendiente | Pendiente | No aplica | Media | Pendiente | `categoryService` sin test |
| CART-001 | Carrito | Agregar producto | ✅ `UT-MOD-CART-*` | Pendiente `IT-CART-05` | ✅ `CartContext.test`, `cartService.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | En progreso | BE integración pendiente |
| CART-002 | Carrito | Cambiar cantidad / eliminar | ✅ `UT-MOD-CART-04` | Pendiente `IT-CART-07/09` | ✅ `CartContext.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | En progreso | |
| CART-003 | Carrito | Cálculo de subtotal/total | No aplica | No aplica | ✅ `CartContext.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | Implementado | |
| CART-004 | Carrito | Cantidad inválida (`<1`) rechazada | ✅ `UT-MOD-CART-04` | Pendiente `IT-CART-06` | Pendiente | No aplica | No aplica | Alta | En progreso | |
| CART-005 | Carrito | Un customer no accede al carrito de otro | No aplica | Pendiente `IT-CART-12` 🔒 | No aplica | No aplica | No aplica | Crítica | Bloqueado | Sin owner-check en controller (nuevo) |
| ORD-001 | Órdenes | Crear orden → 201, estado inicial `pending` | ✅ `UT-MOD-ORD-*` | Pendiente `IT-ORD-05` | ✅ `orderService.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | En progreso | BE integración pendiente |
| ORD-002 | Órdenes | Payload/total inválido → 422 | ✅ `UT-MOD-ORD-01` | Pendiente `IT-ORD-06/08` | Pendiente | Pendiente | Pendiente | Alta | Pendiente | |
| ORD-003 | Órdenes | `totalPrice` no verificado contra precio real | No aplica | Pendiente `IT-ORD-11` 🔒 | No aplica | No aplica | No aplica | Crítica | Bloqueado | Riesgo de dinero (nuevo) |
| ORD-004 | Órdenes | Un customer no lee la orden de otro | No aplica | Pendiente `IT-ORD-10` 🔒 | No aplica | No aplica | No aplica | Crítica | Bloqueado | Sin owner-check (nuevo) |
| ORD-005 | Órdenes | Confirmación / vaciar carrito / no duplicar | No aplica | No aplica | Parcial `CheckoutPage.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | En progreso | Checkout FE usa mocks (`K14`) |
| CHK-001 | Checkout | Validación por paso y navegación | No aplica | No aplica | ✅ `CheckoutPage.test` | Pendiente | ✅ `checkout.cy.js` | Crítica | Implementado | |
| CHK-002 | Checkout | Envío + método de pago | No aplica | Pendiente `IT-PAY-05..09` | Pendiente | Pendiente | ✅ `checkout.cy.js` | Alta | En progreso | Pagos FE son mock (`paymentService`) |
| PAY-001 | Pagos | No exponer `cvv`/`numCard` completo | No aplica | Pendiente `IT-PAY-11` 🔒 | No aplica | No aplica | No aplica | Crítica | Bloqueado | Defecto `K10` |
| PAY-002 | Pagos | `deletePaymentMethod` (hoy 500 por `addressId`) | No aplica | Pendiente `IT-PAY-10` 🔒 | No aplica | No aplica | No aplica | Alta | Bloqueado | Defecto `K05` |
| USER-001 | Usuarios | Listado admin sin filtrar `password` | No aplica | ✅ `IT-USER-01/04/13` | No aplica | No aplica | No aplica | Crítica | Implementado | |
| USER-002 | Usuarios | CRUD admin (crear/actualizar/borrar) | No aplica | Pendiente `IT-USER-05..12` | No aplica | No aplica | No aplica | Media | Pendiente | `PUT` re-hash sin cubrir |
| WISH-001 | Wishlist | Alta/baja de producto | ✅ `UT-MOD-WISH-*` | Pendiente `IT-WISH-01..07` | No aplica | No aplica | No aplica | Baja | En progreso | Sin `wishlistService` FE (`K19`) |
| WISH-002 | Wishlist | `products` referencia a `Product` (no `User`) | ✅ rojo `UT-MOD-WISH-05` | Pendiente `IT-WISH-08` 🔒 | No aplica | No aplica | No aplica | Alta | Fallando | Defecto `K06` |
| APP-001 | App | Ruta raíz / 404 / CORS | No aplica | Parcial `IT-APP-01..07` | No aplica | No aplica | No aplica | Alta | En progreso | Varios `IT-APP` pendientes |
| APP-002 | App | Fallo de BD → JSON sin stack trace | No aplica | ✅ rojo `IT-APP-08/09` | No aplica | No aplica | No aplica | Crítica | Fallando | Defecto `K21` (errorHandler mal cableado) |
| MODEL-001 | Modelos | `min/max` sobre String no validan longitud | ✅ rojo `UT-MOD-PAY-04`, `UT-MOD-ADDR-05` | No aplica | No aplica | No aplica | No aplica | Alta | Fallando | Defecto `K20` |
| CONTRACT-001 | Contratos | Forma de respuestas API ↔ consumo React | ✅ (BE integración) | ✅ (BE integración) | No aplica | ✅ `contract.test.js` | No aplica | Alta | Implementado | Consumer-driven; ver [contracts.md](contracts.md) |

---

## Resumen de huecos priorizado

1. ~~**API integración por recurso (P0/P1)**~~ — ✅ **Completado 2026-07-30.** Products,
   Cart, Orders, Categories, Users, Payment Methods, Wishlist cubiertos con supertest.
2. **Owner-checks (P0, nuevos):** `CART-005`, `ORD-003`, `ORD-004`, `PAY-*` — ya hay
   **tests en rojo** que documentan el comportamiento correcto (`IT-CART-12`, `IT-ORD-10/11`,
   `IT-PAY-12`); pendiente la **corrección del código** (fuera de este bloque por decisión: solo pruebas en rojo).
3. **Frontend integración (P1):** ✅ **Ampliado 2026-07-30** con MSW — login E2E, productos
   (404/500/token), `HomePage`/`SearchResultsList`, y cart/order a nivel de servicio (incl.
   error al crear orden). Pendiente (opcional): checkout de página completo (bloqueado por `K14`).
4. **Frontend unit — cobertura de páginas/contexto:** ✅ `ProtectedRoute`, `AuthContext` y
   `CartPage` cubiertos. Pendiente (opcional): `ConfirmationPage`, `Profile`.
5. **Contratos FE↔BE (P1):** ✅ **Completado 2026-07-30** — estrategia dirigida por el
   consumidor sin nueva dependencia; `contract.test.js` + [contracts.md](contracts.md) con la
   tabla endpoint→consumidor→contrato→riesgo (flag `K18` endpoint fantasma).
6. **Infra:** ✅ **Completado 2026-07-30.** CI con job **backend** (coverage + trinquete),
   artefactos de cobertura, y E2E gated (`needs: [backend, frontend-unit]`). Docs de estrategia
   creadas: `strategy.md`, `test-data.md`, `running-tests.md` (known-issues ya existía).
7. **Defectos conocidos en rojo:** `K01/K05/K06/K08/K10/K20/K21` + `IT-USER-11` documentados con test que fallará hasta corregir el código.
