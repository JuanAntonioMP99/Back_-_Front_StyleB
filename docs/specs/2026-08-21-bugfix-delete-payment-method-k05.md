# Spec: Corregir `deletePaymentMethod` (variable inexistente rompe el borrado de método de pago)

## Metadata
- **Tipo:** bugfix
- **Complejidad:** XS
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** F3.2 (K05)
- **Ejecutor:** backend-builder

## Historia

Como usuario autenticado dueño de un método de pago, quiero poder eliminar mi propio método de pago mediante `DELETE /api/payment-methods/:id`, para poder gestionar mis métodos de pago guardados, en vez de que la petición falle siempre con un error de servidor.

- **Específica:** corregir la función `deletePaymentMethod` en `Base_Datos_StyleB/src/controllers/paymentMethodController.js` (líneas 122-144) para que lea correctamente el parámetro de ruta y la comprobación de propiedad del recurso, sin tocar ningún otro handler del controller ni ningún archivo de frontend.
- **Medible:** CA-1 a CA-6 verificables por lectura de código y por la suite de tests de integración (`Base_Datos_StyleB/tests/integration/paymentMethods.test.js`, `authorization.test.js`).
- **Alcanzable:** cambio acotado a la función `deletePaymentMethod` (1 archivo de producto) + activar/ampliar el test de regresión ya existente que documenta el bug (1 archivo de test), sin tocar rutas, modelos ni el resto de handlers del controller.
- **Relevante:** el endpoint `DELETE /api/payment-methods/:id` está montado y expuesto (`paymentMethodRoutes.js`) pero es inutilizable en su estado actual — toda invocación falla, según `K05` en `docs/known-issues.md` y confirmado por el test de regresión ya presente en el repo (`IT-PAY-10`, actualmente `it.fails`).
- **Temporal:** complejidad XS — el fix es una corrección de nombres de variable dentro de una única función de ~20 líneas; el test de regresión ya existe y solo requiere dejar de estar marcado como fallo esperado (más, opcionalmente, un caso nuevo para el chequeo de propiedad).

## Contexto

`docs/known-issues.md` (`K05`, épica E3) registra: *"`deletePaymentMethod` roto. Referencia `addressId` (variable inexistente); la ruta falla siempre."* `docs/backlog.md` lo lista como `F3.2 · Corregir deletePaymentMethod · Bug · (K05)`.

Lectura del código real (`Base_Datos_StyleB/src/controllers/paymentMethodController.js`, líneas 122-144) confirma **dos bugs de nombres de variable combinados**, ambos dentro del mismo bloque `try`:

```js
const deletePaymentMethod = async (req, res, next) => {
    try {
        const { paymentMethodId } = req.params;          // línea 124
        const userId = req.user.userId;

        const shipPaymentMethod = await PaymentMethod.findOne({
            _id: addressId,                                // línea 128 — ReferenceError
            user: userId,
        });

        if (!shipPaymentMethod) {
            return res.status(404).json({ message: "Payment method not found" });
        }

        await PaymentMethod.findByIdAndDelete(paymentMethodId);  // línea 136 — siempre undefined
        ...
```

1. **Línea 124 — nombre de parámetro equivocado.** La ruta declara el parámetro como `:id` (`Base_Datos_StyleB/src/routes/paymentMethodRoutes.js`, línea 89: `router.delete("/payment-methods/:id", ...)`), igual que `getPaymentMethodById` (línea 63-70 de `paymentMethodRoutes.js`) y `updatePaymentMethod` (línea 80-86). El resto de funciones del mismo controller leen `const { id } = req.params;` (`getPaymentMethodById`, línea 29; `updatePaymentMethod`, línea 82). `deletePaymentMethod` en cambio destructura `paymentMethodId`, que **nunca existe** en `req.params` — su valor es siempre `undefined`.
2. **Línea 128 — `ReferenceError` en tiempo de ejecución.** `addressId` no está declarado en ningún punto del archivo ni del scope de la función; no es ni siquiera el nombre equivocado de una variable local — es un identificador que no existe. Al evaluarse el objeto literal `{ _id: addressId, user: userId }` dentro de `PaymentMethod.findOne(...)`, Node lanza `ReferenceError: addressId is not defined` de forma síncrona, antes de que la promesa de Mongoose llegue a ejecutarse. El patrón (nombre `addressId` en un handler de `paymentMethodController.js`) sugiere que la función se adaptó por copia desde un handler de direcciones análogo (ver `K04` en `known-issues.md`, que documenta un bug de variable no definida — `userId`— en `addressController.js`) sin terminar de renombrar las variables.
3. **Consecuencia observable.** El `ReferenceError` es capturado por el `catch` de la función y pasado a `next(error)`, como el resto de handlers del proyecto. Sin embargo, `server.js` monta `app.use(errorHandler)` (línea 28) **antes** de `app.use("/api", routes)` (línea 34) — el bug de cableado documentado en `K21`, aún abierto. Como consecuencia, el error no llega al `errorHandler` del proyecto: Express usa su manejador de error por defecto, que devuelve una página HTML con el stack trace completo (incluyendo rutas absolutas del servidor) en vez de la respuesta JSON `500` esperada. Este spec **no corrige `K21`** (es un pendiente de backlog aparte, de alcance global a toda la API); solo elimina la excepción concreta que hoy dispara ese camino en esta ruta.
4. **La ruta ya exige autenticación de tipo self-service.** `paymentMethodRoutes.js` (líneas 88-94) monta `DELETE /payment-methods/:id` con `authMiddleware` (sin `isAdmin`), igual que `POST`/`PUT /payment-methods`. La intención del código —confirmada por el propio `findOne({ _id: id, user: userId })`— es que un usuario solo pueda borrar sus propios métodos de pago, comparando `req.user.userId` (inyectado por `authMiddleware` desde el JWT) contra el campo `user` del documento. Esta comprobación de propiedad **nunca llega a ejecutarse hoy** porque el `ReferenceError` ocurre antes; el fix debe preservarla, no solo hacer desaparecer el crash.
5. **Cobertura de test ya existente.** `Base_Datos_StyleB/tests/integration/paymentMethods.test.js` (líneas 179-193) ya contiene un test que documenta exactamente este bug: `it.fails("🔒 IT-PAY-10 — DELETE debería responder 200/404, no 500 (K05)", ...)`, con el comentario `// IT-PAY-10 (K05): deletePaymentMethod referencia addressId (inexistente) y lee req.params.paymentMethodId (la ruta usa :id) → ReferenceError → 500 siempre.` No existe test unitario de `paymentMethodController` (`Base_Datos_StyleB/tests/unit/controllers/` solo tiene `addressController.test.js`, `cartController.test.js`, `userController.test.js`); la cobertura de este controller es exclusivamente de integración, consistente con el resto de tests de `paymentMethods.test.js` y `authorization.test.js`.
6. **No hay test que cubra el borrado cruzado entre usuarios.** `IT-PAY-10` solo prueba que el propio dueño puede borrar su método de pago. No existe ningún caso — ni pasante ni `it.fails` — que verifique que un usuario NO puede borrar el método de pago de otro usuario (a diferencia de `IT-PAY-12`, que sí cubre ese escenario para `PUT` y está marcado `it.fails` porque `updatePaymentMethod` no tiene ese chequeo). Dado que el fix de este spec restaura el chequeo de propiedad de `deletePaymentMethod`, se requiere un caso nuevo que confirme que ese chequeo queda realmente operativo.

## Criterios de Aceptación

- [x] **CA-1 — Parámetro de ruta leído correctamente.** `deletePaymentMethod` (`paymentMethodController.js`) destructura `const { id } = req.params;`, igual que `getPaymentMethodById` y `updatePaymentMethod` del mismo archivo y acorde al nombre `:id` declarado en `paymentMethodRoutes.js` línea 89. Verificable: no queda ninguna referencia a `paymentMethodId` en la función.
- [x] **CA-2 — Sin `ReferenceError`.** No queda ninguna referencia a `addressId` en `paymentMethodController.js`. La consulta de comprobación de propiedad usa `PaymentMethod.findOne({ _id: id, user: userId })`, y el borrado usa `PaymentMethod.findByIdAndDelete(id)` — ambos con la variable `id` obtenida en CA-1, no con la variable inexistente ni con la mal nombrada.
- [x] **CA-3 — Borrado exitoso del propio recurso.** `DELETE /api/payment-methods/:id` con un token válido del usuario dueño del método de pago responde `200` con `{ message: "Payment method deleted successfully" }`, y el documento deja de existir en la base de datos tras la llamada.
- [x] **CA-4 — Recurso inexistente → 404, no 500.** `DELETE /api/payment-methods/:id` con un `ObjectId` válido pero que no corresponde a ningún método de pago responde `404` con `{ message: "Payment method not found" }`.
- [x] **CA-5 — Comprobación de propiedad preservada (anti-IDOR).** `DELETE /api/payment-methods/:id` con un token válido de un usuario que **no** es el dueño del método de pago responde `404` (mismo comportamiento que CA-4, sin distinguir "no existe" de "no es tuyo") y el documento **no** se borra de la base de datos.
- [x] **CA-6 — Regresión de test activada y ampliada.** En `Base_Datos_StyleB/tests/integration/paymentMethods.test.js`, el test `IT-PAY-10` (líneas 179-193) deja de estar marcado `it.fails` y pasa como `it` normal, asertando `res.status === 200` (ya no basta `[200, 404]`, dado que el escenario prueba borrado del propio dueño). Se añade un caso nuevo en el mismo `describe("DELETE /api/payment-methods/:id")` que cubre CA-5 (borrado intentado por un usuario distinto al dueño → `404` + el documento persiste en la BD).
- [x] **CA-7 — Sin regresión en el resto de la suite.** `npm test` en `Base_Datos_StyleB/` sigue en verde tras el cambio, incluyendo `tests/integration/authorization.test.js` (la matriz `AUTH_ONLY` ya incluye `["DELETE", `/api/payment-methods/${id()}`]` — el cambio no debe alterar el nivel de autorización de la ruta, solo el comportamiento interno del controller) y sin tocar ningún `it.fails` de otros escenarios (p. ej. `IT-PAY-11`, `IT-PAY-12`, que quedan fuera de alcance).

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:**
  - **Spoofing:** N/A directo — la ruta ya exige `authMiddleware` (JWT Bearer válido) antes de llegar al controller; este fix no toca la capa de autenticación.
  - **Tampering:** mitigado ya en el diseño original (no roto por este bug): el identificador del recurso a borrar se toma del parámetro de ruta (`req.params.id`, validado como `ObjectId` por `paymentIdValidation` en `paymentMethodRoutes.js`), nunca del body, por lo que no hay superficie nueva de manipulación de payload.
  - **Repudiation:** N/A — no se modifica logging; el borrado responde `200` con mensaje de confirmación, igual que antes del fix.
  - **Information Disclosure:** el bug actual, al no ser capturado por el `errorHandler` del proyecto (por el cableado de `K21`, aún abierto), hoy filtra un stack trace HTML con rutas absolutas del servidor en cada intento de borrado. El fix elimina la excepción concreta que dispara ese camino en esta ruta (deja de haber `ReferenceError` que propagar), aunque no corrige `K21` de forma global — otras rutas del proyecto conservan el mismo riesgo de fuga ante cualquier error no relacionado con este fix.
  - **Denial of Service:** N/A — no se introducen bucles, timers ni llamadas de red nuevas; incluso se elimina el patrón de excepción no controlada actual.
  - **Elevation of Privilege:** es la amenaza central de este fix. El chequeo de propiedad (`findOne({ _id: id, user: userId })` antes de `findByIdAndDelete`) es el control que evita que un usuario autenticado borre el método de pago de **otro** usuario (la ruta solo exige `auth`, no `isAdmin` — es self-service). Hoy ese control nunca se ejecuta porque el `ReferenceError` interrumpe la petición antes. El fix debe restaurar ese control tal cual (CA-5), no simplemente parchear el `ReferenceError` y dejar la comprobación de propiedad rota de otra forma (p. ej. usando `findByIdAndDelete(id)` directo sin el `findOne` previo).
- **Controles de mitigación:** preservar el patrón `findOne({ _id, user })` → `404` si no coincide → `findByIdAndDelete` (CA-2, CA-5), tal como ya lo hacían — con los nombres correctos — el resto de handlers de escritura self-service del proyecto.
- **Inputs que requieren validación:** el `id` de ruta ya está validado como `ObjectId` por `paymentIdValidation` (`param("id").isMongoId()`, `paymentMethodRoutes.js` líneas 17-21), aplicada antes del controller (`validate` middleware). No se introduce ningún input nuevo.
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** `DELETE /api/payment-methods/:id`, exclusivamente. No se toca `GET`, `POST` ni `PUT` de `payment-methods`, ni ningún otro router.

## Dependencias

- **Internas** (rutas relativas a `Base_Datos_StyleB/`):
  - `src/controllers/paymentMethodController.js` — archivo objetivo del fix, función `deletePaymentMethod` (líneas 122-144) — CA-1, CA-2, CA-3, CA-4, CA-5.
  - `src/controllers/paymentMethodController.js`, funciones `getPaymentMethodById` (líneas 27-38) y `updatePaymentMethod` (líneas 80-120) — solo lectura de referencia, confirman el patrón `const { id } = req.params` a replicar.
  - `src/routes/paymentMethodRoutes.js` — solo lectura de referencia (líneas 17-21, 88-94): confirma el nombre real del parámetro de ruta (`:id`) y que `DELETE /payment-methods/:id` solo exige `authMiddleware` (self-service, sin `isAdmin`) — no requiere ningún cambio.
  - `src/models/PaymentMethod.js` — solo lectura de referencia (schema: campo `user` con `ref: "User"`, usado por el chequeo de propiedad).
  - `tests/integration/paymentMethods.test.js` — test de regresión existente `IT-PAY-10` (líneas 179-193) a activar, y caso nuevo de propiedad cruzada — CA-6.
  - `tests/integration/authorization.test.js` — solo lectura de referencia / regresión (líneas 36-51): confirma que `DELETE /api/payment-methods/:id` está en `AUTH_ONLY`, no en `ADMIN_ONLY` — CA-7.
  - `tests/helpers/factories.js` — `createUser`, `createPaymentMethod`, `authHeader` (ya usados por `IT-PAY-10`, reutilizados para el caso nuevo) — CA-6.
- **Externas:** ninguna librería nueva; el fix no introduce dependencias.

## Decisiones de Diseño

- **Renombrar a `id`, no a `paymentMethodId`.** Aunque `paymentMethodId` sería un nombre más descriptivo, se elige `id` para mantener consistencia exacta con el resto de funciones del mismo controller (`getPaymentMethodById`, `updatePaymentMethod`) y con el patrón documentado en `CLAUDE.md` (`const { id } = req.params;`). Introducir un nombre distinto solo en esta función reintroduciría la misma inconsistencia que causó el bug original.
- **Se conserva el patrón `findOne` + `findByIdAndDelete` en dos pasos**, en vez de colapsarlo en un único `findOneAndDelete({ _id: id, user: userId })` atómico. Minimiza el diff a exactamente los nombres de variable rotos, sin alterar la forma general del handler ni introducir un patrón nuevo no usado en el resto del controller. Se documenta como riesgo menor (TOCTOU teórico entre el `findOne` y el `findByIdAndDelete`) en la sección de Riesgos, fuera de alcance de este fix.
- **CA-6 exige endurecer la aserción de `IT-PAY-10`** de `expect([200, 404]).toContain(res.status)` a `res.status === 200`, porque el escenario del test ya crea el método de pago con el mismo usuario que lo borra — con el fix aplicado, el resultado correcto para ese caso concreto es siempre `200`, no `404`.

## Riesgos y Deuda Técnica

- **TOCTOU teórico entre `findOne` y `findByIdAndDelete`:** existe una ventana (aunque mínima) entre la comprobación de propiedad y el borrado efectivo. No es nuevo de este fix — es el mismo patrón que ya usa el código (roto) actual y el resto del proyecto para operaciones self-service similares. No se corrige aquí (ver Decisiones de Diseño); no se abre backlog nuevo por ser un patrón consistente con el resto del proyecto, no una regresión de este cambio.
- **`K21` (cableado de `errorHandler`) permanece abierto** tras este fix. Este spec elimina la excepción concreta de `deletePaymentMethod` que hoy explota ese bug, pero cualquier otro error no controlado en cualquier otra ruta de la API sigue devolviendo HTML con stack trace en vez de JSON `500`. `K21` ya está registrado en `known-issues.md`/`backlog.md`; no se duplica.
- **`IT-PAY-11` (K10, `cvv`/`numCard` expuestos) e `IT-PAY-12` (propiedad no comprobada en `updatePaymentMethod`)** quedan explícitamente fuera de alcance — no se tocan ni se mencionan como criterios de aceptación de este spec, solo se referencian en el Contexto para no confundirlos con `IT-PAY-10`.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna — el endpoint ya existe y está montado; solo estaba roto.
- **Comportamientos inconsistentes detectados:** ninguno nuevo fuera de lo ya descrito en el Contexto (K05, y su relación con K04/K21).
- **Gaps entre frontend y backend:** ninguno dentro de este alcance — el frontend no consume hoy `payment-methods` vía API (ver `F4.3` en `backlog.md`, fuera de alcance de este spec).
- **Persistencia pendiente de migrar:** N/A.
- **Decisiones aplazadas:** no colapsar `findOne` + `findByIdAndDelete` en un `findOneAndDelete` atómico (ver Decisiones de Diseño).
- **Trabajo fuera de alcance en esta iteración:** `K21` (cableado de `errorHandler`), `K10` (datos sensibles de tarjeta en claro), `IT-PAY-11` y `IT-PAY-12` (ya marcados `it.fails` por otros motivos, no tocados por este fix).
- **Riesgos que requieren seguimiento:** ninguno crítico nuevo.
- **Items que deben convertirse en backlog:** ninguno nuevo — `F3.2`/`K05` ya está registrado en `backlog.md`/`known-issues.md` y se cierra con este spec.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21.
- **CAs cumplidos:** CA-1 a CA-7 (7/7), reverificados contra `develop` tras el merge del PR #23 (no solo por el plan de prueba ya redactado):
  - CA-1/CA-2: `Base_Datos_StyleB/src/controllers/paymentMethodController.js`, `deletePaymentMethod` (líneas 122-144) lee `const { id } = req.params;` (línea 124) y usa `PaymentMethod.findOne({ _id: id, user: userId })` (líneas 127-130) / `PaymentMethod.findByIdAndDelete(id)` (línea 136) — sin ninguna referencia a `paymentMethodId` ni `addressId` en el archivo (confirmado por grep en este cierre).
  - CA-3/CA-4/CA-5: `tests/integration/paymentMethods.test.js`, `describe("DELETE /api/payment-methods/:id")` (líneas 179-218) tiene `IT-PAY-10` (borrado del dueño → `200` + persistencia verificada con `findById` → `null`), `IT-PAY-14` (recurso inexistente → `404`) e `IT-PAY-13` (borrado intentado por un usuario distinto al dueño → `404` + el documento **no** se borra, verificado con `findById` → `not.toBeNull()`).
  - CA-6: `IT-PAY-10` ya no está marcado `it.fails` y asertona `res.status === 200` (línea 191, aserción estricta, no `[200, 404]`); `IT-PAY-13` es el caso nuevo que cubre CA-5.
  - CA-7: `tests/integration/authorization.test.js` conserva `["DELETE", \`/api/payment-methods/${id()}\`]` en el array `AUTH_ONLY` (líneas 44-46, no en `ADMIN_ONLY`); `IT-PAY-11`/`IT-PAY-12` (`K10`, propiedad no comprobada en `updatePaymentMethod`) siguen `it.fails` sin modificación.
  - Evidencia de ejecución real en este cierre (worktree de `Base_Datos_StyleB/` limpio): `npm run test:integration` → 205 passed, 13 expected fail (218 total); `npm run test:unit` → 106 passed, 3 expected fail (109 total). Coincide con lo reportado por el plan de prueba (`docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md`, `npm test` completo → 292 passed, 16 expected fail — cifra ligeramente distinta porque el plan corrió `npm test` combinado en el momento del PR, y desde entonces se sumó el PR #22 de `K04`; ambos conjuntos de cifras confirman 0 fallos inesperados).
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna nueva. Se reconfirman los 3 puntos ya documentados en "Riesgos y Deuda Técnica", sin cambios tras el cierre:
  - TOCTOU teórico entre `findOne` y `findByIdAndDelete` — patrón preexistente en todo el proyecto, no corregido aquí por decisión de diseño explícita.
  - `K21` (cableado de `errorHandler` antes de las rutas en `server.js`) sigue abierto — este fix solo elimina la excepción concreta de `deletePaymentMethod` que explotaba ese bug; releído `server.js` en este cierre, `app.use(errorHandler)` sigue antes de `app.use("/api", routes)`.
  - `IT-PAY-11` (`K10`, `cvv`/`numCard` expuestos) e `IT-PAY-12` (propiedad no comprobada en `updatePaymentMethod`) siguen `it.fails`, confirmados sin tocar en este cierre.
- **Lecciones aprendidas:**
  - El plan de prueba inicial requirió una iteración de corrección (commits `8475d9d8` y `60eac250`, posteriores a la implementación `975629aa`): la primera versión no cubría explícitamente la persistencia del borrado (CA-3) ni el caso de recurso inexistente con test dedicado permanente (CA-4) — el tech-reviewer/qa-test-designer detectó el gap entre "verificado con evidencia temporal" y "test permanente en el repo", y se corrigió antes de aprobar el cierre. Confirma el valor de exigir que cada CA tenga un test versionado, no solo una corrida puntual documentada en el plan.
  - El bug combinaba dos errores de nombre de variable (`paymentMethodId` inexistente en `req.params`, `addressId` nunca declarado) que sugieren copia-pega desde un handler de otro dominio (`addressController.js`, ver `K04`) sin terminar de renombrar variables — patrón a vigilar en futuros controllers derivados por copia.
- **Pendientes abiertos confirmados:**
  - `docs/known-issues.md` (`K05`) y `docs/backlog.md` (`F3.2`) **no quedaron marcados como resueltos** tras el merge del PR #23 — mismo caso que `K04` (ver spec `2026-08-21-bugfix-address-routes-k04.md`, "Pendientes abiertos confirmados"): este cierre está acotado explícitamente por el orchestrator a los 3 documentos de spec, sin tocar `known-issues.md`/`backlog.md`. `F3.2`/`K05` ya tienen su entrada de backlog existente; solo falta el tachado `RESUELTO`, acción de documentación para una tarea `docs` posterior.
  - `K21` sigue abierto (ver "Deuda técnica generada"), ya registrado en `known-issues.md`/`backlog.md`, sin relación directa con este cierre.
- **Gaps no resueltos:** ninguno dentro del alcance de este spec — CA-1 a CA-7 cumplidos en su totalidad.
- **Trabajo fuera de alcance confirmado:** `K21` (cableado de `errorHandler`), `K10` (datos sensibles de tarjeta en claro), `IT-PAY-11` e `IT-PAY-12` — confirmado por `git diff develop...0b675c93` (PR #23), limitado a `paymentMethodController.js`, `tests/integration/paymentMethods.test.js` y los documentos de spec/plan de prueba; ningún otro archivo tocado.
- **Backlog derivado creado:** ninguno nuevo. `F3.2`/`K05` ya estaba registrado en `backlog.md`/`known-issues.md` y se cierra con este spec; el pendiente de actualizar el tachado `RESUELTO` en ambos documentos tampoco requiere un ID nuevo (mismo caso que `F1.1`/`K00` y que `K04`/`F3.1`).
- **Referencias a historias/tareas creadas:**
  - PR: [#23](https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/23) (mergeado a `develop`, commit `0b675c93`).
  - Plan de prueba: [`docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md`](../test-plans/2026-08-21-bugfix-delete-payment-method-k05.md).
  - Backlog origen: `docs/backlog.md`, `F3.2` (E3); hallazgo: `docs/known-issues.md`, `K05`.
  - Backlog relacionado, no tocado: `K21`, `K10`, `docs/backlog.md`.

## Matriz de cierre
| Item detectado | Detectado por | Estado | Acción |
|---|---|---|---|
| `deletePaymentMethod` lee `req.params.paymentMethodId` (inexistente; la ruta declara `:id`) | spec-writer (lectura de `paymentMethodController.js` + `paymentMethodRoutes.js`) | Confirmado corregido (PR #23) | Cerrar |
| `deletePaymentMethod` referencia `addressId`, variable nunca declarada (`ReferenceError`) | spec-writer (lectura de código) + test `IT-PAY-10` ya existente en el repo | Confirmado corregido (PR #23) | Cerrar |
| Chequeo de propiedad (anti-IDOR) del método de pago nunca se ejecuta por el crash previo | spec-writer (análisis STRIDE) | Confirmado corregido y cubierto con test (`IT-PAY-13`) | Cerrar |
| Plan de prueba inicial sin test permanente para CA-3/CA-4 | tech-reviewer / qa-test-designer, en revisión previa al cierre | Corregido en 1 iteración (`8475d9d8`, `60eac250`) | Cerrar |
| `K21` — `errorHandler` cableado antes de las rutas en `server.js` | Ya registrado, sin relación directa | No aplica a este spec |
| `docs/known-issues.md`/`docs/backlog.md` sin tachado `RESUELTO` para `K05`/`F3.2` | Detectado en este cierre, fuera de alcance explícito del docs-keeper en esta tarea | Backlog: alinear en tarea `docs` posterior, mismo patrón que `F1.1`/`K00` |
