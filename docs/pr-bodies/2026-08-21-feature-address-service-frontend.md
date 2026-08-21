## Descripción

Se ha agregado el servicio `addressService.js` al frontend, conectando las operaciones de Direcciones al dominio `/api/addresses` del backend. El servicio exporta 5 funciones (`getMyAddresses`, `getDefaultAddress`, `createAddress`, `updateAddress`, `deleteAddress`) que replican el patrón exacto de los servicios ya conectados (`categoryService`, `productService`, `cartService`), dejando lista la infraestructura para reemplazar el mock actual (`shippingService.js`) en futuros pendientes (F4.3 Pagos, F4.4 Checkout real).

## Spec

`docs/specs/2026-08-21-feature-address-service-frontend.md`  ·  **Backlog ID:** F4.2 (K14)

## Tipo de cambio

- [x] Feature

## Criterios de aceptación

- [x] **CA-1** — `getMyAddresses()` hace `GET /addresses` y retorna el array desenvuelto. Evidencia: `docs/test-plans/2026-08-21-feature-address-service-frontend.md` · TC-1 · CUMPLIDO.
- [x] **CA-2** — `getDefaultAddress()` no hace llamada HTTP propia; deriva de `getMyAddresses()` con los 3 casos (marcada como default, fallback a primera, lista vacía → null). Evidencia: TC-2 · 3 subcasos CUMPLIDOS.
- [x] **CA-3** — `createAddress(address)` hace `POST /addresses` sin transformar el payload. Evidencia: TC-3 · CUMPLIDO.
- [x] **CA-4** — `updateAddress(addressId, address)` hace `PUT /addresses/:addressId`. Evidencia: TC-4 · CUMPLIDO.
- [x] **CA-5** — `deleteAddress(addressId)` hace `DELETE /addresses/:addressId`. Evidencia: TC-5 · CUMPLIDO.
- [x] **CA-6** — Ninguna de las 5 funciones atrapa errores; se propagan ya clasificadas por `apiClient`. Evidencia: TC-6 · 0 ocurrencias de `try/catch` en `addressService.js` · CUMPLIDO (verificación por inspección de código).
- [x] **CA-7** — El test `addressService.test.js` cubre las 5 funciones con mocks de `apiClient`, sin red real. Evidencia: TC-7 · Test Files 52 passed (52), Tests 223 passed (223), incluidos los 7 casos de `addressService.test.js` · CUMPLIDO.
- [x] **CA-8** — Ambos archivos (`addressService.js`, `addressService.test.js`) quedan trackeados en git. Evidencia: TC-8 · git show --stat 1adf27b1 confirma ambos en el commit · CUMPLIDO.
- [x] **CA-9** — Fuera de alcance confirmado. Ningún componente, página, `shippingService.js`, `Data/shipping-address.json` ni archivo de `Base_Datos_StyleB/` se modifica. Evidencia: TC-9 · diff toca solo 2 archivos de código (addressService.js, addressService.test.js) + spec + plan · CUMPLIDO.

## Quality Gates

- [x] **Lint/build** — sin errores. `npm run build` exitoso (frontend); warnings de ESLint preexistentes no relacionados con `addressService.js`.
- [x] **Tests** — todos pasan. `npm test` (Style-Busters-main, vitest): Test Files 52 passed (52), Tests 223 passed (223), Duration 22.55s. Los 7 casos de `addressService.test.js` incluidos y verificados de forma dirigida.
- [x] **E2E** — N/A (cambio acotado a 2 archivos de servicio sin consumidor real; CA-9 confirma que ningún componente/página importa `addressService.js` todavía).
- [x] **Diff revisado** — limpio. git diff develop...feature/address-service-frontend --stat: 4 archivos (2 de código, 2 de documentación); 0 secrets, 0 console.log de debug, 0 código temporal sin marcar.
- [x] **Prueba funcional** — todos los CA verificados con evidencia. TC-1 a TC-9 CUMPLIDOS; veredicto final: Gate G3 verde.

## Revisiones independientes

- [x] **code-reviewer:** aprobado (sin hallazgos).
- [x] **security-reviewer:** N/A justificado. Servicio transparente de paso directo a `apiClient` sobre una API ya protegida (authMiddleware + filtrado por req.user.userId en el backend, verificado en spec de backend K04/F3.1). Amenazas STRIDE evaluadas en el spec: todas N/A nuevo; se hereda protección del backend sin código nuevo requerido.
- [x] **anti-hallucination-reviewer:** limpio (sin rutas/endpoints/librerías inventadas; todas las 5 funciones y sus paths validados contra el contrato real de addressController.js/addressRoutes.js).
- [ ] **tech-reviewer:** FALTA: auditoría del PR abierto (claims↔evidencia, spec↔diff, riesgo de integración) aún no despachada.
- [ ] **Segunda opinión (Codex):** FALTA: consultiva, no bloquea merge.

## Pendientes y backlog derivado

- [x] Pendientes abiertos registrados en el spec. Documentados en `docs/specs/2026-08-21-feature-address-service-frontend.md` · sección "Pendientes Abiertos y Gaps Detectados":
  - Wrapper de `GET /api/addresses/:addressId` (obtener una dirección individual) — sin consumidor conocido hoy, no implementado.
  - Mapeo de forma de datos entre el mock (shippingService.js/Data/shipping-address.json) y el contrato real (Address del backend) — a resolver por el pendiente que conecte la UI.
- [x] Backlog accionable creado y referenciado. F4.3 (Pagos) y F4.4 (Checkout real) quedan como consumidores conocidos.

## Consideraciones de seguridad

Amenazas STRIDE evaluadas:

- **Spoofing:** N/A — identidad no toca; JWT validado por authMiddleware en backend, inyectado por interceptor de apiClient.js.
- **Tampering:** N/A — sin persistencia local; función de transporte puro.
- **Repudiation:** N/A — sin logging de auditoría nuevo.
- **Information Disclosure:** N/A — datos de dirección ya autorizados por el usuario autenticado (self-service, filtrado por req.user.userId en backend).
- **Denial of Service:** N/A — 1 petición HTTP por invocación de función, sin bucles ni timers.
- **Elevation of Privilege:** N/A — backend ignora cualquier `user` en el payload; cliente no puede forzar esa validación.

**Controles:** herencia de authMiddleware + filtrado por dueño del backend (K04, DONE) y clasificación de errores en apiClient.js. Sin validación nueva en cliente (responsabilidad exclusiva de express-validator en backend).

## Razonamiento (Vibe Coding)

Este servicio es un wrapper fino sobre la API ya protegida de Direcciones (K04, DONE en backend). Se replica el patrón de categoryService/productService/cartService (transparencia de transporte, sin lógica de negocio en cliente, validación delegada a backend). getDefaultAddress() calcula en cliente (sin endpoint HTTP propio) para evitar una segunda petición innecesaria, reutilizando el orden isDefault: -1, _id: -1 que ya aplica el backend. No se conecta UI todavía (CA-9, fuera de alcance); el único consumidor es el test unitario. Tradeoff: sin E2E verificado contra backend real, pero tests unitarios + validación de contrato contra código real de backend + code-reviewer aprobado = confianza moderada para cierre de F4.2, pendiente de auditoría final de tech-reviewer sobre el PR abierto.

## Breaking changes

Ninguno. Servicio nuevo sin consumidor existente; sin cambios a API pública existente, sin cambios a componentes, sin cambios a backend.

---

**Commits incluidos (rama feature/address-service-frontend desde develop):**

1. c1230cdf — docs: spec feature-address-service-frontend
2. 1adf27b1 — feat(address-service): conectar servicio frontend a /api/addresses
3. c03dd708 — test: plan de pruebas gate G3 para feature-address-service-frontend (F4.2)

**Archivos modificados:**

- Style-Busters-main/src/Services/addressService.js (+30 líneas) — servicio exportando 5 funciones
- Style-Busters-main/src/Services/addressService.test.js (+91 líneas) — test unitario con 7 casos, todos verde
- docs/specs/2026-08-21-feature-address-service-frontend.md (+134 líneas) — spec completo con CA-1 a CA-9
- docs/test-plans/2026-08-21-feature-address-service-frontend.md (+173 líneas) — plan de prueba detallado, todos los TC CUMPLIDOS, Gate G3 verde
