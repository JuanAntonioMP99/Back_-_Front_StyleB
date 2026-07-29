# ADR-0001: Harness de modelos y agentes versionado en el repo

> Architecture Decision Record. Ubicación: `docs/adrs/ADR-0001-harness-modelos-y-agentes.md`.

## Metadata
- **Estado:** aceptada
- **Fecha:** 2026-07-23
- **Autor (rol):** architecture-reviewer
- **Spec relacionado:** `docs/specs/2026-07-23-infra-harness-modelos-agentes.md`
- **Backlog ID:** HARNESS-01

## Contexto
El repo ya tenía un harness **conceptual** en `.agents/` (orchestrator, dispatch con
gates G0–G5, skills-map, 11 roles, workflows, checklists, plantillas) que operacionaliza
`.claude/skills/SSDLC.md`, pero **nada ejecutable por Claude Code**: sin `.claude/agents/`
con `model:`, sin `.claude/settings.json`, sin política de modelos, sin Codex. Se necesita
que **todo el equipo que clone reciba el mismo contexto** y que el ciclo SSDLC corra en
modo multiagente de forma reproducible, no con configuración solo-local.

## Decisión
Versionar en el repo un harness ejecutable: una **política de modelos dura** (Fable
orquesta y solo orquesta; Sonnet ejecuta; Opus solo como override justificado; Haiku
mecánico), **13 agentes** `.claude/agents/*.md` (11 roles existentes + `tech-reviewer` +
`pr-publisher`) que **delegan** en `.agents/roles/*`, **Codex** como segunda opinión
consultiva declarada en `.claude/settings.json`, y una **Definition of Done verificable**
con loop de cierre (mapa ítem→agente, tope de 3 iteraciones, escalado). Se crea la rama
`develop` como integración, coherente con el harness existente.

## Alternativas consideradas
| Alternativa | Pros | Contras | Descartada porque |
|-------------|------|---------|-------------------|
| A. Agentes "thin" que delegan en `.agents/roles/*` (elegida) | DRY; una sola fuente de verdad; fácil de mantener | Un nivel de indirección | — (elegida) |
| B. Agentes "fat" con el rol inline en cada `.claude/agents/*.md` | Autocontenidos | Duplican los role-docs; se desincronizan del harness | Rompe Single Source of Truth |
| C. Solo documentar la política sin agentes ejecutables | Menos archivos | No es ejecutable; sigue siendo config conceptual | No cumple el objetivo (harness ejecutable) |
| D. Mantener solo `main` (sin `develop`) | Un tronco | Contradice SSDLC/dispatch/workflows que asumen `develop` | Incoherencia con el harness ya escrito |

## Consecuencias
- **Positivas:** contexto idéntico para todo el equipo; pipeline de `dispatch.md`
  ejecutable de extremo a extremo; modelos asignados por tipo de trabajo; cierre auditable.
- **Negativas / deuda asumida:** un nivel de indirección (agente → role-doc); fijar el
  main loop a Fable asume acceso de todo el equipo (override local documentado); el esquema
  de plugins puede variar entre versiones de Claude Code (verificar con `/plugin`).
- **Impacto en seguridad:** `settings.json` sin secretos; Codex **consultivo, nunca gate
  único** (evita dependencia de un tercero para integrar); mínimo privilegio de `tools`
  por agente; Haiku no toma decisiones de seguridad.
- **Impacto en contratos de API / modelos:** ninguno (cambio de infra/proceso; no toca código de producto).

## Cumplimiento
- [x] Refleja el harness real (no intención): delega en `.agents/*` existentes.
- [ ] Contratos actualizados en `docs/contracts/` si aplica (N/A: no cambia API).
- [x] `CLAUDE.md` actualizado con la sección del harness de modelos y agentes.
