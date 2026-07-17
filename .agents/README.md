# Capa de Subagentes — StyleBusters (MERN)

Extensión operativa del SSDLC ([`.claude/skills/SSDLC.md`](../.claude/skills/SSDLC.md)) para trabajo con subagentes bajo Vibe Coding disciplinado. **No reemplaza el SSDLC: lo operacionaliza.**

Regla maestra: **1 pendiente = 1 spec = 1 rama = 1 PR.** El orchestrator orquesta, los subagentes ejecutan, la integración es controlada.

## Índice

- Orquestador: [`orchestrator.md`](orchestrator.md)
- **Dispatch multiagente + blindaje (gates):** [`dispatch.md`](dispatch.md)
- **Mapa rol ↔ skills del harness:** [`skills-map.md`](skills-map.md)
- Roles: [`roles/`](roles/) — spec-writer, architecture-reviewer, frontend-builder, backend-builder, qa-test-designer, code-reviewer, security-reviewer, docs-keeper, anti-hallucination-reviewer, release-observability, learning-coach
- Workflows: [`workflows/`](workflows/) — [`ssdlc.md`](workflows/ssdlc.md) · [`feature-flow.md`](workflows/feature-flow.md) · [`bugfix-flow.md`](workflows/bugfix-flow.md)
- Plantillas: [`templates/`](templates/)
- Checklists: [`checklists/`](checklists/)

## Cómo se ejecuta una petición en modo multiagente

1. Todo entra por el **orchestrator** (agente principal).
2. Clasifica la petición y arma el pipeline según [`dispatch.md`](dispatch.md) §2.
3. Despacha cada rol como subagente con sus **entradas obligatorias** + **skills** ([`skills-map.md`](skills-map.md)).
4. Hace cumplir los **gates G0–G5** (blindaje) — ninguno se puede saltar.
5. Consolida evidencia e **integra** (solo el orchestrator mergea).

## Mapa de intervención por fase

| Fase SSDLC | Roles que intervienen |
|------------|-----------------------|
| 0 Contexto | orchestrator |
| 1 Clasificación + STRIDE | spec-writer, security-reviewer |
| 2 Historia SMART | spec-writer |
| 3 Spec Driven Design | spec-writer, architecture-reviewer (si hay ADR) |
| 4 Rama | builder |
| 5 Skill Audit | builder, architecture-reviewer |
| 6 Implementación segura | frontend/backend-builder, anti-hallucination-reviewer, security-reviewer |
| 7 Quality gates | qa-test-designer, release-observability (infra) |
| 8 Prueba funcional | qa-test-designer |
| 9 Pull Request | code-reviewer, security-reviewer, anti-hallucination-reviewer, release-observability (infra), orchestrator |
| 10 Cierre | docs-keeper, learning-coach, orchestrator |

## Protocolos obligatorios

1. **Sin spec aprobado no hay implementación.** El builder no abre rama sin spec.
2. **Sin evidencia no hay cierre.** Todo CA requiere prueba reproducible.
3. **El implementador no se autoaprueba.** code-reviewer y security-reviewer ≠ builder.
4. **Cambio de arquitectura ⇒ ADR** en `docs/adrs/`.
5. **Cada cambio actualiza spec/tests/docs** según corresponda (docs-keeper valida).
6. **Solo el orchestrator integra a `develop`.** Ningún subagente mergea.
7. **Hallazgo nuevo ⇒ propuesta, no ejecución.** Se escala; no se expande alcance solo.
8. **Un pendiente por rama.** Nunca mezclar tareas no relacionadas.

## Reglas de Vibe Coding (IA)

1. **No inventar archivos/rutas:** validar contra el árbol real (anti-hallucination-reviewer).
2. **No usar librerías no instaladas:** verificar `package.json` del proyecto correspondiente.
3. **No asumir contratos de API:** usar los definidos en `CLAUDE.md`/código; si falta, escalar.
4. **Marcar lo temporal:** `// TODO(temporal):` + registro en el spec; nunca mezclar con definitivo sin marca.
5. **Validar contra el repo real** antes de afirmar que algo existe.
6. **Exigir evidencia funcional:** captura, request/response o test, no "debería funcionar".
7. **Explicar el razonamiento:** 2-4 líneas de por qué esta solución y qué tradeoff se aceptó (campo en el PR).

## Enfoque pedagógico (alumnos)

- **Explicar tradeoffs:** cada decisión no trivial lista alternativa descartada y por qué.
- **Justificar decisiones:** el "por qué" queda en spec/ADR, no solo en la cabeza.
- **Errores → lecciones:** el cierre del spec registra "lecciones aprendidas" y la causa raíz del bug.
- **Evitar dependencia ciega de la IA:** el alumno valida contra el repo, ejecuta la evidencia y explica el cambio con sus palabras antes de dar por bueno el trabajo del agente.
