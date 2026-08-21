## Descripción

Se elimina deuda técnica frontend acumulada en 6 hallazgos independientes ya registrados en docs/backlog.md: 3 archivos CSS huérfanos (ProductDetailPage.css, HomePage.css, regla .main-content de Layout.css), 1 prop no consumida (className="list-item" en List.jsx), 1 parámetro typo (titile en List.jsx), y 1 inconsistencia de atributos de carga de imagen. Sin cambio de comportamiento observable salvo la mejora de performance de loading="lazy".

## Spec
docs/specs/2026-08-21-refactor-frontend-housekeeping.md · Backlog ID: FE-HOUSEKEEPING-2026-08-21

## Tipo de cambio
- [x] Refactor

## Criterios de aceptación

- [x] **CA-1:** loading="lazy" y decoding="async" en ImageCarousel.jsx. El <img> de Components/ImageCarousel/ImageCarousel.jsx agrega loading="lazy" y decoding="async", mismo patrón literal que ProductCard.jsx/CartView.jsx (líneas 30-31 del commit 741129be). Verificable: git diff de ImageCarousel.jsx muestra únicamente la adición de los dos atributos; npm test -- ImageCarousel pasa sin cambios en los 5 tests existentes (resultado real: Tests 5 passed (5), TC-1).

- [x] **CA-2:** Pages/ProductDetailPage.css eliminado. El archivo Style-Busters-main/src/Pages/ProductDetailPage.css (83 líneas) se borra del repositorio (commit f56819cb). Verificable: git diff --stat lo marca eliminado; npm run build completa sin errores de módulo no encontrado; npm test sin regresiones (resultado real: build exitoso, TC-2).

- [x] **CA-3:** Pages/HomePage.css eliminado. El archivo Style-Busters-main/src/Pages/HomePage.css (25 líneas) se borra del repositorio (commit f56819cb). Verificable: npm test 223/223 pasados (resultado real: TC-3).

- [x] **CA-4:** Regla .main-content eliminada de Layout.css. Style-Busters-main/src/Layout/Layout.css deja de contener el bloque .main-content (15 líneas); el resto del archivo (.layout, @media print) no cambia (commit f56819cb). Verificable: grep -r "main-content" src → 0 coincidencias (resultado real: TC-4).

- [x] **CA-5:** className="list-item" eliminado de List.jsx. Components/List/List.jsx deja de pasar className="list-item" en sus dos invocaciones de <ProductCard> (commit b9a92d04). Verificable: grep -r "list-item" src → 0 coincidencias; npm test 223/223 pasados (resultado real: TC-5).

- [x] **CA-6:** Parámetro titile eliminado de List.jsx, sin agregar renderizado de título. La firma de List.jsx pasa de ({products = [], titile = "Nuestros productos", layout = "grid"}) a ({products = [], layout = "grid"}) (commit b9a92d04). El comentario de Pages/HomePage.integration.test.jsx se actualiza; la aserción no cambia. Verificable: grep -n "titile" List.jsx → 0 coincidencias; npm test 223/223 pasados (resultado real: TC-6).

## Quality Gates

- [x] **Lint/build — sin errores** (npm run build en frontend Style-Busters-main). Resultado: compila exitosamente, 8 warnings preexistentes de ESLint, 0 errores (evidencia: plan de prueba, línea 101).

- [x] **Tests — todos pasan** (npm test en Style-Busters-main). Resultado: Test Files 52 passed (52), Tests 223 passed (223), sin fallos ni regresiones (evidencia: plan de prueba, TC-7, línea 91).

- [ ] **E2E — N/A** (cambios de presentación pura, sin flujos de usuario interactivos afectados; no se toca backend ni rutas de API).

- [x] **Diff revisado** (sin secrets, sin console.log de debug, sin código temporal sin marcar). Resultado: 3 commits de implementación + 1 plan de prueba; contenido: eliminación de archivos/CSS/props/parámetros, adición de 2 atributos HTML (evidencia: plan de prueba, auditoría de commits f56819cb~1..741129be).

- [x] **Prueba funcional — todos los CA verificados con evidencia.** 6/6 CAs cumplidos, cada uno con test case (TC-1 a TC-6) y resultado real documentado (evidencia: plan de prueba, sección "Veredicto", línea 104-114).

## Revisiones independientes (no las hace el builder)

- [x] **code-reviewer: aprobado** (sin hallazgos; revisión completada).

- [x] **security-reviewer: aprobado** (STRIDE evaluado explícitamente en spec: Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege — todos N/A excepto DoS en CA-1, evaluado como mitigación de carga sin riesgo; evidencia: spec sección "Consideraciones de Seguridad", línea 50-62).

- [x] **anti-hallucination-reviewer: limpio** (sin rutas/endpoints/libs inventadas; verificación exhaustiva de código real en "Contexto" del spec, puntos 1-6, línea 21-34).

- [ ] **tech-reviewer: FALTA** Se ejecutará sobre el PR abierto (gate G5 del SSDLC).

- [ ] **Segunda opinión (Codex): FALTA** No disponible en este entorno; es consultiva, no bloquea merge.

## Pendientes y backlog derivado

- [x] **Pendientes abiertos registrados en el spec:** Los 6 hallazgos (FE-IMAGECAROUSEL-LAZY-LOADING-2026-08-21, FE-DEAD-CSS-PRODUCTDETAILPAGE-2026-08-20, FE-DEAD-CSS-HOMEPAGE-2026-08-21, FE-DEAD-CSS-LAYOUT-MAINCONTENT-2026-08-21, FE-DEAD-PROP-LISTITEM-2026-08-21, FE-TYPO-TITILE-2026-08-21) que integra este pendiente se encuentran ya registrados en docs/backlog.md (estado E5 antes de este PR); se cierran al mergear.

- [x] **Backlog accionable creado:** Ningún backlog nuevo esperado. Si el ejecutor (frontend-builder) detectó durante la implementación algún hallazgo no anticipado aquí, se escaló según SSDLC 11.7 (ver spec línea 19); este PR refleja solo lo planeado en el spec.

## Consideraciones de seguridad

**Amenazas STRIDE evaluadas explícitamente para cada uno de los 6 puntos (no descartadas por defecto):**
- **Spoofing:** N/A — ninguno toca AuthContext, ProtectedRoute, utils/auth.js.
- **Tampering:** N/A — CA-2/CA-3/CA-4 eliminan CSS sin efecto visual (huérfano); CA-5/CA-6 eliminan props/parámetros inertes; CA-1 solo agrega atributos de carga de imagen.
- **Repudiation:** N/A — no se toca logging ni auditoría.
- **Information Disclosure:** N/A — no se agrega ni se retira ningún dato mostrado al usuario; los CSS eliminados no estaban aplicando estilos a nada visible.
- **Denial of Service:** N/A en CA-2 a CA-6. Evaluado explícitamente para CA-1 (loading="lazy"): es una mitigación de carga (reduce solicitudes de red), no un vector de agotamiento; sin riesgo (evidencia: spec línea 57).
- **Elevation of Privilege:** N/A — ninguno modifica ProtectedRoute.jsx ni flujos de permisos; todos los archivos son de presentación pública.

**Conclusión:** Sin controles de mitigación nuevos requeridos. Superficie de ataque no afectada.

## Razonamiento (Vibe Coding)

Se resuelven 6 hallazgos de deuda técnica ya registrados mediante eliminación de código verificado como muerto (búsqueda exhaustiva por string en "Contexto" del spec, puntos 1-6). La solución elige el camino de menor riesgo: eliminar sin agregar funcionalidad no pedida (no se renderiza ningún título para List.jsx; no se deja el código muerto). loading="lazy" se aplica incondicional al único <img> de ImageCarousel.jsx, alineando con el precedente de ProductCard.jsx (ya en producción con el mismo atributo en imágenes visibles al cargar) y confiando en la heurística nativa del navegador para el elemento visible — sin lógica condicional por currentIndex (descartada: over-engineering). Trade-off aceptado: la verificación visual de "sin parpadeo" al combinar loading="lazy" con key={currentIndex} no está automatizada en Vitest/jsdom (no implementa IntersectionObserver), se documenta como limitación conocida heredada del spec (ver "Riesgos y Deuda Técnica" del spec, línea 95), no bloqueante.

## Breaking changes

**Ninguno de comportamiento observable para el usuario**, salvo la mejora de performance esperada:
- loading="lazy" en ImageCarousel.jsx (CA-1): reduce bytes descargados/tiempo de carga inicial cuando la imagen no es la visible de inmediato (carga diferida nativa del navegador).
- Eliminación de código muerto (CA-2 a CA-6): sin impacto visual, sin cambio de comportamiento observable.

**Nota:** Los consumidores HomePage.jsx y SearchResultsList.jsx siguen pasando title="..." a <List>, que React descarta silenciosamente como prop no desestructurada (mismo comportamiento que hoy, antes de este PR).

---

**Rama:** refactor/frontend-housekeeping · **Rebaseada sobre:** develop · **Commits:** 4 (3 implementación f56819cb, b9a92d04, 741129be + 1 plan de prueba) · **Estado de gates:** G3 (tests/build) ✅ | G4 (revisiones code/security/anti-hallucination) ✅ | G5 (tech-reviewer) ⏳
