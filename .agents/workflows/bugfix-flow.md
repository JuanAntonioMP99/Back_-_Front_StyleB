# Workflow: Bugfix Flow

Flujo de un **bugfix** bajo la capa de subagentes. Más corto que feature-flow, pero **sin saltarse spec, evidencia ni revisión independiente**.

## Precondición
- Bug reproducible y registrado en el backlog (con ID).
- `develop` actualizado.

## Secuencia

| # | Paso | Rol responsable | Artefacto | Fase SSDLC |
|---|------|-----------------|-----------|------------|
| 1 | Reproducir el bug y capturar evidencia del fallo | qa-test-designer | caso rojo | 0–1 |
| 2 | Clasificar (`bugfix`) + STRIDE si toca seguridad | spec-writer + security-reviewer | sección | 1 |
| 3 | Spec corto: causa raíz + CA de corrección | spec-writer | `docs/specs/…md` | 2–3 |
| 4 | Crear rama `bugfix/...` desde `develop` | builder | rama | 4 |
| 5 | Corregir + añadir test que falle sin el fix | builder | código + test | 6 |
| 6 | Validar referencias contra repo real | anti-hallucination-reviewer | reporte | 6 |
| 7 | Test rojo→verde + quality gates | qa-test-designer | evidencia | 7–8 |
| 8 | Revisión de código (≠ builder) | code-reviewer | veredicto | 9 |
| 9 | PR a `develop` (o `main` si es hotfix) | builder | PR | 9 |
| 10 | Integrar | orchestrator | merge | 9 |
| 11 | Cerrar spec + registrar causa raíz | docs-keeper | spec DONE | 10 |

## Reglas específicas de bugfix
- **Obligatorio** un test que reproduzca el bug y pase tras el fix (regresión).
- Se documenta la **causa raíz**, no solo el síntoma.
- Hotfix: rama desde `main`, merge a `main` **y** `develop`.
- No se aprovecha el bugfix para meter mejoras no relacionadas (viola 1 pendiente = 1 rama).
