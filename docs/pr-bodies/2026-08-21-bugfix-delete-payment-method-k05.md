## Descripción

Corrige dos errores de nombres de variable en `deletePaymentMethod` (`Base_Datos_StyleB/src/controllers/paymentMethodController.js`) que impedían el borrado de métodos de pago: `const { paymentMethodId }` por `const { id }` (línea 124) y `addressId` por `id` en la consulta de propiedad (línea 128). Preserva el chequeo anti-IDOR existente (self-service) y activa/amplía el test de regresión `IT-PAY-10` (K05) con dos casos nuevos para cobertura de CA-3, CA-4 y CA-5.

## Spec
`docs/specs/2026-08-21-bugfix-delete-payment-method-k05.md`  ·  **Backlog ID:** F3.2 (K05)

## Tipo de cambio
- [x] Bugfix
- [ ] Feature / Hotfix / Refactor / Security patch / Infra / Docs

## Criterios de aceptación

- [x] **CA-1:** Parámetro de ruta leído correctamente — `deletePaymentMethod` destructura `const { id } = req.params;` (línea 124), igual que `getPaymentMethodById` y `updatePaymentMethod` del mismo archivo. Ninguna referencia a `paymentMethodId`. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-1.

- [x] **CA-2:** Sin `ReferenceError` — `PaymentMethod.findOne({ _id: id, user: userId })` (línea 127-130) y `PaymentMethod.findByIdAndDelete(id)` (línea 136). Ninguna referencia a `addressId`. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-2.

- [x] **CA-3:** Borrado exitoso del propio recurso — `DELETE /api/payment-methods/:id` con token del dueño responde `200` con `{ message: "Payment method deleted successfully" }` y el documento deja de existir en la BD. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-3 + test `IT-PAY-10` (línea 191) + test `IT-PAY-14` (nuevos asserts sobre persistencia).

- [x] **CA-4:** Recurso inexistente → `404` — `DELETE /api/payment-methods/:id` con `ObjectId` válido que no existe responde `404` con `{ message: "Payment method not found" }`. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-4 + test `IT-PAY-14` (nuevos, línea 215-220 del diff).

- [x] **CA-5:** Comprobación de propiedad preservada (anti-IDOR) — `DELETE /api/payment-methods/:id` con token de un usuario que **no** es el dueño responde `404` y el documento **no** se borra. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-5 + test `IT-PAY-13` (nuevos, línea 194-205 del diff).

- [x] **CA-6:** Regresión de test activada y ampliada — `IT-PAY-10` cambia de `it.fails` a `it` (línea 183 del diff) y la aserción se endurece de `expect([200, 404]).toContain(res.status)` a `expect(res.status).toBe(200)`. Se añaden `IT-PAY-13` (CA-5) e `IT-PAY-14` (CA-4). **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-6.

- [x] **CA-7:** Sin regresión en el resto de la suite — `npm test` en verde: `Test Files  28 passed (28)` / `Tests  292 passed | 16 expected fail (308)` (0 fallos). `authorization.test.js` mantiene `DELETE /api/payment-methods/:id` en `AUTH_ONLY`. `IT-PAY-11` e `IT-PAY-12` siguen `it.fails` sin cambios. **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección TC-7 + Quality gates.

## Quality Gates

- [x] Lint/build — N/A (backend Node.js, sin step de build; sin lint script en `package.json`)

- [x] Tests — **todos pasan** (`npm test` en `Base_Datos_StyleB/`): `292 passed | 0 failed | 16 expected-fail preexistentes` (incluidos `IT-PAY-11`, `IT-PAY-12` explícitamente fuera de alcance). Ejecución dirigida sobre archivos tocados: `93 passed | 2 expected fail (95)` (paymentMethods.test.js + authorization.test.js). **Evidencia:** `docs/test-plans/2026-08-21-bugfix-delete-payment-method-k05.md` sección Quality gates.

- [x] E2E — N/A (backend, sin tests E2E en el alcance de este spec)

- [x] Diff revisado — **sin secrets, sin console.log de debug, sin código temporal sin marcar.** 4 líneas de código (renombres de variable en controller) + 31 líneas de tests (2 nuevos casos `it`). **Evidencia:** `git diff develop...fix/delete-payment-method-k05`.

- [x] Prueba funcional — **todos los CA verificados con evidencia.** CA-1, CA-2, CA-5, CA-6, CA-7 cubiertos por test permanente en el repo. CA-3 y CA-4 verificados funcionalmente (test permanente: `IT-PAY-14` cubre ambos). **Evidencia:** veredicto del plan de prueba.

## Revisiones independientes

- [x] **code-reviewer:** aprobado — sin hallazgos bloqueantes.

- [x] **security-reviewer:** aprobado — STRIDE evaluado en spec (Elevation of Privilege mitigado por chequeo de propiedad restaurado; Information Disclosure: elimina excepción concreta).

- [x] **anti-hallucination-reviewer:** LIMPIO — sin rutas/endpoints/librerías inventadas; cambio acotado a nombres de variable reales.

- [ ] **tech-reviewer:** FALTA: pendiente de auditar claims↔evidencia, spec↔diff, riesgo de integración.

- [ ] **Segunda opinión (Codex):** FALTA: consulta post-PR pendiente (consultiva, no bloquea merge).

## Pendientes y backlog derivado

- [x] **Pendientes abiertos registrados en el spec:** K21 (cableado de `errorHandler`, permanece abierto), TOCTOU teórico entre `findOne` y `findByIdAndDelete` (patrón consistente con el proyecto, no nueva deuda).

- [x] **Backlog accionable creado:** ninguno nuevo. K05 se cierra con este spec; K21 ya registrado.

## Consideraciones de seguridad

**Amenazas STRIDE identificadas y controles:**

- **Spoofing:** N/A directo — la ruta ya exige `authMiddleware`.
- **Tampering:** mitigado en el diseño original: identificador tomado de `req.params.id` (validado como `ObjectId`), nunca del body.
- **Repudiation:** N/A — no se modifica logging.
- **Information Disclosure:** el fix elimina la `ReferenceError` concreta de esta ruta, reduciendo fuga en este endpoint.
- **Denial of Service:** N/A — no se introducen bucles, timers ni nuevas llamadas de red.
- **Elevation of Privilege (central):** chequeo de propiedad `findOne({ _id: id, user: userId })` está restaurado (CA-5). Un usuario autenticado no puede borrar métodos de pago de otros usuarios.

**Inputs validados:** `id` de ruta ya validado como `ObjectId` por `paymentIdValidation`.

**Secrets:** ninguno involucrado.

**Superficie afectada:** `DELETE /api/payment-methods/:id`, exclusivamente.

## Razonamiento (Vibe Coding)

Se opta por renombrar a `id` (no `paymentMethodId`) para mantener consistencia exacta con otras funciones del mismo controller. Se conserva el patrón `findOne` + `findByIdAndDelete` en dos pasos, minimizando el diff a exactamente los nombres rotos. El tradeoff: pequeña ventana TOCTOU teórica entre operaciones, pero es patrón documentado del proyecto existente.

## Breaking changes

**Ninguno** — es una corrección de nombres de variable en una función interna; no afecta contratos de API.

---

**Commits en la rama:**
- `bd742be5` — docs: spec bugfix-delete-payment-method-k05
- `975629aa` — fix(payment-methods): corregir deletePaymentMethod (K05)
- `c94a1749` — docs: agregar plan de prueba DELETE-PAYMENT-METHOD-K05-2026-08-21
- `8475d9d8` — test(payment-methods): cubrir persistencia de borrado y 404 en inexistente (CA-3, CA-4)

**Diff:** 4 cambios en `paymentMethodController.js` (nombres de variable) + 31 líneas en `paymentMethods.test.js`.
