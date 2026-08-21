# Spec: Dominio de Direcciones roto y sin rutas (K04)

## Metadata
- **Tipo:** bugfix
- **Complejidad:** S
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** F3.1 (K04)
- **Ejecutor:** subagente backend-builder

## Historia

Como backend de `Base_Datos_StyleB`, quiero que el dominio de Direcciones (`addressController.js` + `addressRoutes.js`) quede correctamente importado y montado bajo `/api/addresses`, para que un usuario autenticado pueda gestionar (listar, ver, crear, editar, borrar) únicamente sus propias direcciones de envío, cerrando el known-issue `K04` (`docs/known-issues.md`) y el pendiente `F3.1` (`docs/backlog.md`, E3 — "Direcciones: `import ...Address.js`, corregir `userId`, crear y montar `addressRoutes` · Bug · (K04)").

- **Específica:** corregir el import sin extensión de `Base_Datos_StyleB/src/controllers/addressController.js` (línea 1), finalizar y confirmar `Base_Datos_StyleB/src/routes/addressRoutes.js` (existe ya un borrador sin trackear en el working directory) con las 5 rutas self-service bajo `/api/addresses`, montarlo en `Base_Datos_StyleB/src/routes/index.js`, agregar el factory `createAddress` que falta en `Base_Datos_StyleB/tests/helpers/factories.js`, y dejar en verde el test de integración ya redactado (`Base_Datos_StyleB/tests/integration/address.test.js`, también sin trackear). No se toca ningún otro controller, ruta, modelo o componente de frontend.
- **Medible:** CA-1 a CA-9, verificables por inspección de código y por `npm run test:integration` (`Base_Datos_StyleB`).
- **Alcanzable:** 4 archivos a tocar/crear (`addressController.js`: 1 línea; `addressRoutes.js`: ya hay borrador a confirmar; `routes/index.js`: 2 líneas; `factories.js`: +1 función), sin librerías nuevas, reutilizando exactamente el patrón de middlewares/validación ya usado en `cartRoutes.js`/`categoryRoutes.js`/`userRoutes.js`.
- **Relevante:** cierra un dominio completo (Direcciones) que hoy es inalcanzable por API — `addressController.js` no está montado en ningún router (confirmado leyendo `routes/index.js`, que no lo importa) — y corrige un bug de ESM que rompe en runtime real de Node aunque hoy pase desapercibido bajo mocks de test.
- **Temporal:** complejidad **S** — el modelo (`Address.js`) y los 5 handlers del controller ya existen y son correctos (el bug histórico de `userId` en `updateAddress` ya fue corregido en el commit `cad54965`, ya en `develop`); el trabajo restante es cablear piezas ya escritas (import, ruta, montaje, factory de test), no diseñar nada nuevo.

## Contexto

El dominio de Direcciones fue construido (modelo + controller) pero nunca terminó de integrarse en la API. Causa raíz, verificada leyendo el código real:

1. **Import ESM sin extensión.** `addressController.js` línea 1: `import Address from "../models/Address";`. Bajo ESM estricto (`"type": "module"` en `Base_Datos_StyleB/package.json`, ver CLAUDE.md §5, que exige extensión `.js` en todos los imports locales), esto lanza `ERR_MODULE_NOT_FOUND` en cuanto Node real intente resolver el módulo. Hoy pasa desapercibido porque nada importa `addressController.js` a través de la cadena real de módulos: el único test que lo ejercita hoy, `Base_Datos_StyleB/tests/unit/controllers/addressController.test.js` (sin trackear), usa `vi.mock("../../../src/models/Address.js", ...)` — Vitest/Vite resuelve el mock por la ruta absoluta en disco, sin pasar por la resolución estricta de especificadores de Node, así que el mock intercepta igual aunque el import original carezca de extensión. En cuanto el controller se alcance por una cadena de imports real (rutas reales bajo `server.js`, como exige este pendiente), el bug se manifiesta.
2. **Sin rutas montadas.** Nunca se creó `addressRoutes.js` en el árbol trackeado del repo, y `routes/index.js` no importa ni monta ningún router de direcciones. Aunque el import estuviera corregido, el controller seguiría siendo inalcanzable por HTTP.

El bug histórico mencionado en `K04` ("corregir `userId`") **ya fue corregido** en un PR anterior (commit `cad54965`, ya en `develop`): verificado releyendo el archivo actual, los 3 handlers de escritura (`createAddress`, `updateAddress`, `deleteAddress`) usan de forma consistente `const user = req.user.userId;` / `const userId = req.user.userId;`. No forma parte del trabajo de este spec.

Ya existen en el working directory (sin trackear) dos piezas de un intento previo no commiteado, que este pendiente debe confirmar/terminar de integrar, no asumir como correctas sin más:

- `Base_Datos_StyleB/src/routes/addressRoutes.js` — borrador con las 5 rutas. Validado línea por línea contra el patrón real de `cartRoutes.js`/`categoryRoutes.js`/`userRoutes.js`: usa `authMiddleware` sin `isAdmin` (correcto para self-service, ya que el controller filtra siempre por `req.user.userId`), valida `addressId` como `param(...).isMongoId()`, y valida el body con `express-validator` (`address`, `city`, `state`, `postalCode`, `country`, `phone` como `notEmpty()`; `isDefault` opcional `isBoolean()`; `addressType` opcional `isIn(["home","work","other"])`). El orden de middlewares (`authMiddleware → [validaciones] → validate → controller`) coincide con el patrón del resto del repo.
- `Base_Datos_StyleB/tests/integration/address.test.js` — 13 casos (`IT-ADDR-01` a `IT-ADDR-13`) que cubren self-service, 401 sin token, 404 de direcciones ajenas, y que `POST` ignora un `user` distinto en el body. Este archivo importa `createAddress` desde `tests/helpers/factories.js`, factory que **no existe hoy** en ese archivo (verificado leyendo `factories.js` completo: exporta `createUser`, `createAdmin`, `createCategory`, `createProduct`, `createCart`, `createPaymentMethod`, `createOrder`, `createWishlist`, `tokenFor`, `authHeader`, `expiredTokenFor` — ninguno es `createAddress`). Sin ese factory, el archivo de test no puede ejecutarse.

## Criterios de Aceptación

- [x] **CA-1 — Import corregido en `addressController.js`.** La línea 1 pasa de `import Address from "../models/Address";` a `import Address from "../models/Address.js";`. Verificable: `grep` de la ruta con extensión `.js` en el archivo; y, en un test de integración real (que importa `app` desde `server.js`, sin mocks de módulo) que ejercite cualquier ruta de `/api/addresses`, la cadena `server.js → routes/index.js → addressRoutes.js → addressController.js → models/Address.js` se importa sin `ERR_MODULE_NOT_FOUND`.

- [x] **CA-2 — `GET /api/addresses` y `GET /api/addresses/:addressId` montadas con `authMiddleware` (sin `isAdmin`).** `addressRoutes.js` expone:
  ```js
  router.get("/addresses", authMiddleware, getUserAddresses);
  router.get("/addresses/:addressId", authMiddleware, addressIdValidation, validate, getAddressById);
  ```
  con `addressIdValidation = [param("addressId").isMongoId().withMessage(...)]`. Verificable: sin token → `401`; con token válido de cualquier usuario y `addressId` con formato no-ObjectId → `422`.

- [x] **CA-3 — `POST /api/addresses` valida el body y liga la dirección a `req.user.userId`, ignorando cualquier `user` del body.** `createAddressValidation` exige `address`, `city`, `state`, `postalCode`, `country`, `phone` (`notEmpty()`), y valida `isDefault` (opcional, `isBoolean()`) y `addressType` (opcional, `isIn(["home","work","other"])`). Verificable: falta alguno de los 6 campos requeridos → `422`; body válido → `201` con `res.body.user === req.user.userId` del token, incluso si el body incluye un `user` distinto (el controller usa `const user = req.user.userId;`, línea 47, y nunca lee `req.body.user`).

- [x] **CA-4 — `PUT /api/addresses/:addressId` valida `addressId` + body y solo permite editar direcciones propias.** `updateAddressValidation = [...addressIdValidation, ...addressBodyValidation]`. Verificable: `addressId` de una dirección de otro usuario → `404` (el controller filtra `Address.findOne({ _id: addressId, user })`); `addressId` de una dirección propia con body válido → `200` con los campos actualizados en la respuesta.

- [x] **CA-5 — `DELETE /api/addresses/:addressId` solo permite borrar direcciones propias.** Verificable: `addressId` de otro usuario → `404`, sin borrar el documento (`Address.findById` posterior sigue encontrándolo); `addressId` propio → `200` y el documento deja de existir.

- [x] **CA-6 — Las 5 rutas quedan montadas bajo `/api/addresses`, sin subprefijo adicional en `routes/index.js` (mismo patrón que `cartRoutes`/`userRoutes`).** `routes/index.js` agrega `import addressRoutes from "./addressRoutes.js";` y `router.use(addressRoutes);`. Verificable: `grep` de ambas líneas en `routes/index.js`; una petición real a cualquiera de las 5 rutas ya no cae en el handler 404 catch-all de `server.js` (`{ error, method, url }`).

- [x] **CA-7 — Test de regresión reproduce el bug de import bajo resolución real de módulos (no mock).** Al menos un test de integración (`tests/integration/address.test.js`, que importa `app` real desde `server.js` y no mockea `models/Address.js`) ejercita `/api/addresses`. La prueba de regresión es el propio arranque bajo Node real: si el import de `addressController.js` volviera a carecer de `.js`, toda la suite de `tests/integration/*.test.js` fallaría en la fase de colección (ESM estricto), no en una aserción aislada. Verificable: `npm run test:integration` pasa completo con el fix aplicado; revirtiendo manualmente la extensión del import, la misma suite falla al arrancar.

- [x] **CA-8 — La suite de integración cubre el comportamiento self-service esperado.** Sin duplicar lo ya redactado en `tests/integration/address.test.js` (`IT-ADDR-01` a `IT-ADDR-13`), como mínimo pasan en verde bajo `npm run test:integration`: (a) `401` sin token en las 5 rutas; (b) `404` al leer/editar/borrar una dirección de otro usuario (protege contra acceso cruzado entre usuarios); (c) `POST` ignora cualquier `user` del body; (d) `isDefault: true` desmarca las demás direcciones del mismo usuario tanto en `POST` como en `PUT`.

- [x] **CA-9 — `tests/helpers/factories.js` agrega el factory `createAddress`.** Siguiendo el mismo patrón que `createPaymentMethod`/`createOrder` (crea un `user` propio con `createUser()` si no se pasa uno, rellena los campos requeridos del schema de `Address` con valores válidos por defecto, acepta `overrides`). Verificable: `tests/integration/address.test.js`, que importa `createAddress` desde `../helpers/factories.js`, no falla por `TypeError: createAddress is not a function`.

## Consideraciones de Seguridad

- **Spoofing:** sin cambios — depende de `authMiddleware` ya existente (verificación de firma/expiración de JWT), reutilizado tal cual en las 5 rutas.
- **Tampering:** aplica y ya está mitigado en el código existente del controller. Sin el filtro por `user`, un usuario autenticado podría intentar editar/borrar direcciones ajenas pasando un `addressId` que no le pertenece; `updateAddress` y `deleteAddress` ya usan `Address.findOne({ _id: addressId, user })` antes de mutar, así que el control ya existe — este pendiente solo expone las rutas (hoy inalcanzables porque no están montadas) sobre un controller cuyo filtrado por dueño ya estaba correcto.
- **Repudiation:** sin cambios — mismo `logger` (`ISO | método | url`, sin identidad) que el resto del repo, sin logging de auditoría nuevo.
- **Information Disclosure — amenaza principal a verificar con test.** Al montar `GET /api/addresses/:addressId`, otro usuario podría intentar leer una dirección ajena por su ID; el controller responde `404` genérico tanto si el ID no existe como si existe pero es de otro dueño (no revela la diferencia), mismo patrón `findOne({_id, user})` + `404` uniforme que el resto de recursos self-service del repo. Control verificado por CA-4/CA-5/CA-8(b) e `IT-ADDR-04`/`IT-ADDR-10`/`IT-ADDR-12`.
- **Denial of Service:** sin cambio material — 5 rutas con validación de un puñado de campos string/booleanos/enum, mismo costo que el resto de rutas `express-validator` del repo.
- **Elevation of Privilege:** aplica de forma leve y ya está mitigado. El body de `POST /api/addresses` podría incluir un `user` distinto al del token; el controller ya lo ignora (usa `req.user.userId`, nunca `req.body.user`), así que un usuario no puede crear una dirección "a nombre de" otro. Cubierto por CA-3 e `IT-ADDR-06`.
- **Controles de mitigación:** `authMiddleware` en las 5 rutas; filtrado por `user: req.user.userId` en las 4 queries del controller (`find`, `findOne` ×3); `express-validator` (`isMongoId()`, `notEmpty()`, `isBoolean()`, `isIn()`) antes de llegar al controller.
- **Inputs que requieren validación:** `req.headers["authorization"]` (ya validado por `authMiddleware`, sin cambios); `req.params.addressId` (CA-2, CA-4, CA-5); `req.body.{address,city,state,postalCode,country,phone,isDefault,addressType}` (CA-3, CA-4).
- **Secrets involucrados:** ninguno nuevo. `JWT_SECRET` ya se usa en `authMiddleware`, sin cambios en este pendiente.
- **Superficie de ataque afectada:** `GET/POST/PUT/DELETE /api/addresses*` — pasa de superficie inexistente (rutas no montadas) a superficie protegida por `auth` self-service.

## Dependencias

- **Internas** (todas en `Base_Datos_StyleB/` salvo que se indique):
  - `src/controllers/addressController.js` — CA-1 (código de producción, ya existente, solo se corrige el import).
  - `src/routes/addressRoutes.js` — CA-2 a CA-6 (archivo sin trackear a confirmar/finalizar; contenido ya validado contra el patrón del repo en "Contexto").
  - `src/routes/index.js` — CA-6.
  - `src/models/Address.js` — solo lectura, sin cambios (campos: `user`, `address`, `city`, `state`, `postalCode`, `country`, `phone`, `isDefault`, `addressType`).
  - `src/middlewares/authMiddleware.js`, `src/middlewares/validation.js` — solo lectura/reutilización, sin cambios.
  - `src/routes/cartRoutes.js`, `src/routes/categoryRoutes.js`, `src/routes/userRoutes.js` — solo lectura de referencia, patrón exacto a replicar.
  - `tests/integration/address.test.js` — CA-7, CA-8 (archivo sin trackear, a verificar en verde; no requiere reescritura si el fix + montaje son correctos).
  - `tests/unit/controllers/addressController.test.js` — solo lectura de referencia (archivo sin trackear, ya mockea `models/Address.js` con extensión `.js`; no requiere cambios).
  - `tests/helpers/factories.js` — CA-9.
- **Externas:** ninguna librería nueva. `express-validator` y `jsonwebtoken` ya son dependencias directas del backend, usadas exactamente en los mismos patrones que este pendiente reutiliza.
- **Cruzadas:** ninguna hacia el frontend (`Style-Busters-main/`) en este pendiente — `F4.2` ("Direcciones front → API", `docs/backlog.md`, E4) es un pendiente distinto, ya registrado, fuera de alcance aquí.

## Decisiones de Diseño

| Aspecto | Decisión | Justificación |
|---|---|---|
| Reutilizar el borrador sin trackear de `addressRoutes.js` en vez de reescribirlo | Sí, tras validarlo línea por línea contra `cartRoutes.js`/`categoryRoutes.js`/`userRoutes.js` | El borrador ya sigue el patrón exacto del repo (orden de middlewares, forma de validadores); reescribirlo desde cero no aporta valor y arriesga introducir una desviación. |
| Sin `isAdmin` en ninguna de las 5 rutas | Self-service puro | El controller ya filtra siempre por `req.user.userId` en las 4 queries (`find`/`findOne` ×3); exigir rol admin no aporta control adicional y rompería el caso de uso real (un cliente gestionando sus propias direcciones). |
| Nombre de parámetro de ruta `:addressId` (no `:id`, a diferencia de la mayoría de rutas del repo) | Se conserva `addressId` | El controller ya existente lee `req.params.addressId` en sus 3 handlers (`getAddressById`, `updateAddress`, `deleteAddress`); renombrarlo a `:id` obligaría a tocar el controller sin necesidad, ampliando el alcance de K04 más allá del import y del montaje de rutas. |

## Riesgos y Deuda Técnica

- **Campo `name` no persistido (hallazgo nuevo, fuera de alcance de K04).** `createAddress` y `updateAddress` leen `name` de `req.body` y lo asignan al documento (`newAddress = new Address({..., name, ...})`; `shipAddress.name = name`), pero el schema de `Address` (`models/Address.js`) no define ningún campo `name`. Bajo el modo `strict` por defecto de Mongoose, ese valor se descarta silenciosamente al guardar (no lanza error, simplemente no persiste). No rompe ningún CA de este spec ni está mencionado en `K04`/`F3.1`; se documenta aquí para no perderlo. No se corrige en este pendiente — el orchestrator puede evaluar si amerita una entrada nueva de backlog.
- **`K20` (ya registrado en `docs/known-issues.md`), sin relación con este pendiente.** `Address.postalCode` (`min:4,max:6`) y `Address.phone` (`max:10`) no validan longitud porque `min`/`max` no aplican a `String` en Mongoose (son `minlength`/`maxlength`). Se menciona solo para dejar explícito que este spec no lo resuelve.
- **Fallback `country || "México"` en `createAddress`, código parcialmente muerto.** El validador (CA-3) exige `country` como `notEmpty()`, así que ese fallback nunca se ejecuta bajo las rutas validadas de este spec. Preexistente en el controller, fuera de alcance.
- **Sin backlog nuevo generado por este spec.** Los 3 puntos anteriores son hallazgos a documentar, no defectos que bloqueen el cierre de `K04`/`F3.1`.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** `F4.2` ("Direcciones front → API", `docs/backlog.md`, E4) sigue pendiente — fuera de alcance de este spec, ya registrado en el backlog.
- **Comportamientos inconsistentes detectados:** el campo `name` no persistido (ver "Riesgos y Deuda Técnica").
- **Gaps entre frontend y backend:** `Style-Busters-main/src/Services` no tiene ningún `addressService.js` conectado a `/api/addresses` — ya cubierto por `F4.2`, sin backlog nuevo.
- **Persistencia pendiente de migrar:** ninguna.
- **Decisiones aplazadas:** el campo `name` no persistido y `K20` quedan explícitamente fuera de este pendiente.
- **Trabajo fuera de alcance en esta iteración:** cualquier cambio en frontend; `K20`; el campo `name` no persistido; renombrar `:addressId` a `:id`.
- **Riesgos que requieren seguimiento:** ninguno de seguridad nuevo — el control de acceso por dueño ya existe en el controller y este pendiente solo lo expone por HTTP.
- **Items que deben convertirse en backlog:** el hallazgo del campo `name` no persistido se deja como propuesta a evaluar por el orchestrator (no es potestad del spec-writer decidir si se convierte en backlog nuevo).

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21.
- **CAs cumplidos:** CA-1 a CA-9 (9/9), verificados de nuevo contra `develop` tras el merge del PR #22 (no solo por lectura del spec):
  - CA-1: `Base_Datos_StyleB/src/controllers/addressController.js` línea 1 es `import Address from "../models/Address.js";` — sin extensión faltante.
  - CA-2 a CA-6: `Base_Datos_StyleB/src/routes/addressRoutes.js` monta las 5 rutas bajo `/api/addresses` con `authMiddleware` (sin `isAdmin`), `addressIdValidation`/`addressBodyValidation` como se describía; `Base_Datos_StyleB/src/routes/index.js` importa y monta `addressRoutes` (`router.use(addressRoutes);`, línea 14).
  - CA-3/CA-4/CA-5: `createAddress`/`updateAddress`/`deleteAddress` (`addressController.js`) usan siempre `req.user.userId` (nunca `req.body.user`) y filtran por `{ _id: addressId, user }` en lectura/edición/borrado, devolviendo `404` uniforme si la dirección no existe o es de otro dueño.
  - CA-7: cumplido **con limitación documentada** (ver "Lecciones aprendidas" — la afirmación original de que revertir el import haría fallar la suite completa de integración no se sostiene bajo Vitest).
  - CA-8: `Base_Datos_StyleB/tests/integration/address.test.js` tiene 18 tests (`IT-ADDR-01` a `IT-ADDR-18`, no 13 como en el borrador original — el PR #22 amplió la cobertura con `401` en las 4 rutas restantes e `isDefault` desmarcado tanto en `POST` como en `PUT`, commit `def21cc7`), todos en verde.
  - CA-9: `Base_Datos_StyleB/tests/helpers/factories.js` línea 93 exporta `createAddress({ user, ...rest })` con el patrón de la spec.
  - Evidencia de ejecución real en `develop` (worktree de `Base_Datos_StyleB/` limpio, sin WIP ajeno): `npm run test:integration` → 205 passed, 13 expected fail (218 total, 12 archivos), 0 fallos inesperados; `npm run test:unit` → 106 passed, 3 expected fail (109 total, 17 archivos). Los `it.fails` restantes en ambas suites son de otros known-issues (`K06`, `K10`, `IT-CART-*`, `IT-ORD-*`, etc.), no relacionados con `K04`.
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna nueva; se reconfirman los 3 hallazgos ya documentados en "Riesgos y Deuda Técnica" al no haber sufrido cambios el modelo `Address` ni el fallback de `country`:
  - Campo `name` no persistido: `createAddress`/`updateAddress` siguen asignando `name` al documento, pero `Base_Datos_StyleB/src/models/Address.js` (releído en este cierre) sigue sin declarar ese campo — se descarta silenciosamente bajo `strict` de Mongoose. No se corrigió (fuera de alcance de `K04`) y sigue reproducible.
  - `K20` (`docs/known-issues.md`) — `postalCode`/`phone` con `min`/`max` en vez de `minlength`/`maxlength` — sigue abierto, sin relación con este cierre.
  - Fallback `country || "México"` en `createAddress` — sigue presente y sigue siendo código parcialmente muerto bajo la validación vigente (`country` es `notEmpty()` en `addressRoutes.js`).
- **Lecciones aprendidas:**
  - La nota del tech-reviewer sobre CA-7 se confirma al releer el código de cierre: `tests/integration/address.test.js` importa `app` real desde `server.js` sin mockear `models/Address.js`, pero la afirmación de CA-7 de que "revertir la extensión del import haría fallar la suite completa en la fase de colección" **no se sostiene bajo Vitest** — el resolvedor de módulos de Vite (usado por Vitest) tolera especificadores de import sin extensión de forma similar a bundlers tipo webpack, a diferencia de la resolución ESM estricta de Node. Solo `node server.js` (o `npm start`) real reproduciría el `ERR_MODULE_NOT_FOUND` si el import volviera a carecer de `.js`. **CA-7 se declara cumplido con esta limitación documentada**, no oculta: el test de integración sí ejercita la cadena de import real bajo condiciones normales (sin mocks), pero no sirve como red de regresión fiable específicamente para este tipo de bug de extensión ESM bajo el test runner actual del proyecto.
  - Reutilizar un borrador sin trackear ya validado línea por línea contra el patrón del repo (en vez de reescribirlo) redujo el riesgo de introducir una desviación nueva — el resultado final coincide exactamente con lo descrito en el spec.
- **Pendientes abiertos confirmados:**
  - `F4.2` ("Direcciones front → API", `docs/backlog.md`, E4) sigue pendiente, sin `addressService.js` conectado a `/api/addresses` en `Style-Busters-main/src/Services` a la fecha de este cierre (verificado por inspección del directorio en `develop`) — ya registrado en backlog, fuera de alcance de `K04`.
  - `docs/known-issues.md` (`K04`) y `docs/backlog.md` (`F3.1`) quedaron marcados como **RESUELTO** (mismo formato que `F1.1`/`K00`) en el commit `447a73a0`, dentro de esta misma rama de cierre — el orchestrator cerró el gap detectado por docs-keeper antes de abrir el PR de cierre, sin esperar a una tarea `docs` separada.
- **Gaps no resueltos:** el campo `name` no persistido en `Address` (ver "Deuda técnica generada") — permanece como hallazgo documentado, no como bug bloqueante de `K04`.
- **Trabajo fuera de alcance confirmado:** ningún cambio de frontend; `K20`; el campo `name` no persistido; renombrar `:addressId` a `:id` — ninguno de los 4 se tocó, confirmado por `git diff develop...73b07cc8` (PR #22) limitado a `addressController.js`, `addressRoutes.js` (nuevo), `routes/index.js`, `tests/helpers/factories.js`, `tests/integration/address.test.js` y `tests/unit/controllers/addressController.test.js`.
- **Backlog derivado creado:** ninguno nuevo. El hallazgo del campo `name` no persistido se mantiene como propuesta a evaluar (ver "Pendientes Abiertos y Gaps Detectados"), sin que el orchestrator lo haya convertido en backlog nuevo hasta este cierre; el pendiente de actualizar `known-issues.md`/`backlog.md` con el tachado de `K04`/`F3.1` tampoco requiere un ID nuevo, al igual que el caso análogo dejado por el spec de `K00` para `F1.1`.
- **Referencias a historias/tareas creadas:**
  - PR: [#22](https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/22) (mergeado a `develop`, commit `73b07cc8`).
  - Backlog origen: `docs/backlog.md`, `F3.1` (E3); hallazgo: `docs/known-issues.md`, `K04`.
  - Backlog relacionado, no tocado: `F4.2` (E4, `docs/backlog.md`).

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| `K04`/`F3.1` — import ESM roto + rutas de Direcciones sin montar | Confirmado corregido (PR #22) | Cerrar |
| CA-7 — regresión de import ESM no detectable por Vitest (solo por Node real) | Confirmado, limitación documentada | Cerrar con nota (sin backlog nuevo: ya documentado en Resultados/Lecciones) |
| Campo `name` no persistido en `Address` | Confirmado, sigue reproducible, fuera de alcance | Backlog: propuesta pendiente de evaluación por el orchestrator |
| `K20` — `min`/`max` no validan longitud en `String` | Ya registrado, sin relación | No aplica a este spec |
| `docs/known-issues.md`/`docs/backlog.md` sin tachado `RESUELTO` para `K04`/`F3.1` | Detectado en este cierre por docs-keeper | Cerrado en el commit `447a73a0` de esta misma rama, mismo patrón que `F1.1`/`K00` |
