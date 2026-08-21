## Descripcion

Se corrigio la maquetacion de todas las paginas con ruta de la SPA (Style-Busters-main) para mejorar la coherencia visual. La causa raiz fue la dispersion de custom properties CSS indefinidas en 11+ archivos que hacian que componentes como tarjetas, formularios y secciones de checkout se vieran transparentes o con fallbacks de tema claro. Se eliminaron 4 enlaces a rutas inexistentes del header (ofertas del dia, novedades, mas vendidos, flash sale), se consolido todo el CSS sobre los tokens reales de la paleta ya definida en index.css, se resolvio la deduplicacion de CartView.css/CartPage.css, y se dio estilo al archivo huerfano RegisterForm.css.

## Spec

docs/specs/2026-08-20-feature-frontend-ui-consistencia-visual.md  ·  Backlog ID: FE-UI-CONSISTENCY-2026-08-20

## Tipo de cambio
- [x] Feature

## Criterios de aceptacion

- [x] CA-1: Header sin enlaces a paginas inexistentes — Evidencia: docs/test-plans/2026-08-20-feature-frontend-ui-consistencia-visual.md TC-1, TC-15. Estado: cumplido.

- [x] CA-2: Home mantiene catalogo en tarjetas — Evidencia: TC-2. Estado: cumplido.

- [x] CA-3: ProductDetails con estilo coherente — Evidencia: TC-3. Estado: cumplido.

- [x] CA-4: Ningun color nuevo fuera de la paleta existente — Evidencia: TC-4. Estado: cumplido (hallazgo detectado en revisión, corregido en commit 8240a2a9).

- [x] CA-5a: SearchResults sin fallbacks de tema claro — Evidencia: TC-5. Estado: cumplido.

- [x] CA-5b: Checkout sin fallbacks y coincidencia exacta className — Evidencia: TC-6, TC-7. Estado: cumplido (hallazgo detectado en revisión, corregido en commit b92057c8).

- [x] CA-5c: Cart/CartView reutilizado en Checkout — Evidencia: TC-8, TC-16. Estado: cumplido.

- [x] CA-5d: Login sin colision de clases — Evidencia: TC-9. Estado: cumplido.

- [x] CA-5e: RegisterForm.css no vacio — Evidencia: TC-10. Estado: cumplido (hallazgo detectado en revisión, corregido en commit 8240a2a9).

- [x] CA-5f: Profile con tokens resueltos — Evidencia: TC-11. Estado: cumplido.

- [x] CA-5g: Home/ConfirmationPage sin regresion — Evidencia: TC-12. Estado: cumplido.

- [x] CA-6: Sin contenido inventado — Evidencia: TC-13. Estado: cumplido.

- [x] CA-7: Diagnostico del bug de imagen de producto — Evidencia: TC-14. Estado: cumplido.

Resumen: 13 CA cumplidos, 0 parciales, 0 no cumplidos.

## Quality Gates

- [x] Lint/build — PASS (npm run build: 104.17 kB gzip; 8 warnings ESLint en archivos NO tocados por esta rama)
- [x] Tests — PASS (50 archivos, 205 tests, 0 fallidos, 19.70s)
- [ ] E2E — FALTA (npm run e2e:ci:headless; limitacion conocida: sandbox sin Chrome/CDP)
- [x] Diff revisado — PASS (22 archivos, +668/-1007, según `gh pr view 10`)
- [x] Prueba funcional — PASS (14 casos de prueba TC-1 a TC-16)

## Revisiones independientes

- [x] code-reviewer: aprobado (cambios requeridos corregidos en commits 559b365a y 38cee3de)
- [x] security-reviewer: aprobado, sin hallazgos (STRIDE N/A; cambio puramente de presentacion)
- [x] anti-hallucination-reviewer: limpio (hallazgos corregidos en commits 6b6a6a6d, 8240a2a9, 38cee3de)
- [x] tech-reviewer: **APTO** (verificado directamente contra HEAD: tests 205/205, build OK, claims de CA-4/CA-5b/CA-5e re-confirmadas, mergeStateStatus CLEAN)
- [ ] Segunda opinion (Codex): FALTA (no disponible en este entorno)

## Pendientes y backlog derivado

- [x] Pendientes abiertos registrados en el spec:
  1. Toggle de tema claro/oscuro: no existe selector [data-theme="light"], candidato a backlog
  2. SearchResultsList.jsx linea 115: enlace roto to="/offers", candidato a backlog
  3. Pages/ProductDetailPage.css: codigo muerto, candidato a backlog

- [ ] Backlog accionable creado: FALTA (pendientes requieren escalacion a tickets por orchestrator)

## Consideraciones de seguridad

Amenazas STRIDE N/A (cambio puramente de presentacion CSS/JSX estructural):
- Spoofing: N/A (no se toca AuthContext, LoginForm logica, ProtectedRoute, tokens)
- Tampering: N/A (no se modifican payloads API, guards de autorizacion, validadores)
- Repudiation: N/A (no se toca logging)
- Information Disclosure: N/A (no se exponen datos nuevos)
- Denial of Service: N/A (CSS estatico, sin bucles/timers/llamadas de red nuevas)
- Elevation of Privilege: N/A (rutas protegidas intactas)

Controles: ninguno adicional requerido.

## Razonamiento (Vibe Coding)

Causa raiz: 3 familias de custom properties CSS indefinidas dispersas en archivos. Solucion: consolidar todo sobre 9 tokens reales de index.css en lugar de definir :root paralelos (respeta restriccion explicita del spec). Tradeoff: diff grande disperso (riesgo de revision) por claridad de fuente unica de verdad y coherencia visual global.

## Breaking changes

Ninguno. Cambio puramente de presentacion (CSS y JSX estructural minimo).

---

Rama: feature/frontend-ui-consistencia-visual (13 commits sobre develop)
Cambios: 20 archivos, +497/-931 lineas
