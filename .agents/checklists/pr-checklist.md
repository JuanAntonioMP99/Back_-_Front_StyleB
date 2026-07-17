# PR Checklist (gate previo al merge)

El orchestrator no mergea a `develop` hasta que todo esto esté marcado. El builder **no se autoaprueba**.

## Alcance
- [ ] Un solo pendiente en el PR (1 pendiente = 1 spec = 1 rama = 1 PR).
- [ ] Rama nombrada según convención (`feature/…`, `bugfix/…`, `security/…`, …).
- [ ] No toca `main`/`master`/`develop` directamente.

## Trazabilidad
- [ ] Spec referenciado y con Backlog ID.
- [ ] Cada CA con evidencia en el plan de prueba.
- [ ] PR usa `templates/pr-template.md`.

## Quality gates
- [ ] Type-check, lint, format, tests y build en verde (evidencia).
- [ ] Diff sin secrets ni `console.log` de debug.

## Revisiones independientes
- [ ] code-reviewer: aprobado (≠ builder).
- [ ] security-reviewer: aprobado o N/A justificado.
- [ ] anti-hallucination-reviewer: limpio.

## Documentación
- [ ] Spec actualizado (Resultados + Matriz de cierre al cerrar).
- [ ] `CLAUDE.md`/contratos actualizados si cambió API/modelos.
- [ ] ADR creado si cambió arquitectura.

## Cierre
- [ ] Pendientes accionables convertidos en backlog con ID.
- [ ] Razonamiento de la solución explicado (Vibe Coding).
