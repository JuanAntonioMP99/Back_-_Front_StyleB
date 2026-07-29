# Workflow: Feature Flow

Flujo de una **feature** bajo la capa de subagentes. Mapea 1:1 con las fases del SSDLC canónico. Regla base: **1 pendiente = 1 spec = 1 rama = 1 PR**.

## Precondición
- Pendiente en el **backlog aprobado** (post-baseline).
- `develop` actualizado, entorno limpio (`git status`).

## Secuencia

| # | Paso | Rol responsable | Artefacto | Fase SSDLC |
|---|------|-----------------|-----------|------------|
| 1 | Seleccionar pendiente y entregar entradas obligatorias | orchestrator | asignación | 0 |
| 2 | Clasificar + STRIDE | spec-writer + security-reviewer | sección STRIDE | 1 |
| 3 | Historia SMART + CA | spec-writer | spec DRAFT | 2 |
| 4 | Redactar spec completo | spec-writer | `docs/specs/…md` | 3 |
| 5 | ¿Cambia arquitectura? → ADR | architecture-reviewer | `docs/adrs/…md` | 3 |
| 6 | Crear rama `feature/...` desde `develop` | builder | rama | 4 |
| 7 | Skill Audit (reutilizar antes de crear) | builder | nota en spec | 5 |
| 8 | Implementar | frontend-builder / backend-builder | código | 6 |
| 9 | Validar referencias contra repo real | anti-hallucination-reviewer | reporte | 6 |
| 10 | Quality gates + plan de prueba | qa-test-designer | `docs/test-plans/…md` | 7 |
| 11 | Prueba funcional por CA | qa-test-designer | evidencia | 8 |
| 12 | Revisión de seguridad | security-reviewer | veredicto | 9 |
| 13 | Revisión de código (≠ builder) | code-reviewer | veredicto | 9 |
| 14 | Llenar la plantilla de PR (sin inventar, `FALTA:` si falta) | pr-publisher (Haiku) | cuerpo del PR | 9 |
| 15 | Abrir PR a `develop` | builder | PR (plantilla) | 9 |
| 16 | Auditar el PR abierto (claims↔evidencia, spec↔diff, riesgo) | tech-reviewer | veredicto APTO/CAMBIOS | 9 |
| 17 | 2ª opinión consultiva (no gate) | Codex | nota en el PR | 9 |
| 18 | Evaluar DoD + consolidar + integrar | orchestrator | merge | 9 |
| 19 | Cerrar spec + docs | docs-keeper | spec DONE | 10 |

## Puertas de bloqueo
- Sin spec aprobado → no hay rama.
- Reporte de alucinación no resuelto → no hay QA.
- Veredicto de seguridad o code-review "bloqueado" → no hay merge.
- tech-reviewer = **CAMBIOS** → no hay merge (re-despacho al agente del mapa de la DoD; tope 3 iteraciones y luego escala al usuario).
- CA sin evidencia → no se cierra el spec.
