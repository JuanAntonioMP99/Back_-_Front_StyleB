## Descripción

Se requiere autenticación + rol admin en POST/PUT/DELETE /api/products (antes abierto al público) para cerrar la vulnerabilidad de escritura de catálogo sin autenticación. Simultáneamente, se agrega validación de formato imageURL con .isURL() en createProductValidation y updateProductValidation, cerrando una asimetría de validación ya trackeada. Ambos cambios resuelven hallazgos de seguridad consolidados: F3.5 / K08 (escritura sin auth) y BE-VALIDATE-IMAGEURL-2026-08-21 (validación inconsistente).

## Spec

docs/specs/2026-08-21-security-patch-products-auth-validation.md  ·  **Backlog ID:** SEC-PRODUCTS-AUTH-VALIDATION-2026-08-21

## Tipo de cambio


- [x] Security patch

## Criterios de aceptación

- [x] **CA-1 — Imports de authMiddleware/isAdmin en productRoutes.js**  
  Ambos imports agregados a src/routes/productRoutes.js, líneas 12–13. Verificable: grep de ambos imports presente.  
  Evidencia: docs/test-plans/2026-08-21-security-patch-products-auth-validation.md → TC-1

- [x] **CA-2 — POST /api/products exige authMiddleware + isAdmin**  
  Ruta cableada con middlewares: authMiddleware, isAdmin, createProductValidation, validate, createProduct.  
  Sin token → 401; customer → 403; admin → 201.  
  Evidencia: TC-2

- [x] **CA-3 — PUT /api/products/:id exige authMiddleware + isAdmin**  
  Sin token → 401; customer → 403; admin → 200.  
  Evidencia: TC-3

- [x] **CA-4 — DELETE /api/products/:id exige authMiddleware + isAdmin**  
  Sin token → 401; customer → 403; admin → 204.  
  Evidencia: TC-4

- [x] **CA-5 — Rutas de lectura de /products sin cambios**  
  GET /products/search, GET /products, GET /products/:id conservan cadena actual (sin auth), públicas.  
  Evidencia: TC-5

- [x] **CA-6 — imageURL validado en createProductValidation**  
  body("imageURL").optional().isURL().withMessage("imageURL must be a valid URL")  
  POST /api/products (admin) con imageURL no-valida → 422 con path: "imageURL".  
  Evidencia: TC-6

- [x] **CA-7 — imageURL validado en updateProductValidation**  
  Misma regla. PUT /api/products/:id (admin) con imageURL no-valida → 422.  
  Evidencia: TC-7

- [x] **CA-8 — products.test.js: 15 tests de escritura con token de admin**  
  8 POST + 5 PUT + 2 DELETE, todas con .set(authHeader(admin)). Aserciones sin cambios; todas pasan.  
  Evidencia: TC-8

- [x] **CA-9 — security.test.js: "comportamiento actual" → 401**  
  Test actualizado para esperar 401 (antes 201).  
  Evidencia: TC-9

- [x] **CA-10 — 4 it.fails K08 → it normal**  
  Eliminado .fails de 4 tests. npm test: 309 passed | 15 expected fail (ninguno K08).  
  Evidencia: TC-10

- [x] **CA-11 — authorization.test.js: ADMIN_ONLY incluye /products**  
  3 rutas agregadas. 9 tests generados automáticamente, todos pasan.  
  Evidencia: TC-11

- [x] **CA-12 — imageURL no-valida en products.test.js**  
  2 tests nuevos (POST + PUT) → 422, ambos pasan.  
  Evidencia: TC-12

- [ ] **CA-13 — Cierre de documentación (K08, F3.5, BE-VALIDATE-IMAGEURL)**  
  FALTA: CA de cierre (FASE 10 — docs-keeper), no de implementación. Fuera alcance commits auditados.

## Quality Gates

- [x] **Lint/build — sin errores**

- [x] **Tests — todos pasan**  
  npm test: 309 passed | 15 expected fail (ninguno K08)

- [x] **E2E — no aplica**  
  Backend only. Spec declara N/A.

- [x] **Diff revisado — limpio**  
  Sin .env, credenciales, debug, código temporal.

- [x] **Prueba funcional — todos CA verificados**  
  12 CA (CA-1 a CA-12) verificados TC-1 a TC-12. Todos verdes.

## Revisiones independientes

- [x] **code-reviewer: aprobado**

- [x] **security-reviewer: aprobado**  
  STRIDE antes. Verifica K08/F3.5. isURL rechaza javascript:/data:, GET /products* público.

- [x] **anti-hallucination-reviewer: limpio**  
  Reutiliza categoryRoutes.js, middlewares existentes, isURL (images), factories.

- [ ] **tech-reviewer: FALTA**

- [ ] **Codex: FALTA**  
  Consultiva, no bloquea.

## Pendientes y backlog derivado

- [x] **Pendientes abiertos en spec**  
  CA-13 pendiente FASE 10.

- [ ] **Backlog derivado**  
  FALTA: Ningún nuevo.

## Consideraciones de seguridad

STRIDE (security-reviewer antes):

- **Spoofing:** JWT verify, sin cambios.
- **Tampering — corregido:** Antes cualquiera podía escribir. Después solo admin. Vector cerrado.
- **Repudiation:** Mejora — identidad verificable.
- **Information Disclosure:** Sin cambio. Errores genéricos.
- **Denial of Service:** Sin material.
- **Elevation of Privilege — central:** Escalada eliminada.

Controles: authMiddleware + isAdminMiddleware + isURL imageURL.

Superficie: POST/PUT/DELETE pública → protegida. GET sigue público.

## Razonamiento (Vibe Coding)

Se combinan F3.5 + BE-VALIDATE-IMAGEURL porque tocan productRoutes.js bajo riesgo conflicto. Reutiliza patrón categoryRoutes.js y regla URL de images. imageURL .optional() preserva comportamiento. Sin librerías nuevas. Cierra vectores documentados.

## Breaking changes

**Sí, breaking change real y declarado:**

- POST /api/products, PUT /api/products/:id, DELETE /api/products/:id pasan responder 201/200/204 sin token a 401 sin token (403 con customer).

- **Impacto verificado:** ningún consumidor frontend. SPA no rompe.

- **Impacto potencial:** consumidor externo que dependiera anterior se afecta. No hay conocido, declarado para trazabilidad.

- **ADR:** Seguridad vs. compatibilidad. Se eligió seguridad (cerrar K08/F3.5 Alto) sobre compatibilidad comportamiento nunca debería público ecommerce.
