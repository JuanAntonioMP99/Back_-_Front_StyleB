# Workflow SSDLC (puente)

> **Fuente canónica (Single Source of Truth):** [`.claude/skills/SSDLC.md`](../../.claude/skills/SSDLC.md).
> Este archivo **no duplica** el protocolo: lo referencia para no divergir. Toda la disciplina de fases vive en el canónico.

La capa de subagentes de `.agents/` **extiende** el SSDLC; no lo reemplaza. La secuencia principal se conserva intacta:

1. Lectura de contexto (FASE 0)
2. Clasificación y STRIDE (FASE 1)
3. Historia SMART (FASE 2)
4. Spec Driven Design (FASE 3)
5. Gestión de rama (FASE 4)
6. Skill Audit (FASE 5)
7. Implementación segura (FASE 6)
8. Verificación y quality gates (FASE 7)
9. Prueba funcional (FASE 8)
10. Pull Request (FASE 9)
11. Cierre de spec (FASE 10)
    - Baseline oficial (FASE 10.5) → habilita el modo subagente (FASE 11)

## Cómo se conecta la capa de subagentes

- El **modo de ejecución con subagentes** está definido en la FASE 11 del canónico: el orchestrator orquesta, los subagentes ejecutan, regla **1 pendiente = 1 spec = 1 rama = 1 PR**.
- Cada rol de `.agents/roles/` mapea a fases concretas del SSDLC (ver la tabla de intervención en el README de la capa).
- Los flujos concretos por tipo de tarea están en:
  - [`feature-flow.md`](feature-flow.md)
  - [`bugfix-flow.md`](bugfix-flow.md)

## Regla de precedencia

Si algo en `.agents/` contradijera al canónico, **manda `.claude/skills/SSDLC.md`**. Las plantillas y checklists de `.agents/` son operacionalizaciones del protocolo, nunca excepciones a él.
