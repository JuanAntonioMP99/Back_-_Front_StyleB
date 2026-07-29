# Política de modelos — StyleBusters

Fuente única de qué modelo usa cada capa del harness. Versionada en el repo para que
**todo el equipo opere igual**. Complementa `.claude/skills/SSDLC.md` y `.agents/`.

> Regla de oro: **el modelo se elige por el tipo de trabajo, no por costumbre.**
> El razonamiento máximo (Fable) es para orquestar y decidir; la ejecución es de Sonnet;
> lo mecánico es de Haiku; Opus solo entra puntualmente ante duda real.

---

## 1. Asignación por capa

| Capa | Modelo | Rol | Cómo se fija |
|------|--------|-----|--------------|
| **Main loop / orchestrator** | **Fable** (razonamiento máx.) | **Solo orquesta:** planear, despachar, arbitrar, consolidar, integrar. **Nunca implementa.** | `.claude/settings.json` → `"model": "claude-fable-5"` |
| **Subagentes de trabajo/revisión** | **Sonnet** | Ejecutan una unidad delimitada (build, spec, QA, review, security, docs…). | `model: sonnet` explícito en cada `.claude/agents/*.md` |
| **Tareas mecánicas con plantilla** | **Haiku** | Transcribir a una plantilla ya decidida (PR, commits, changelog, índices). | `model: haiku` — hoy solo `pr-publisher` |
| **Duda de arquitectura/requerimiento** | **Opus** (override) | Solo cuando una decisión no trivial lo justifica. | Override **en el despacho**, nunca fijo en frontmatter |
| **Segunda opinión post-PR** | **Codex** (`codex@openai-codex`) | Revisión consultiva del PR. **Nunca gate único.** | `.claude/settings.json` (marketplace + plugin) |

Reglas duras:
1. El main loop **no escribe código de producto**. Sin plan/spec aprobado por el usuario, no se ejecuta nada.
2. **Todos** los agentes declaran `model:` en su frontmatter. Ningún agente queda sin modelo.
3. **Opus nunca está fijo** en un frontmatter: se activa como override puntual (ver §2).
4. **Codex nunca decide el merge**: es entrada consultiva; el gate lo dan los revisores internos (G4).

---

## 2. Override a Opus (excepcional)

El orchestrator puede despachar un subagente con Opus **solo** cuando, en una línea,
justifique una de estas causas:

- **Duda de arquitectura:** la decisión afecta contratos, límites de módulo o un ADR.
- **Duda de requerimiento:** el criterio de aceptación es ambiguo y el costo de equivocarse es alto.

Formato obligatorio al despachar: `override: opus — motivo: <1 línea>`. Si no hay
justificación, se usa Sonnet. Terminada la tarea, se vuelve a Sonnet.

---

## 3. Matriz Haiku — "Haiku transcribe, no decide"

Basada en las **plantillas reales** de este repo (`.agents/templates/`).

| ¿Haiku? | Tarea | Por qué |
|--------|-------|---------|
| ✅ SÍ | Llenar `templates/pr-template.md` / `.github/PULL_REQUEST_TEMPLATE.md` (→ `pr-publisher`) | Copia datos ya existentes del spec/evidencia a una plantilla fija |
| ✅ SÍ | Mensajes de commit Conventional a partir del cambio ya hecho | Formato mecánico |
| ✅ SÍ | Entradas de changelog / actualizar índices y tablas de docs ya decididas | Transcripción |
| ✅ SÍ | Llenar `templates/test-case-template.md` con casos **ya definidos** por qa-test-designer | Transcripción |
| ❌ NO | Specs, ADRs, criterios de aceptación | Requieren decisión |
| ❌ NO | Código de producto, tests nuevos (diseño) | Requieren decisión |
| ❌ NO | Cualquier veredicto: code-review, security, anti-alucinación, tech-review | Requieren juicio |
| ❌ NO | STRIDE, arquitectura, seguridad | Requieren juicio |

Regla de Haiku ante datos faltantes: **no inventa** — deja la casilla sin marcar y escribe
`FALTA: <qué dato falta>`.

---

## 4. Mapa agente → modelo (estado actual)

| Agente | Modelo |
|--------|--------|
| spec-writer, architecture-reviewer, frontend-builder, backend-builder, qa-test-designer, code-reviewer, security-reviewer, docs-keeper, anti-hallucination-reviewer, release-observability, learning-coach, **tech-reviewer** | `sonnet` |
| **pr-publisher** | `haiku` |
| orchestrator (main loop, no es agente) | Fable (settings.json) |

Verificación: `grep -L "^model:" .claude/agents/*.md` debe salir vacío (ningún agente sin modelo).

---

## 5. Notas de operación

- Si un miembro del equipo **no tiene acceso a Fable**, cambia su modelo del main loop
  localmente (`/model`), pero la política del repo permanece: el orquestador debe correr
  en el modelo de mayor razonamiento disponible y **solo orquestar**.
- El plugin **Codex** se declara a nivel proyecto en `.claude/settings.json`. Confirmar su
  disponibilidad en el primer clon con `/plugin`. Su salida se registra en el PR como
  "Segunda opinión (Codex)", nunca como aprobación de merge.
