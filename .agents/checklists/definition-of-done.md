# Definition of Done — loop de cierre (orchestrator)

DoD **verificable** que el orchestrator evalúa **ítem por ítem al final de cada ciclo**.
Consolida los checklists de área (`frontend-dod.md`, `backend-dod.md`) y el
`pr-checklist.md` con los gates G0–G5 de [`dispatch.md`](../dispatch.md), y añade el
**mapa ítem→agente** para el re-despacho.

## Regla del loop

1. El orchestrator recorre la tabla; cada ítem es **✓** (con evidencia) o **✗**.
2. Cada **✗** se **re-despacha al agente responsable** de la columna "Agente".
3. **Tope: 3 iteraciones.** Si tras 3 vueltas persiste un ✗, el orchestrator **escala al usuario** con el estado y las opciones.
4. **Nada se reporta como "terminado" con algún ✗.** No se aprueba un gate por excepción.

## Tabla de DoD (ítem → gate → verificación → agente)

| # | Ítem (Done si…) | Gate | Verificación concreta (evidencia) | Agente responsable (re-despacho) |
|---|-----------------|------|-----------------------------------|----------------------------------|
| 1 | Contexto leído; `develop` limpio y actualizado | G0 | `git status` limpio; rama parte de `develop` | orchestrator |
| 2 | Spec con historia SMART + CA + STRIDE, aprobado y commiteado | G1 | `docs/specs/…md` existe con las secciones; aprobado | spec-writer |
| 3 | ADR si cambia arquitectura/contratos | G1 | `docs/adrs/ADR-NNNN-…md` presente y enlazado | architecture-reviewer |
| 4 | Sin referencias inventadas (archivos/rutas/endpoints/libs/campos) | G2 | Reporte anti-alucinación **limpio** | anti-hallucination-reviewer |
| 5 | Código frontend cumple patrón y DoD de área | G3 | `frontend-dod.md` cerrado; `cd Style-Busters-main && npm run build` OK | frontend-builder |
| 6 | Código backend cumple patrón y DoD de área | G3 | `backend-dod.md` cerrado; requests reales con status/payload | backend-builder |
| 7 | Tests verdes + cobertura (trinquete) | G3 | `Style-Busters-main`: `npm test` (Vitest) · `Base_Datos_StyleB`: `npm test` + `npm run test:coverage` | qa-test-designer |
| 8 | E2E verde (si aplica a UI) | G3 | `cd Style-Busters-main && npm run e2e:ci:headless` | qa-test-designer |
| 9 | Cada CA con evidencia reproducible | G3 | `docs/test-plans/…md` con evidencia por CA | qa-test-designer |
| 10 | Diff sin secrets ni `console.log` de debug | G3/G4 | `git diff develop..HEAD` + grep de secrets | code-reviewer |
| 11 | Veredicto de code-review = aprobado (≠ builder) | G4 | reporte con veredicto | code-reviewer |
| 12 | Veredicto de seguridad = aprobado o N/A justificado | G4 | reporte STRIDE + veredicto | security-reviewer |
| 13 | PR llenado desde plantilla, sin inventar (`FALTA:` donde falte) | G4 | `.github/PULL_REQUEST_TEMPLATE.md` completado | pr-publisher |
| 14 | Auditoría del PR abierto = APTO (claims↔evidencia, spec↔diff, riesgo integración) | G4 | reporte tech-reviewer con veredicto APTO | tech-reviewer |
| 15 | Segunda opinión Codex registrada (consultiva, no gate) | — | nota "Segunda opinión (Codex)" en el PR | orchestrator (consulta Codex) |
| 16 | CI en verde | G3 | `.github/workflows/ci.yml` pasa (unit + build + e2e) | release-observability |
| 17 | Spec cerrado (Resultados + Matriz) + pendientes → backlog con ID | G5 | spec en `DONE`; entradas de backlog creadas | docs-keeper |

## Gates reales de este repo (comandos)

```bash
# Frontend (Style-Busters-main/)
npm test                 # Vitest (unit + componentes)
npm run build            # compila + ESLint (no hay type-check: es JS)
npm run e2e:ci:headless  # Cypress E2E (backend efímero + CRA + headless)

# Backend (Base_Datos_StyleB/)
npm test                 # Vitest (unit + integración)
npm run test:coverage    # cobertura con umbrales (trinquete)

# Transversal
git diff develop..HEAD | grep -E "(password|secret|token|key)\s*=\s*['\"][^'\"]{8,}"   # secrets
```

> Nota: no hay `type-check` (proyecto JS) ni script de `lint`/`format` independiente;
> el lint del frontend corre dentro de `npm run build` (CRA). El backend no tiene lint
> configurado: su gate son los tests + revisión.

## Escalado (tras 3 iteraciones)

El orchestrator entrega al usuario: ítem(s) en ✗, agente(s) involucrado(s), qué se
intentó en cada iteración y las opciones viables. No se marca DONE ni se integra.
