# Spec: Servicio frontend de Direcciones conectado a `/api/addresses`

## Metadata
- **Tipo:** feature
- **Complejidad:** XS
- **Fecha:** 2026-08-21
- **Estado:** APROBADO (orchestrator, gate G1)
- **ID de backlog:** F4.2 (`docs/backlog.md`, E4 — "Direcciones front → API · Feature faltante · (K14)")
- **Ejecutor:** subagente frontend-builder

## Historia

Como frontend de `Style-Busters-main`, quiero un servicio `Services/addressService.js` que hable con el dominio de Direcciones ya expuesto y protegido por el backend (`/api/addresses`, 5 rutas self-service, cerrado y mergeado en `develop` — `docs/specs/2026-08-21-bugfix-address-routes-k04.md`, F3.1/K04), siguiendo exactamente el mismo patrón que los servicios ya conectados a la API real (`categoryService.js`, `productService.js`, `cartService.js`: función `async`, llama `apiClient.<método>(...)`, retorna `response.data` o el subcampo correspondiente), para dejar disponible la pieza de infraestructura que un futuro pendiente (fuera de alcance aquí) usará para reemplazar el mock actual de `shippingService.js`/`Data/shipping-address.json` en `CheckoutPage`/`Checkout/Address`.

- **Específica:** confirmar/dejar en el estado correcto el archivo ya escrito (sin trackear) `Style-Busters-main/src/Services/addressService.js`, que exporta `getMyAddresses`, `getDefaultAddress`, `createAddress`, `updateAddress`, `deleteAddress` sobre `apiClient` contra `/addresses`, junto con su test ya escrito (sin trackear) `Style-Busters-main/src/Services/addressService.test.js`. No se conecta ningún componente/página existente a este servicio: `CheckoutPage`/`Checkout/Address` siguen usando `shippingService.js` sin cambios.
- **Medible:** CA-1 a CA-9, verificables por inspección de código contra el contrato real del backend (`addressController.js`/`addressRoutes.js`) y por `npm test` (`Style-Busters-main`, ejecuta `vitest run`).
- **Alcanzable:** 2 archivos ya existen como borrador en el working directory (`addressService.js`, `addressService.test.js`); el trabajo del ejecutor es validarlos línea por línea contra el patrón real del repo y el contrato real del backend, corregir cualquier desviación encontrada, y trackearlos en git. Sin librerías nuevas (axios/vitest ya son dependencias del proyecto).
- **Relevante:** cierra la brecha frontend-backend documentada explícitamente en el spec de cierre de `K04`/`F3.1` ("`Style-Busters-main/src/Services` no tiene ningún `addressService.js` conectado a `/api/addresses` — ya cubierto por `F4.2`") y deja lista la pieza de infraestructura que consumirán `F4.3` (pagos) y `F4.4` (checkout real), sin acoplarse a ellas.
- **Temporal:** complejidad **XS** — 2 archivos, ambos ya redactados como borrador y validados por este spec contra el contrato real del backend y el patrón real de los otros servicios conectados; no hay lógica de UI nueva, no hay componente a modificar, no hay libería nueva.

## Contexto

El backend de Direcciones (`Base_Datos_StyleB/src/controllers/addressController.js` + `routes/addressRoutes.js`) ya está cerrado, en verde y mergeado en `develop` (spec `docs/specs/2026-08-21-bugfix-address-routes-k04.md`, DONE, PR #22): 5 rutas self-service bajo `/api/addresses`, todas con `authMiddleware` (sin `isAdmin`), filtradas siempre por `req.user.userId`. Ese mismo spec de cierre ya deja registrado explícitamente que `Style-Busters-main` no tiene ningún servicio conectado a ese dominio — este pendiente (`F4.2`) es exactamente esa pieza faltante.

Verificación de código real hecha para este spec:

1. **Contrato exacto del backend, releído directamente en `addressController.js`/`addressRoutes.js` (no asumido desde el spec de K04):**
   - `GET /api/addresses` (auth) → `getUserAddresses`: responde `200` con `{ addresses: [...] }` (objeto envuelto, **no** un array plano) — `Address.find({ user: userId }).sort({ isDefault: -1, _id: -1 })`.
   - `GET /api/addresses/:addressId` (auth, `addressId` validado como `isMongoId()`) → `getAddressById`: responde `200` con el documento de dirección **sin envolver**, o `404 { message: "Address not found" }` si no existe o es de otro usuario.
   - `POST /api/addresses` (auth, body validado: `address`/`city`/`state`/`postalCode`/`country`/`phone` requeridos `notEmpty()`, `isDefault` opcional `isBoolean()`, `addressType` opcional `isIn(["home","work","other"])`) → `createAddress`: responde `201` con el documento creado **sin envolver**; ignora cualquier `user` del body (usa `req.user.userId`).
   - `PUT /api/addresses/:addressId` (auth, mismas validaciones de `addressId` + body) → `updateAddress`: responde `200` con el documento actualizado **sin envolver**, o `404` si la dirección no es del usuario.
   - `DELETE /api/addresses/:addressId` (auth, `addressId` validado) → `deleteAddress`: responde `200` con `{ message: "Address deleted successfully" }`, o `404` si no es del usuario.
   - El modelo `Address` (`models/Address.js`) tiene los campos `user`, `address`, `city`, `state`, `postalCode`, `country`, `phone`, `isDefault` (default `false`), `addressType` (enum `["home","work","other"]`, default `"home"`) — **no** tiene campo `name` (el controller lo lee y asigna, pero Mongoose lo descarta en modo `strict`, hallazgo ya documentado en el spec de K04, sin relación con este pendiente).

2. **El borrador `Style-Busters-main/src/Services/addressService.js` (sin trackear) coincide exactamente con ese contrato**, leído función por función:
   - `getMyAddresses()` → `apiClient.get("/addresses")`, retorna `response.data.addresses` — correcto contra `{ addresses: [...] }`.
   - `getDefaultAddress()` → **no hace una llamada HTTP propia**: reutiliza `getMyAddresses()` y calcula en cliente `addresses.find((a) => a.isDefault) || addresses[0] || null` — decisión de diseño, no una llamada a un endpoint del backend que no existe (`GET /addresses/:id/default` no existe en `addressRoutes.js`).
   - `createAddress(address)` → `apiClient.post("/addresses", address)`, retorna `response.data` (documento sin envolver) — correcto.
   - `updateAddress(addressId, address)` → `apiClient.put(\`/addresses/${addressId}\`, address)`, retorna `response.data` — correcto.
   - `deleteAddress(addressId)` → `apiClient.delete(\`/addresses/${addressId}\`)`, retorna `response.data` (`{ message: ... }`) — correcto.
   - **No exporta ningún wrapper para `GET /api/addresses/:addressId`** (obtener una dirección individual por ID). No es un error: hoy ningún caso de uso conocido lo necesita (`getDefaultAddress` deriva de la lista completa, no de una consulta puntual). Se documenta como gap consciente, no como CA a cumplir en este pendiente — ver "Pendientes Abiertos y Gaps Detectados".
   - Ninguna de las 5 funciones envuelve la llamada en `try/catch`: los errores de red/HTTP se propagan como la promesa rechazada, ya clasificada por el interceptor de `apiClient.js` (`classifyError` → `{ kind, status, ... }`). Mismo patrón exacto que `categoryService.js`/`productService.js`/`cartService.js`, ninguno de los cuales atrapa errores tampoco.
   - Import: `import apiClient from "./apiClient";` (sin extensión `.js`). Convive con dos estilos ya presentes en el repo: `categoryService.js`/`productService.js` importan con `.js`; `cartService.js` importa sin extensión, igual que este borrador. Ambos estilos resuelven correctamente bajo el bundler de Create React App (webpack vía `react-scripts`); no se considera una desviación a corregir.

3. **El borrador `Style-Busters-main/src/Services/addressService.test.js` (sin trackear) cubre las 5 funciones exportadas**, con el mismo patrón de mock que `categoryService.test.js` (`vi.mock("./apiClient", ...)` con los 4 métodos HTTP mockeados, `vi.clearAllMocks()` en `beforeEach`): 7 casos — `getMyAddresses`, 3 variantes de `getDefaultAddress` (con default marcado, sin default marcado cayendo al primero, lista vacía → `null`), `createAddress`, `updateAddress`, `deleteAddress`. Verificado que cada aserción de `apiClient.<método>` usa exactamente el path y el payload que la función de producción envía.

4. **`shippingService.js`/`Data/shipping-address.json` (el mock hoy usado por `CheckoutPage`/`Checkout/Address`) tiene una forma de datos distinta a `Address` del backend**, confirmado por lectura directa: el JSON mock usa `name`, `address1`, `address2`, `postalCode`, `city`, `country`, `reference`, `default` (booleano) — sin `state`, sin `phone`, con `address1`/`address2` en vez de `address`, y `default` en vez de `isDefault`. Esto confirma que conectar `CheckoutPage` a `addressService.js` real (fuera de alcance aquí) requerirá un mapeo de forma de datos, no un simple cambio de import — se documenta como hallazgo para el pendiente que sí conecte la UI, sin resolverlo en este spec.

5. **`utils/auth.js` no requiere ningún cambio.** La inyección del `Authorization: Bearer <token>` ya la hace el interceptor de request de `apiClient.js` (`localStorage.getItem("authToken")`), reutilizado automáticamente por las 5 funciones de `addressService.js` sin código adicional.

6. **Ningún archivo del repo importa `addressService.js` hoy** (verificado por búsqueda: solo su propio test lo importa) — confirma que este pendiente no tiene ningún efecto colateral sobre componentes existentes, consistente con el alcance pedido.

## Criterios de Aceptación

- [ ] **CA-1 — `getMyAddresses()` hace `GET /addresses` y retorna el array desenvuelto.** `apiClient.get("/addresses")`; retorna `response.data.addresses` (no `response.data` completo), correcto contra `getUserAddresses` del backend (`res.status(200).json({ addresses })`). Verificable: test con `apiClient.get` mockeado a `{ data: { addresses: [...] } }` → el resultado es el array interno, no el objeto envolvente.

- [ ] **CA-2 — `getDefaultAddress()` no hace una llamada HTTP propia; deriva de `getMyAddresses()`.** Lógica exacta: `addresses.find((a) => a.isDefault) || addresses[0] || null`. Verificable con 3 casos de test: (a) hay una dirección con `isDefault: true` → se retorna esa; (b) ninguna tiene `isDefault: true` → se retorna la primera del array devuelto por el backend (que ya viene ordenado `isDefault: -1, _id: -1` por el controller, así que "la primera" es determinista); (c) el array está vacío → se retorna `null`.

- [ ] **CA-3 — `createAddress(address)` hace `POST /addresses` con el objeto recibido tal cual (sin transformación) y retorna el documento creado sin envolver.** `apiClient.post("/addresses", address)`; retorna `response.data`. El servicio no valida ni transforma los campos del payload (`address`, `city`, `state`, `postalCode`, `country`, `phone`, `isDefault`, `addressType`) antes de enviarlos — la validación de forma es responsabilidad exclusiva del backend (`express-validator` en `addressRoutes.js`), igual que el resto de servicios conectados del repo no duplican validación de negocio en el cliente. Verificable: test con `apiClient.post` mockeado, aserción de que se llamó con `("/addresses", address)` exactamente, y que el resultado es `response.data` sin modificar.

- [ ] **CA-4 — `updateAddress(addressId, address)` hace `PUT /addresses/:addressId` y retorna el documento actualizado sin envolver.** `apiClient.put(\`/addresses/${addressId}\`, address)`; retorna `response.data`. Verificable: test con aserción de `apiClient.put` llamado con `(\`/addresses/${addressId}\`, address)`.

- [ ] **CA-5 — `deleteAddress(addressId)` hace `DELETE /addresses/:addressId` y retorna el `{ message }` del backend.** `apiClient.delete(\`/addresses/${addressId}\`)`; retorna `response.data` (correcto contra `res.status(200).json({ message: "Address deleted successfully" })`, no `res.status(204)` — a diferencia de `deleteCategory`/`deleteProduct` del propio repo, que sí devuelven `204` sin body y por eso sus servicios no retornan nada). Verificable: test con aserción de `apiClient.delete` llamado con el path correcto y que el resultado incluye el `message`.

- [ ] **CA-6 — Ninguna de las 5 funciones atrapa errores; se propagan ya clasificados por `apiClient`.** Ninguna función usa `try/catch`. Ante un rechazo de `apiClient.<método>`, la promesa retornada por la función del servicio se rechaza con el mismo objeto que produce `classifyError` en el interceptor de respuesta (`{ kind, status, ... }`), sin envoltura adicional — mismo comportamiento que `categoryService.js`/`productService.js`/`cartService.js`. Verificable por inspección de código (ausencia de `try/catch` en las 5 funciones) — no requiere test dedicado nuevo, dado que ningún otro servicio del repo lo testea tampoco.

- [ ] **CA-7 — El test `addressService.test.js` cubre las 5 funciones exportadas con mocks de `apiClient`, sin llamadas reales de red.** `vi.mock("./apiClient", ...)` (mismo path relativo que usa `addressService.js`, sin extensión `.js`, consistente con el propio import de producción); `vi.clearAllMocks()` en `beforeEach`. Verificable: `npm test` (dentro de `Style-Busters-main`, ejecuta `vitest run`) pasa, incluyendo los 7 casos de `addressService.test.js`, sin peticiones HTTP reales.

- [ ] **CA-8 — Ambos archivos quedan trackeados en git al cierre del pendiente.** `Style-Busters-main/src/Services/addressService.js` y `Style-Busters-main/src/Services/addressService.test.js` (hoy sin trackear en el working directory) pasan a formar parte del commit de esta rama. Verificable: `git status` no los reporta como `??` tras el commit del ejecutor.

- [ ] **CA-9 — Fuera de alcance, declarado explícitamente.** Ningún componente o página existente (`Pages/CheckoutPage.jsx`, `Components/Checkout/Address/*`, o cualquier otro) se modifica para importar o consumir `addressService.js`. `Services/shippingService.js` y `Data/shipping-address.json` no se tocan. No hay cambios de backend (`Base_Datos_StyleB/`). Verificable: `git diff` del PR resultante toca únicamente `Style-Busters-main/src/Services/addressService.js` y `Style-Busters-main/src/Services/addressService.test.js` (más, si el ejecutor detecta una desviación real contra el contrato del backend durante CA-1 a CA-5, la corrección puntual necesaria en esos mismos 2 archivos — ninguna corrección adicional fuera de ellos).

## Consideraciones de Seguridad

Amenazas STRIDE evaluadas explícitamente, no descartadas por defecto — riesgo nuevo bajo/nulo: este pendiente agrega un cliente HTTP fino (5 funciones de paso directo a `apiClient`) sobre una API que ya está protegida y cuyo control de acceso por dueño ya fue verificado en el spec de backend (`K04`/`F3.1`, DONE).

- **Spoofing:** N/A directo — no se toca `AuthContext`, `ProtectedRoute` ni `utils/auth.js`; la identidad sigue viniendo del JWT ya validado por `authMiddleware` en el backend, inyectado automáticamente por el interceptor de `apiClient.js` sin código nuevo en este servicio.
- **Tampering:** N/A — el servicio no persiste nada en `localStorage`/estado local propio (a diferencia de `CartContext`, que si combina carrito local+servidor); es una función de paso directo, sin caché ni transformación de los datos que devuelve el backend.
- **Repudiation:** N/A — sin logging de auditoría nuevo; el único logging existente (`console.error` en el interceptor de `apiClient.js` ante error) ya es compartido por todos los servicios conectados, sin cambios de este pendiente.
- **Information Disclosure:** N/A nuevo — los datos de dirección (`address`, `city`, `phone`, etc.) que este servicio expone al cliente son exactamente los que el usuario autenticado ya puede ver vía `GET /api/addresses` (self-service, filtrado por `req.user.userId` en el backend, verificado en el spec de K04); este servicio no agrega ningún campo ni endpoint nuevo, solo envuelve llamadas ya autorizadas.
- **Denial of Service:** N/A — sin bucles, timers ni llamadas repetidas; cada función hace exactamente una petición HTTP por invocación (`getDefaultAddress` reutiliza `getMyAddresses`, no agrega una segunda llamada).
- **Elevation of Privilege:** N/A — el backend ya ignora cualquier `user` que el cliente intente enviar en el body de `POST`/`PUT` (usa siempre `req.user.userId`, verificado en `addressController.js`); este servicio no intenta ni podría forzar esa validación, solo pasa el payload que reciba tal cual.
- **Controles de mitigación:** ninguno nuevo requerido — se hereda `authMiddleware` + filtrado por dueño del backend (ya cerrado en K04) y la inyección de token + clasificación de errores ya existente en `apiClient.js`.
- **Inputs que requieren validación:** ninguno en el cliente — la validación de forma (`address`/`city`/`state`/`postalCode`/`country`/`phone` requeridos, `isDefault`/`addressType` opcionales) es responsabilidad exclusiva de `express-validator` en `addressRoutes.js`, ya existente; el frontend no la duplica, mismo criterio ya seguido por el resto de servicios conectados del repo.
- **Secrets involucrados:** ninguno. El token de auth se lee de `localStorage` vía el interceptor ya existente de `apiClient.js`, sin cambios en este pendiente.
- **Superficie de ataque afectada:** ninguna nueva expuesta por HTTP (las 5 rutas de `/api/addresses` ya están montadas y protegidas desde K04); este pendiente solo agrega código de cliente que las consume, sin exponer ningún endpoint ni componente nuevo a un usuario final (nadie importa `addressService.js` todavía, CA-9).

## Dependencias

- **Internas** (`Style-Busters-main/src/` salvo que se indique lo contrario):
  - `Services/addressService.js` — CA-1 a CA-6, CA-8 (archivo objetivo, borrador sin trackear a confirmar).
  - `Services/addressService.test.js` — CA-7, CA-8 (archivo objetivo, borrador sin trackear a confirmar).
  - `Services/apiClient.js` — solo lectura/reutilización (interceptores de auth y `classifyError` ya existentes, sin cambios) — CA-1 a CA-7.
  - `Services/categoryService.js`, `Services/productService.js`, `Services/cartService.js` — solo lectura, patrón de referencia a replicar (función `async`, `apiClient.<método>`, retorno de `response.data`/subcampo, sin `try/catch`) — CA-1 a CA-6.
  - `Services/shippingService.js`, `Data/shipping-address.json` — solo lectura, contexto de lo que este servicio reemplazará en un pendiente futuro (fuera de alcance); no se modifican — CA-9.
  - `utils/auth.js` — solo lectura, confirma que la inyección de token ya la hace `apiClient.js` sin código adicional — sin cambios.
  - `Base_Datos_StyleB/src/controllers/addressController.js`, `Base_Datos_StyleB/src/routes/addressRoutes.js`, `Base_Datos_StyleB/src/models/Address.js` — solo lectura, fuente de verdad del contrato exacto de payload/respuesta — CA-1 a CA-5.
  - `docs/specs/2026-08-21-bugfix-address-routes-k04.md` — spec de backend ya `DONE`, fuente de verdad del cierre del dominio de Direcciones en la API — Contexto.
- **Externas:** ninguna librería nueva. `axios` (ya usado por `apiClient.js`) y `vitest`/`@testing-library` (ya en `devDependencies` de `Style-Busters-main/package.json`) son dependencias existentes.

## Decisiones de Diseño

| Aspecto | Decisión | Justificación |
|---|---|---|
| `getDefaultAddress()` sin llamada HTTP propia | Deriva de `getMyAddresses()` en cliente | No existe un endpoint `GET /addresses/:id/default` en el backend; el controller ya ordena por `isDefault: -1, _id: -1`, así que derivarlo en cliente es correcto y evita una segunda petición innecesaria. |
| No agregar un wrapper para `GET /api/addresses/:addressId` (obtener una dirección individual) | Se deja fuera de este pendiente | Ningún caso de uso conocido hoy lo necesita; agregarlo sin un consumidor real sería alcance no pedido (CLAUDE.md §8: no incluir mejoras no solicitadas). Se documenta como gap consciente, no como omisión accidental. |
| Sin transformación/mapeo de payload en `createAddress`/`updateAddress` | El servicio pasa el objeto recibido tal cual a `apiClient` | Mismo criterio que `categoryService.js`/`productService.js`: la validación de forma es responsabilidad del backend; el servicio es una capa de transporte, no de negocio. El mapeo de forma entre el mock de `shippingService.js`/`Data/shipping-address.json` (que usa `address1`/`address2`/`default`) y el contrato real de `Address` (`address`/`isDefault`) queda para el pendiente que conecte la UI (fuera de alcance aquí), no para este servicio. |
| Import de `apiClient` sin extensión `.js` | Se conserva tal cual el borrador | Coincide con el estilo ya usado en `cartService.js`; ambos estilos (`"./apiClient"` y `"./apiClient.js"`) conviven hoy en el repo y resuelven correctamente bajo `react-scripts`/webpack — no es una desviación que este pendiente deba corregir. |

## Riesgos y Deuda Técnica

- **Sin consumidor real todavía.** Este pendiente deja el servicio listo pero no verificado contra un flujo de UI real (ningún componente lo importa, CA-9); la única verificación posible en este pendiente es vía mocks de `apiClient` (CA-7). El primer consumidor real (fuera de alcance) deberá validar el comportamiento contra el backend real/`mongodb-memory-server`, no solo contra el mock unitario.
- **Mapeo de forma pendiente para el futuro consumidor.** Como se documenta en "Contexto" punto 4, `shippingService.js`/`Data/shipping-address.json` usa una forma de datos distinta a `Address` del backend (`address1`/`address2`/`default` vs. `address`/`isDefault`, sin `state` ni `phone` en el mock). El pendiente que conecte `CheckoutPage`/`Checkout/Address` a `addressService.js` real deberá resolver ese mapeo — no es deuda generada por este spec, es una brecha preexistente que este spec deja documentada para no perderla.
- **Archivos sin trackear al inicio del pendiente.** Ambos archivos objetivo existen hoy como borrador no commiteado; el ejecutor debe confirmarlos (o corregirlos si detecta una desviación real contra CA-1 a CA-7) y trackearlos como parte del cierre (CA-8) — riesgo bajo, ya que ambos fueron validados función por función contra el contrato real del backend en este mismo spec.
- **Campo `name` no persistido en el backend** (ya documentado en el spec de K04, sin relación con este pendiente): `createAddress`/`updateAddress` del backend leen `name` pero el modelo `Address` no lo declara, así que se descarta silenciosamente. Si un futuro consumidor de `addressService.js` envía `name` en el payload, no se perderá información nueva causada por este servicio — es un comportamiento ya existente del backend, ajeno a este pendiente.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** wrapper de `GET /api/addresses/:addressId` (obtener una dirección individual) — no implementado, sin consumidor conocido hoy (ver "Decisiones de Diseño").
- **Comportamientos inconsistentes detectados:** ninguno nuevo — se reconfirma el ya documentado en el spec de K04 (campo `name` no persistido en el modelo `Address`), sin relación con este pendiente.
- **Gaps entre frontend y backend:** forma de datos distinta entre el mock (`shippingService.js`/`Data/shipping-address.json`: `address1`/`address2`/`default`) y el contrato real de `Address` (`address`/`isDefault`, con `state`/`phone` ausentes del mock) — a resolver por el pendiente que conecte la UI a este servicio (fuera de alcance).
- **Persistencia pendiente de migrar:** el propio flujo de Checkout (`CheckoutPage`) sigue usando el mock de direcciones vía `shippingService.js`; migrar ese consumo a `addressService.js` real queda explícitamente fuera de este pendiente.
- **Decisiones aplazadas:** el mapeo de forma de datos para conectar la UI (ver "Riesgos y Deuda Técnica"); el wrapper de `GET /addresses/:addressId`.
- **Trabajo fuera de alcance en esta iteración:** cualquier cambio en `CheckoutPage`/`Checkout/Address`/`shippingService.js`/`Data/shipping-address.json`; cualquier cambio de backend.
- **Riesgos que requieren seguimiento:** ninguno de seguridad nuevo — la superficie protegida ya fue verificada en el spec de backend (K04); este pendiente no expone nada nuevo por HTTP.
- **Items que deben convertirse en backlog:** la conexión real de `CheckoutPage`/`Checkout/Address` a `addressService.js` (incluyendo el mapeo de forma de datos documentado arriba) se propone como candidato a backlog nuevo o como parte explícita del alcance de `F4.4` ("Crear orden real en checkout; historial desde API") — el spec-writer no decide cuál de las dos opciones aplica; queda a criterio del orchestrator.

## Resultados (se completa al cierre)

Pendiente — esta sección la completa el ejecutor (subagente frontend-builder) al cerrar el pendiente, siguiendo la FASE 10 del SSDLC. No se completa en este spec porque el trabajo de implementación/verificación aún no se ha ejecutado (Estado: DRAFT).

## Matriz de cierre

Pendiente — se completa al cierre, junto con `## Resultados`, siguiendo la FASE 10 del SSDLC.
