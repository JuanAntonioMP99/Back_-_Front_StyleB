# Plan de Prueba: Corregir `deletePaymentMethod` (K05)

- **Spec:** `docs/specs/2026-08-21-bugfix-delete-payment-method-k05.md`  ·  **Backlog ID:** `F3.2` (K05)
- **Fecha:** 2026-08-21
- **Autor (rol):** qa-test-designer
- **Ámbito:** backend `Base_Datos_StyleB/`
- **Commit de implementación:** `975629aa` (fix: corregir `deletePaymentMethod` + activar/ampliar tests)

## Entorno de prueba
- Backend: Vitest 4 + supertest + `mongodb-memory-server` (BD en memoria, sin MongoDB local ni `.env`).
- Comando: `cd Base_Datos_StyleB && npm test` (invoca `node ./node_modules/vitest/vitest.mjs run`, nunca `npx vitest`).
- Archivos bajo prueba: `src/controllers/paymentMethodController.js` (función `deletePaymentMethod`), `src/routes/paymentMethodRoutes.js` (solo lectura de referencia), `tests/integration/paymentMethods.test.js`, `tests/integration/authorization.test.js`.
- Nota de método: CA-3 y CA-4 no tienen test versionado dedicado en `tests/integration/paymentMethods.test.js` (el `describe("DELETE /api/payment-methods/:id")` solo contiene `IT-PAY-10` e `IT-PAY-13`, ver TC-6). Se verificaron empíricamente con un archivo de test temporal (`tests/integration/__qa_tmp_delete_payment_method_evidence.test.js`), creado, ejecutado y **eliminado** — no forma parte del repo ni del diff del commit `975629aa`.

## Casos de prueba

### TC-1 — Parámetro de ruta leído correctamente [CA-1]
- **Precondición:** commit `975629aa` aplicado.
- **Pasos:** inspección de `Base_Datos_StyleB/src/controllers/paymentMethodController.js`, función `deletePaymentMethod` (líneas 122-144); grep de `paymentMethodId` en todo el archivo.
- **Dato de entrada:** N/A (revisión estática).
- **Resultado esperado:** la función destructura `const { id } = req.params;` (línea 124), igual que `getPaymentMethodById` (línea 29) y `updatePaymentMethod` (línea 82); ninguna referencia a `paymentMethodId` en el archivo.
- **Resultado real:** confirmado por lectura directa — línea 124: `const { id } = req.params;`. `grep -n "paymentMethodId" src/controllers/paymentMethodController.js` → sin coincidencias.
- **Estado:** ✅ cumplido

### TC-2 — Sin `ReferenceError` [CA-2]
- **Precondición:** commit `975629aa` aplicado.
- **Pasos:** inspección de las líneas 127-136 del controller (consulta de propiedad y borrado); grep de `addressId` en todo el archivo.
- **Dato de entrada:** N/A (revisión estática).
- **Resultado esperado:** `PaymentMethod.findOne({ _id: id, user: userId })` (no `addressId`); `PaymentMethod.findByIdAndDelete(id)` (no `paymentMethodId`); ninguna referencia a `addressId` en el archivo.
- **Resultado real:** confirmado por lectura directa — línea 127-130: `PaymentMethod.findOne({ _id: id, user: userId })`; línea 136: `PaymentMethod.findByIdAndDelete(id)`. `grep -n "addressId" src/controllers/paymentMethodController.js` → sin coincidencias. Corroborado dinámicamente: ninguna ejecución de `DELETE /api/payment-methods/:id` en toda la suite (`IT-PAY-10`, `IT-PAY-13`, `authorization.test.js`, evidencia temporal TC-6/TC-7) lanza `500` ni error no controlado.
- **Estado:** ✅ cumplido

### TC-3 — Borrado exitoso del propio recurso, incluida persistencia en BD [CA-3]
- **Precondición:** usuario autenticado, dueño de un método de pago existente.
- **Pasos:**
  1. `DELETE /api/payment-methods/:id` con token del dueño → verificar `res.status` y `res.body`.
  2. `PaymentMethod.findById(id)` tras la llamada → verificar que el documento ya no existe.
- **Dato de entrada:** método de pago creado vía `createPaymentMethod({ user: user._id, numCard: "4000000000000093" })`.
- **Resultado esperado:** `200` con `{ message: "Payment method deleted successfully" }`; el documento deja de existir en la BD.
- **Resultado real:**
  - `tests/integration/paymentMethods.test.js` → `IT-PAY-10 — DELETE del propio dueño responde 200 (K05)` → PASA (`res.status === 200`). Este test versionado **no** verifica la persistencia (no consulta la BD tras el borrado).
  - Evidencia temporal (`__qa_tmp_delete_payment_method_evidence.test.js`, ejecutada y eliminada) → `CA-3: DELETE del propio dueño elimina realmente el documento de la BD` → PASA: `res.status === 200`, `res.body` igual a `{ message: "Payment method deleted successfully" }`, y `await PaymentMethod.findById(metodo._id)` → `null` tras la llamada.
- **Estado:** ✅ cumplido (verificado empíricamente; sin test permanente en el repo que cubra la parte de persistencia — ver nota de método arriba).

### TC-4 — Recurso inexistente → 404, no 500 [CA-4]
- **Precondición:** ninguna (`ObjectId` válido, sin documento asociado).
- **Pasos:** `DELETE /api/payment-methods/:id` con un `ObjectId` válido que no corresponde a ningún método de pago, con token válido de cualquier usuario autenticado.
- **Dato de entrada:** `id()` (helper `new mongoose.Types.ObjectId().toString()`, sin crear el documento).
- **Resultado esperado:** `404` con `{ message: "Payment method not found" }`.
- **Resultado real:** no existe test versionado dedicado a este caso en `tests/integration/paymentMethods.test.js` (el `describe("DELETE ...")` solo tiene `IT-PAY-10` e `IT-PAY-13`, ninguno con `ObjectId` inexistente). Verificado empíricamente con la evidencia temporal: `CA-4: DELETE con ObjectId válido pero inexistente → 404, no 500` → PASA: `res.status === 404`, `res.body` igual a `{ message: "Payment method not found" }` (sin stack trace HTML, confirmando que no hay `ReferenceError`).
- **Estado:** ✅ cumplido (verificado empíricamente; sin test permanente en el repo — ver nota de método arriba).

### TC-5 — Comprobación de propiedad preservada (anti-IDOR) [CA-5]
- **Precondición:** dos usuarios (`victima`, `atacante`); método de pago perteneciente a `victima`.
- **Pasos:** `DELETE /api/payment-methods/:id` (id del método de `victima`) con token de `atacante`; verificar `res.status` y que el documento sigue existiendo en la BD.
- **Dato de entrada:** `tests/integration/paymentMethods.test.js:194-205` — `IT-PAY-13`: `victima = await createUser(); metodo = await createPaymentMethod({ user: victima._id, ... }); atacante = await createUser();` seguido de `.delete(...).set(authHeader(atacante))`.
- **Resultado esperado:** `404` (mismo comportamiento que CA-4, sin distinguir "no existe" de "no es tuyo"); el documento **no** se borra de la BD.
- **Resultado real:** `IT-PAY-13 — un customer NO debería poder borrar el método de otro usuario (CA-5)` → PASA. El test verifica explícitamente ambas condiciones exigidas por CA-5, no solo el status code:
  ```js
  expect(res.status).toBe(404);
  expect(await PaymentMethod.findById(metodo._id)).not.toBeNull();
  ```
  La segunda aserción es la que confirma el anti-IDOR de forma directa: tras el intento de borrado por un usuario que no es el dueño, el documento se vuelve a consultar en la BD y se comprueba que **sigue existiendo** (`not.toBeNull()`). Sin el chequeo de propiedad (`findOne({ _id: id, user: userId })` antes de `findByIdAndDelete`), este segundo `expect` fallaría, ya que `findByIdAndDelete(id)` ejecutado directamente sí habría borrado el documento independientemente del dueño. Confirmado por ejecución dirigida (`reporter=verbose`): `✓ tests/integration/paymentMethods.test.js > DELETE /api/payment-methods/:id > 🔒 IT-PAY-13 — un customer NO debería poder borrar el método de otro usuario (CA-5)`.
- **Estado:** ✅ cumplido — el test nuevo verifica genuinamente que el documento NO se borra cuando lo intenta un usuario que no es el dueño, no solo el status code.

### TC-6 — Regresión de test activada y ampliada [CA-6]
- **Precondición:** commit `975629aa` aplicado.
- **Pasos:**
  1. Confirmar por lectura que `IT-PAY-10` (`tests/integration/paymentMethods.test.js:183-192`) ya no está marcado `it.fails` y asertona `res.status === 200` (no `[200, 404]`).
  2. Confirmar que existe un caso nuevo en el mismo `describe("DELETE /api/payment-methods/:id")` que cubre CA-5.
- **Resultado esperado:** `IT-PAY-10` es `it(...)` normal con `expect(res.status).toBe(200)`; existe `IT-PAY-13` como caso nuevo de propiedad cruzada.
- **Resultado real:** confirmado por lectura directa:
  - Línea 183: `it("🔒 IT-PAY-10 — DELETE del propio dueño responde 200 (K05)", async () => {` (sin `.fails`).
  - Línea 191: `expect(res.status).toBe(200);` (aserción estricta, no `[200, 404]`).
  - Línea 194-205: `it("🔒 IT-PAY-13 — un customer NO debería poder borrar el método de otro usuario (CA-5)", ...)` — caso nuevo, dentro del mismo `describe`.
  - Ejecución (`reporter=verbose`): ambos `✓`, ninguno reportado como `expected fail`.
- **Estado:** ✅ cumplido

### TC-7 — Sin regresión en el resto de la suite [CA-7]
- **Precondición:** ninguna.
- **Pasos:**
  1. `cd Base_Datos_StyleB && npm test` (suite completa).
  2. Confirmar que `tests/integration/authorization.test.js` sigue listando `["DELETE", `/api/payment-methods/${id()}`]` en `AUTH_ONLY` (no en `ADMIN_ONLY`).
  3. Confirmar que ningún otro `it.fails` preexistente (`IT-PAY-11`, `IT-PAY-12`, u otros fuera de `paymentMethods.test.js`) fue tocado ni pasó a estado distinto del esperado.
- **Resultado esperado:** `npm test` en verde (0 failed); `DELETE /api/payment-methods/:id` sigue en `AUTH_ONLY`; `IT-PAY-11`/`IT-PAY-12` siguen `it.fails` sin modificación.
- **Resultado real:**
  - `npm test` → `Test Files 28 passed (28)` / `Tests 292 passed | 16 expected fail (308)` — **0 fallos**.
  - `tests/integration/authorization.test.js:46` — `["DELETE", `/api/payment-methods/${id()}`]` permanece en el array `AUTH_ONLY` (no en `ADMIN_ONLY`, verificado por lectura). Ejecución dirigida confirma los 3 casos generados por `it.each` para esta ruta (`401 sin token`, `NO responde 401 con token de customer válido` — no hay caso de `403` porque es `AUTH_ONLY`, no `ADMIN_ONLY`) → todos `✓`.
  - `tests/integration/paymentMethods.test.js:131` (`IT-PAY-11`) y `:162` (`IT-PAY-12`) siguen declarados con `it.fails`, sin cambios de contenido respecto al spec (confirmado por lectura — ambos fuera del diff del commit `975629aa` según el propio spec, sección "Riesgos y Deuda Técnica").
  - Ejecución dirigida (`reporter=verbose` sobre `paymentMethods.test.js` + `authorization.test.js`) confirma explícitamente `IT-PAY-11` e `IT-PAY-12` reportados junto al resumen final `Tests 93 passed | 2 expected fail (95)` — ambos `it.fails` siguen contándose como "expected fail" (no se rompieron ni se "arreglaron" accidentalmente).
- **Estado:** ✅ cumplido

## Quality gates (evidencia)

```
# comando : resultado
cd Base_Datos_StyleB && npm test
  → node ./node_modules/vitest/vitest.mjs run
  → Test Files  28 passed (28)
  → Tests       292 passed | 16 expected fail (308)
  → Duration    11.15s
  → (16 "expected fail" = it.fails preexistentes fuera del alcance de este spec,
     incluidos IT-PAY-11 (K10, cvv expuesto) e IT-PAY-12 (propiedad no comprobada
     en updatePaymentMethod) — explícitamente fuera de alcance según el spec)

Ejecución dirigida (reporter=verbose) sobre los archivos tocados por el spec:
cd Base_Datos_StyleB && node ./node_modules/vitest/vitest.mjs run \
  tests/integration/paymentMethods.test.js tests/integration/authorization.test.js \
  --reporter=verbose
  → Tests  93 passed | 2 expected fail (95)
  → incluye, entre otros:
    - paymentMethods.test.js > DELETE /api/payment-methods/:id >
      🔒 IT-PAY-10 — DELETE del propio dueño responde 200 (K05) ✓
    - paymentMethods.test.js > DELETE /api/payment-methods/:id >
      🔒 IT-PAY-13 — un customer NO debería poder borrar el método de otro usuario (CA-5) ✓
    - authorization.test.js > it.each(AUTH_ONLY) para
      ["DELETE", "/api/payment-methods/:id"] (401 sin token, sin 401 con customer) ✓ x2

Evidencia adicional (test temporal, creado y eliminado solo para esta auditoría,
no forma parte del repo ni del diff): 2/2 casos ✓ — ver TC-3/TC-4.
  Archivo: tests/integration/__qa_tmp_delete_payment_method_evidence.test.js
  (creado → ejecutado en verde → eliminado; `git status --short` en
  Base_Datos_StyleB/ confirma que no quedó rastro tras la limpieza)

npm run test:coverage : no ejecutado (no exigido por el spec; el cambio es una
             corrección de nombres de variable en una función ya cubierta por
             tests de integración, sin superficie nueva de ramas de código)
lint       : no ejecutado (sin script de lint declarado en package.json)
build      : N/A (backend Node/Express, sin paso de build)
```

## Veredicto

| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | ✅ cumplido |
| CA-2 | TC-2 | ✅ cumplido |
| CA-3 | TC-3 | ✅ cumplido (verificado empíricamente, sin test permanente para la parte de persistencia en BD) |
| CA-4 | TC-4 | ✅ cumplido (verificado empíricamente, sin test permanente en el repo) |
| CA-5 | TC-5 | ✅ cumplido — `IT-PAY-13` (test permanente) confirma tanto `404` como que el documento **no** se borra |
| CA-6 | TC-6 | ✅ cumplido |
| CA-7 | TC-7 | ✅ cumplido |

**Resumen:** CA-1, CA-2, CA-5, CA-6 y CA-7 cumplidos con test permanente en el repo (`IT-PAY-10`, `IT-PAY-13`, `authorization.test.js`) y `npm test` en verde (292 passed, 0 failed, 16 expected-fail preexistentes sin relación con este spec). CA-3 y CA-4 se cumplen funcionalmente (verificado empíricamente con un test temporal creado, ejecutado y eliminado solo para esta auditoría), pero **no cuentan con test permanente versionado** en `tests/integration/paymentMethods.test.js` — el `describe("DELETE /api/payment-methods/:id")` solo cubre los escenarios de `IT-PAY-10` (propio dueño → 200, sin verificar persistencia) e `IT-PAY-13` (dueño ajeno → 404 + persistencia). Esto no bloquea el gate porque el spec (sección "Medible") solo exige CA-1 a CA-6 "verificables por lectura de código y por la suite de tests" — no exige explícitamente un test nuevo por cada CA — y CA-6 solo pide activar `IT-PAY-10` y añadir el caso de CA-5, sin mencionar CA-3/CA-4 como casos nuevos requeridos. Se deja como observación de cobertura, no como hallazgo bloqueante. Gate G3: **verde** para CA-1 a CA-7.
