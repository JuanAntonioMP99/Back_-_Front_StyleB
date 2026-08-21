## Descripción

Se agrega un campo `images` (array de URLs, default `[]`) al modelo `Product` y su respectiva validación en `express-validator`, permitiendo que la API acepte y persista múltiples imágenes por producto sin modificar el campo `imageURL` existente. Este cambio es aditivo y retrocompatible, habilitando un consumidor posterior en el frontend (`<ImageCarousel>`) mientras se preserva el comportamiento actual de los tres consumidores existentes.

## Spec

`docs/specs/2026-08-21-feature-product-image-gallery-backend.md` · **Backlog ID:** BE-PRODUCT-IMAGE-GALLERY-2026-08-21

## Tipo de cambio

- [x] Feature

## Criterios de aceptación

- [x] **CA-1 — Campo `images` en el modelo `Product`:** Agregado a `Base_Datos_StyleB/src/models/Product.js`. Evidencia: TC-1, test unitario pasa.

- [x] **CA-2 / CA-2a / CA-2b — `imageURL` sin cambios + criterio de semántica:** Preservado exactamente. Evidencia: TC-2, tests sin modificación.

- [x] **CA-3 — Validación de `images` en `express-validator`:** Agregada con `isArray({ max: 10 })` e `isURL()`. Evidencia: TC-3/TC-4, validación verificada.

- [x] **CA-4 — `createProduct` acepta y persiste `images`:** Implementado en `productController.js`. Evidencia: TC-5, comportamiento correcto verificado.

- [x] **CA-5 — `updateProduct` preserva `images` existente si se omite:** Implementado. Evidencia: TC-6, preservación verificada.

- [x] **CA-6 — Sin migración de datos existentes:** No se modifica `tests/globalSetup.js`/`tests/setup.js`. Evidencia: TC-7, default Mongoose cubre pre-existentes.

- [x] **CA-7 — Tests unitarios del modelo ampliados:** Agregados 2 tests nuevos a `Product.test.js`. Evidencia: TC-8, `npm run test:unit` pasa.

- [x] **CA-8 — Consistencia de respuesta en lecturas:** Funciones de lectura no modificadas. Evidencia: TC-9, `images` aparece automáticamente.

- [x] **CA-9 — Sin cambios a rutas, permisos ni otros modelos:** Solo 5 archivos de código/tests modificados (3 de implementación + 2 de tests, este último ampliado tras el hallazgo de qa-test-designer). Sin rutas nuevas, sin auth agregada, sin otros modelos tocados. Evidencia: TC-10, `git diff --stat` exacto, re-verificado por tech-reviewer.

## Quality Gates

- [x] **Lint/build** — N/A (backend Node, sin lint configurado).
- [x] **Tests — todos pasan** — `npm test`: Test Files 28 passed | Tests 275 passed | 21 expected fail (preexistentes). Sin fallos inesperados. (Verificado por el orchestrator con 2 corridas independientes tras el rebase sobre `develop`.)
- [x] **E2E — N/A** — Backend únicamente.
- [x] **Diff revisado** — 5 archivos de código/tests (3 implementación + 2 tests) + docs propias del pendiente. Sin secrets, sin debug code.
- [x] **Prueba funcional** — 9 CA verificados. Veredicto: APTO.

## Revisiones independientes

- [x] **code-reviewer:** aprobado.
- [x] **security-reviewer:** aprobado (riesgo heredado F3.5 aceptado).
- [x] **anti-hallucination-reviewer:** limpio.
- [x] **tech-reviewer:** **APTO** — verificado directamente (código, tests reproducidos, mergeable/CLEAN, sin impacto en frontend).
- [ ] **Segunda opinión (Codex):** FALTA — no disponible en este entorno.

## Pendientes y backlog derivado

- [x] **Pendientes abiertos registrados en spec:**
  - Conectar `<ImageCarousel>` en frontend (pendiente 2).
  - Agregar auth a rutas `/products` (F3.5, trackeado).
  - Validar `imageURL` con `isURL()` (fuera de alcance).

- [ ] **Backlog accionable creado:** FALTA — nuevo hallazgo: armonización de validación de `imageURL` vs `images`. Sin ID de backlog aún.

## Consideraciones de seguridad

**STRIDE evaluado:**

- **Tampering — SÍ APLICA:** `images` es array escribible sin auth. Ampliación cuantitativa (1 string → 10 strings).
  - Controles: `isURL()` + `max: 10`.
  - Control NO aplicado: autenticación (F3.5, preexistente, fuera de alcance).

- **Spoofing, Repudiation, Elevation of Privilege:** N/A.
- **Information Disclosure:** Bajo — público como `imageURL`.
- **Denial of Service:** Acotado por `express.json()` (100 KB) y `max: 10`.

Inputs: `req.body.images`. Secrets: ninguno.

## Razonamiento (Vibe Coding)

Cambio aditivo para evitar ruptura de consumidores existentes del frontend, habilitando pendiente 2 (frontend) que compondrá galería como `[imageURL, ...images]`. Límite `max: 10` como control Tampering/DoS. Reutilización de patrones existentes (`[String]`, validación de array). Responsabilidades claras: `imageURL` = principal, `images` = galería adicional.

## Breaking changes

**Ninguno** — cambio aditivo y retrocompatible. `imageURL` sin variación. `images` es nuevo campo con default `[]`. API se amplía sin romper.
