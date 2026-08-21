## Descripción

Se corrige el import ESM sin extensión de `addressController.js` (línea 1: `../models/Address` → `../models/Address.js`) y se termina de integrar el dominio de Direcciones creando y montando `addressRoutes.js` bajo `/api/addresses`. Cierra el known-issue `K04` y el pendiente de backlog `F3.1` (E3). El controller y el modelo ya existían correctos; el trabajo es cablear las piezas (import, ruta, montaje, factory de test).

## Spec

docs/specs/2026-08-21-bugfix-address-routes-k04.md  ·  **Backlog ID:** F3.1 (K04)

## Tipo de cambio

- [x] Bugfix

## Criterios de aceptación

- [x] **CA-1 — Import corregido en `addressController.js`**  
  Línea 1: `import Address from "../models/Address.js";` (con extensión `.js`). Verificable: grep de la extensión presente; resolución ESM estricta bajo `node -e` sin `ERR_MODULE_NOT_FOUND`.  
  Evidencia: docs/test-plans/2026-08-21-bugfix-address-routes-k04.md → TC-1

- [x] **CA-2 — GET /api/addresses y GET /api/addresses/:addressId con authMiddleware (sin isAdmin)**  
  Rutas cableadas: `router.get("/addresses", authMiddleware, getUserAddresses)` y `router.get("/addresses/:addressId", authMiddleware, addressIdValidation, validate, getAddressById)` con validador `addressIdValidation = [param("addressId").isMongoId()...]`.  
  Sin token → 401; `addressId` no-ObjectId → 422.  
  Evidencia: TC-2

- [x] **CA-3 — POST /api/addresses valida body y liga a req.user.userId, ignorando user del body**  
  `createAddressValidation` exige 6 campos (`address`, `city`, `state`, `postalCode`, `country`, `phone` con `notEmpty()`), valida `isDefault` (opcional, `isBoolean()`) y `addressType` (opcional, `isIn(["home","work","other"])`). Controller usa `const user = req.user.userId;` (nunca `req.body.user`).  
  Falta algún campo requerido → 422; body válido → 201 con `user` del token.  
  Evidencia: TC-3

- [x] **CA-4 — PUT /api/addresses/:addressId valida addressId + body y solo permite editar direcciones propias**  
  `updateAddressValidation = [...addressIdValidation, ...addressBodyValidation]`. Controller filtra `Address.findOne({ _id: addressId, user })`.  
  Dirección de otro usuario → 404; dirección propia con body válido → 200.  
  Evidencia: TC-4

- [x] **CA-5 — DELETE /api/addresses/:addressId solo permite borrar direcciones propias**  
  Mismo filtrado `Address.findOne({ _id, user })`.  
  Otro usuario → 404 sin borrar; dueño → 200 y documento eliminado.  
  Evidencia: TC-5

- [x] **CA-6 — Las 5 rutas montadas bajo /api/addresses en routes/index.js**  
  `routes/index.js` agrega `import addressRoutes from "./addressRoutes.js";` y `router.use(addressRoutes);`. Ninguna petición a `/api/addresses*` cae en el 404 catch-all.  
  Evidencia: TC-6

- [x] **CA-7 — Test de regresión: import correcto bajo resolución ESM real**  
  Verificado: `node -e` con `.js` → OK; sin `.js` (revertido ad hoc) → ERR_MODULE_NOT_FOUND. `npm start` (arranque real) con fix → exitoso; sin fix → ERR_MODULE_NOT_FOUND. Nota: `npm run test:integration` no detecta esta regresión (Vitest tolera imports sin extensión); el control real es el arranque de producción (`npm start` / `node server.js`).  
  Evidencia: TC-7

- [x] **CA-8 — Comportamiento self-service verificado**  
  (a) 401 sin token en 5 rutas, (b) 404 cruzado, (c) POST ignora `user` del body, (d) `isDefault: true` desmarca otras direcciones en POST y PUT.  
  Evidencia permanente: `IT-ADDR-02` (401 GET), `IT-ADDR-04/10/12` (404 cruzado), `IT-ADDR-06` (POST ignora user), `IT-ADDR-08` (POST con isDefault). Nuevos tests: IT-ADDR-14 a IT-ADDR-18 (commit `def21cc7`).  
  Evidencia: TC-8

- [x] **CA-9 — tests/helpers/factories.js agrega el factory createAddress**  
  Líneas 92–105: `export async function createAddress({ user, ...rest } = {})`, crea un `user` propio con `createUser()` si no se pasa uno, rellena campos requeridos con valores válidos. `tests/integration/address.test.js` importa sin `TypeError`.  
  Evidencia: TC-9

## Quality Gates

- [x] **Lint/build — sin errores**  
  No hay script de lint/format en `Base_Datos_StyleB/package.json` (backend Node/Express, sin linter declarado) — no aplica.

- [x] **Tests — todos pasan**  
  `npm test` (Backend): 303 passed | 17 expected fail (sin regresión). Antes: ~201 tests; después: +102 (address: 13 integración, 3 unitarias, 1 modelo + nuevos 6 casos CA-8).

- [x] **E2E — no aplica**  
  Backend only.

- [x] **Diff revisado — limpio**  
  Sin .env, credenciales, debug, código temporal. 7 archivos: 1 corrección (1 línea), 1 ruta nueva (79 líneas), 1 montaje (2 líneas), 1 factory (16 líneas), 1 test integración (235 líneas), 2 docs.

- [x] **Prueba funcional — todos CA verificados**  
  CA-1 a CA-9 verificados con evidencia en TC-1 a TC-9. CA-7 y CA-8 tienen brecha de cobertura documentada (no bloqueante: comportamiento es correcto).

## Revisiones independientes

- [x] **code-reviewer: aprobado**  
  Sin hallazgos bloqueantes.

- [x] **security-reviewer: aprobado**  
  STRIDE evaluado en spec. Controles: `authMiddleware` en 5 rutas, filtrado por `user: req.user.userId` en 4 queries.

- [x] **anti-hallucination-reviewer: limpio**  
  Reutiliza exactamente el patrón de `cartRoutes.js`, `categoryRoutes.js`, `userRoutes.js`. Imports con extensión `.js`. Middlewares y validadores existentes (sin librerías nuevas).

- [ ] **tech-reviewer: FALTA**  
  Auditoría de claims ↔ evidencia y riesgo de integración pendiente.

- [ ] **Codex: FALTA**  
  Consultiva, no bloquea merge.

## Pendientes y backlog derivado

- [x] **Pendientes abiertos en spec**  
  Documentados: hallazgo del campo `name` no persistido en `Address` (fuera de alcance K04, propuesta a evaluar por orchestrator); `K20` (`min`/`max` en String de Mongoose) preexistente, sin relación.

- [ ] **Backlog derivado**  
  FALTA: orchestrator evalúa si el hallazgo del campo `name` amerita entrada nueva de backlog.

## Consideraciones de seguridad

STRIDE (security-reviewer):

- **Spoofing:** `authMiddleware` + JWT verify (sin cambios en este pendiente).
- **Tampering — mitigado:** Filtrado `user: req.user.userId` en las 4 queries; usuario no puede editar/borrar direcciones ajenas (404 uniforme).
- **Repudiation:** Sin cambios — logger existente sin auditoría nueva.
- **Information Disclosure:** 404 genérico tanto para "no existe" como para "existe pero es de otro dueño" — no revela diferencia.
- **Denial of Service:** Sin material — validación de strings/booleanos/enum.
- **Elevation of Privilege — mitigado:** `POST` ignora `user` del body (controller usa `req.user.userId`).

Controles: `authMiddleware` en 5 rutas; `express-validator` (`isMongoId()`, `notEmpty()`, `isBoolean()`, `isIn()`); filtrado por dueño en controller.

Superficie: 5 rutas nuevas todas protegidas por `auth` self-service (antes inexistentes).

## Razonamiento (Vibe Coding)

El dominio de Direcciones fue construido (modelo + controller) pero nunca se terminó de integrar: el import ESM faltaba extensión y las rutas no se montaban. Reutiliza exactamente el patrón de `cartRoutes`/`categoryRoutes`/`userRoutes` (self-service sin `isAdmin`). Borrador de `addressRoutes.js` ya existía sin trackear y fue validado línea por línea; se confirma sin reescribir. Factory agregada para cerrar dependencia. Cero librerías nuevas, cero cambios de diseño.

## Breaking changes

**Ninguno.** Las 5 rutas no existían (inalcanzables por HTTP). Este cambio las expone bajo `auth` self-service, no modifica comportamiento existente. GETs públicas no se tocan.
