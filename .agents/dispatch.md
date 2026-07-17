# Dispatch multiagente y blindaje del flujo

Contrato que permite ejecutar **cualquier petición en modo multiagente** respetando el SSDLC. El orchestrator clasifica la petición, arma el pipeline de subagentes, inyecta los skills ([`skills-map.md`](skills-map.md)) y **hace cumplir los gates de bloqueo**. Fuente del workflow: [`.claude/skills/SSDLC.md`](../.claude/skills/SSDLC.md).

Regla maestra invariante: **1 pendiente = 1 spec = 1 rama = 1 PR.**

---

## 0. Contrato de ejecución multiagente

Toda petición entra por el **orchestrator**, que actúa como agente principal:

1. **Clasifica** la petición (tabla §2) y confirma que existe/entra al backlog aprobado.
2. **Arma el pipeline**: la secuencia de roles de la fila correspondiente.
3. **Despacha cada rol como subagente** con:
   - las **entradas obligatorias** (SSDLC 11.3): ID, historia, CA, contexto funcional/técnico, docs del módulo, dependencias, restricciones de seguridad, DoD;
   - los **skills** de su fila en `skills-map.md`;
   - el **gate** que debe satisfacer antes de devolver control.
4. **Consolida** la evidencia de cada subagente (SSDLC 11.6) y **solo el orchestrator integra**.

Ningún subagente se despacha sin spec aprobado, sin skills asignados y sin gate objetivo.

---

## 1. Gates de bloqueo (blindaje) — NO se pueden saltar

| Gate | Punto | Condición de paso | Responsable de verificar |
|------|-------|-------------------|--------------------------|
| **G0** | Antes de todo | Contexto leído + `develop` limpio y actualizado | orchestrator |
| **G1** | Antes de crear rama | Spec aprobado (CA + STRIDE) y commiteado | orchestrator (aprueba spec de spec-writer) |
| **G2** | Antes de QA | Reporte anti-alucinación **limpio** (sin rutas/endpoints/libs inventadas) | anti-hallucination-reviewer |
| **G3** | Antes de PR | Quality gates verdes (type/lint/format/tests/build) + CA con evidencia | qa-test-designer |
| **G4** | Antes de merge | 3 veredictos **aprobado**: code-reviewer, security-reviewer, anti-hallucination-reviewer | orchestrator |
| **G5** | Antes de DONE | Spec cerrado (Resultados + Matriz) + pendientes → backlog con ID | docs-keeper |

**Comportamiento ante fallo de gate:** detener el pipeline, devolver al rol responsable con instrucciones concretas, **no avanzar**. Un gate fallido nunca se "aprueba por excepción".

Reglas de blindaje adicionales (heredadas del SSDLC, no negociables):
- Ningún subagente toca `main`/`master`/`develop` directamente.
- El builder **no** ejecuta G4 sobre su propio trabajo (revisor ≠ implementador).
- Hallazgo fuera de alcance ⇒ escala como propuesta (SSDLC 11.7), no se ejecuta.
- Cambio de arquitectura ⇒ ADR obligatorio (G1 no pasa sin él).

---

## 2. Ruteo por tipo de petición

Cada fila define el pipeline multiagente. Roles entre `[ ]` son condicionales.

| Tipo | Workflow | Pipeline de subagentes (en orden) | Gates | Skills clave |
|------|----------|-----------------------------------|-------|--------------|
| `feature` | `feature-flow.md` | orchestrator → spec-writer → [architecture-reviewer] → builder(front/back) → anti-hallucination → qa-test-designer → security-reviewer → code-reviewer → orchestrator → docs-keeper → [learning-coach] | G0–G5 | por rol |
| `bugfix` | `bugfix-flow.md` | orchestrator → qa (caso rojo) → spec-writer → builder → anti-hallucination → qa (regresión) → code-reviewer → orchestrator → docs-keeper → [learning-coach] | G0–G5 | por rol |
| `hotfix` | `bugfix-flow.md` (desde `main`) | igual que bugfix + security-reviewer obligatorio; merge a `main` **y** `develop` | G0–G5 | +security |
| `refactor` | `feature-flow.md` (sin nuevo alcance) | orchestrator → spec-writer → architecture-reviewer → builder → anti-hallucination → qa (sin cambio de comportamiento) → code-reviewer → orchestrator → docs-keeper | G0–G5 | +architecture |
| `security-patch` | `bugfix-flow.md` | orchestrator → security-reviewer (lidera) → spec-writer → builder → anti-hallucination → qa → security-reviewer (verifica) → code-reviewer → orchestrator → docs-keeper | G0–G5 | security lidera |
| `docs` | — | orchestrator → spec-writer/docs-keeper → anti-hallucination (verifica que la doc refleje el código real) → orchestrator | G0, G1, G5 | docs |
| `infra` | — | orchestrator → spec-writer → architecture-reviewer → release-observability → anti-hallucination → security-reviewer → code-reviewer → orchestrator → docs-keeper | G0–G5 | +release-observability |

---

## 3. Selección de builder por ámbito

| Ámbito tocado | Builder | Skills |
|---------------|---------|--------|
| `Base_Datos_StyleB/` (API) | backend-builder | Express+MongoDB, MongoDB Patterns, Node/API Best Practices |
| `Style-Busters-main/` (SPA) | frontend-builder | React, Frontend Design, accessibility, core-web-vitals |
| Ambos (contrato front↔back) | backend-builder **y** frontend-builder en ramas/PRs separados, coordinados por orchestrator | ambos |

> Un pendiente que cruza front y back se **divide** en dos pendientes (dos specs, dos ramas, dos PRs). El orchestrator define el orden (normalmente contrato de API primero) y valida dependencias cruzadas en G4.

---

## 4. Definición de "petición ejecutable en multiagente"

Una petición está lista para despacharse cuando:
- [ ] Tiene tipo clasificado (§2) y entra al backlog aprobado.
- [ ] Cabe en la unidad mínima (o el orchestrator la dividió).
- [ ] Cada rol del pipeline tiene entradas obligatorias + skills asignados.
- [ ] Los gates G0–G5 están asignados a un responsable.
- [ ] El ámbito (front/back/ambos) determina el/los builder.

Si algo falta, el orchestrator **no despacha** y escala o completa antes de arrancar.
