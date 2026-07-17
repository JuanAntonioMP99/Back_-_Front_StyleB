# Mapa Rol ↔ Skills del harness

Fuente única de qué skills carga cada subagente al ejecutarse en modo multiagente. **El orchestrator inyecta estos skills** al despachar cada rol (ver [`dispatch.md`](dispatch.md)).

Dos conjuntos de skills, ambos reales en el repo:

- **Dominio** — `.claude/skills/*.md` (raíz). Definen el patrón real del código MERN.
- **Harness** — `Style-Busters-main/.claude/skills/<skill>/SKILL.md` (+ espejo en `.agents/skills/`), gobernados por `Style-Busters-main/skills-lock.json`.

## Tabla rol → skills

| Rol | Skills de dominio (`.claude/skills/`) | Skills del harness |
|-----|----------------------------------------|--------------------|
| orchestrator | `SSDLC.md`, `Git Workflow.md` | — (delega) |
| spec-writer | `SSDLC.md`, `API Best Practices.md` | — |
| architecture-reviewer | `SSDLC.md`, `API Best Practices.md`, `Express + MongoDB.md`, `MongoDB Patterns.md`, `Node.js Best Practices.md`, `React.md`, `Git Workflow.md` | `agent-development` |
| backend-builder | `Express + MongoDB.md`, `MongoDB Patterns.md`, `Node.js Best Practices.md`, `API Best Practices.md`, `Git Workflow.md` | `best-practices` |
| frontend-builder | `React.md`, `Frontend Design.md`, `Git Workflow.md` | `frontend-design`, `accessibility`, `core-web-vitals`, `best-practices` |
| qa-test-designer | `Testing Strategies.md`, `API Best Practices.md` | `browser-use`, `web-quality-audit` |
| code-reviewer | `Node.js Best Practices.md`, `React.md`, `API Best Practices.md`, `Git Workflow.md` | `best-practices` |
| security-reviewer | `SSDLC.md`, `Express + MongoDB.md`, `API Best Practices.md` | `best-practices` |
| docs-keeper | `SSDLC.md`, `Git Workflow.md` | — |
| anti-hallucination-reviewer | `SSDLC.md` (+ el skill de dominio del área tocada) | — |
| release-observability | `Node.js Best Practices.md`, `Git Workflow.md`, `Testing Strategies.md` | `performance`, `core-web-vitals`, `web-quality-audit`, `best-practices`, `browser-use` |
| learning-coach | `SSDLC.md`, `Testing Strategies.md` | `agent-development` |

## Reglas de carga

1. Un rol **solo** carga los skills de su fila: least privilege de contexto.
2. Si el área tocada no coincide con los skills del rol (p. ej. backend-builder en un cambio de UI), el orchestrator **reasigna el rol correcto**, no amplía skills.
3. `anti-hallucination-reviewer` carga el skill de dominio del área que valida (backend → `Express + MongoDB.md`; frontend → `React.md`).
4. Los skills del harness se resuelven contra `skills-lock.json`; si el hash no coincide, se reporta y **no** se ejecuta con un skill no verificado.
5. Ningún rol inventa skills: solo los listados en `.claude/skills/` y `skills-lock.json`.
