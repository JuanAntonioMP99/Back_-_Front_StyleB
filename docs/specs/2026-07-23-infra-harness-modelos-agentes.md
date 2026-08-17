# Spec: Harness de modelos y agentes ejecutable

## Metadata
- **Tipo:** infra
- **Complejidad:** L
- **Fecha:** 2026-07-23
- **Estado:** IN PROGRESS
- **ID de backlog:** HARNESS-01
- **Ejecutor:** agente principal (orchestrator)

## Historia
Como responsable técnico quiero versionar en el repo el harness de modelos y agentes
(política de modelos + agentes ejecutables + Codex + DoD con loop de cierre), para que
cualquier miembro del equipo que clone reciba exactamente el mismo contexto operativo
y el ciclo SSDLC pueda ejecutarse en modo multiagente de forma reproducible, sin
configuración solo-local.

## Contexto
El repo ya tiene un harness **conceptual** en `.agents/` (orchestrator, `dispatch.md`
con gates G0–G5, `skills-map.md`, 11 roles, workflows, checklists, plantillas) que
operacionaliza `.claude/skills/SSDLC.md`. Pero **nada es ejecutable por Claude Code**:
no hay `.claude/agents/*.md` con frontmatter `model:`, ni `.claude/settings.json`, ni
política de modelos documentada, ni el plugin Codex declarado. Además el harness asume
una rama `develop` que no existía (solo `main`).

## Criterios de Aceptación
- [ ] CA-1: Existe `.claude/model-policy.md` con la política dura (Fable orquesta, Sonnet
  ejecuta, Opus solo override, Haiku mecánico) + matriz Haiku SÍ/NO + rol de Codex.
- [ ] CA-2: Existe `.claude/settings.json` válido que declara el marketplace de Codex
  (`openai/codex-plugin-cc`) y habilita `codex@openai-codex` a nivel proyecto.
- [ ] CA-3: Existen 13 agentes en `.claude/agents/*.md`, **todos** con `model:` explícito;
  solo `pr-publisher` es `haiku`, el resto `sonnet`; ninguno fija `opus`.
- [ ] CA-4: Cada rol del pipeline de `dispatch.md` tiene su agente ejecutable, más los
  nuevos `tech-reviewer` y `pr-publisher` (con sus role-docs en `.agents/roles/`).
- [ ] CA-5: Existe una Definition of Done verificable (`.agents/checklists/definition-of-done.md`)
  con comando/evidencia por ítem, mapa ítem→agente, gate, tope de 3 iteraciones y escalado.
- [ ] CA-6: Existe `.github/PULL_REQUEST_TEMPLATE.md` (espeja la plantilla del harness).
- [ ] CA-7: Existe `docs/adrs/ADR-0001-harness-modelos-y-agentes.md` con la decisión.
- [ ] CA-8: `CLAUDE.md` y los docs de flujo (`.agents/README.md`, `dispatch.md`,
  `skills-map.md`, `orchestrator.md`, workflows) referencian el harness y los 2 roles nuevos.
- [ ] CA-9: Rama `develop` creada como integración; el trabajo se entrega en PR a `develop`.
- [ ] CA-10: Gates del repo verdes tras el cambio (front `npm test` + `npm run build`;
  back `npm test`) — la config no rompe código.
- [ ] CA-11: `tech-reviewer` corrido sobre este mismo PR con veredicto emitido (prueba del loop).

## Consideraciones de Seguridad
- Amenazas STRIDE: **Information Disclosure** — `settings.json` no contiene secretos
  (solo referencias a marketplace/plugin públicos); los secretos siguen en `.env` (gitignored).
- **Tampering / Supply chain**: se añade un plugin externo (Codex). Control: Codex es
  **consultivo, nunca gate único**; su veredicto no puede autorizar un merge por sí solo.
- Controles: mínimo privilegio de `tools` por agente (revisores sin `Write`/`Edit`);
  Haiku "transcribe, no decide" (no toma decisiones de seguridad/arquitectura).
- Inputs que requieren validación: esquema de `settings.json` (JSON válido) + verificación
  del plugin con `/plugin` en el primer clon.

## Dependencias
- Internas: `.claude/skills/SSDLC.md`, `.agents/*` (roles, dispatch, skills-map, plantillas),
  `docs/` (specs, adrs), `CLAUDE.md`.
- Externas: Claude Code (frontmatter de agentes, settings.json, plugins), marketplace
  `openai/codex-plugin-cc` (plugin `codex@openai-codex`), GitHub para el PR.

## Decisiones de Diseño
- **Agentes thin (DRY):** cada `.claude/agents/<rol>.md` delega en su `.agents/roles/<rol>.md`
  + SSDLC + skills de `skills-map.md`, en vez de duplicar la definición del rol.
- **`develop` como integración** (aprobado por el usuario) en lugar de reescribir el harness
  a `main`: mantiene coherencia con SSDLC/dispatch/workflows que ya asumen `develop`.
- **13 agentes** (todos los roles del pipeline + 2 nuevos) en vez de un set mínimo, para
  que el pipeline de `dispatch.md` sea ejecutable de extremo a extremo.
- **Codex consultivo:** declarado a nivel proyecto para que el equipo lo reciba, pero
  nunca como gate único (evita dependencia de un tercero para integrar).

## Riesgos y Deuda Técnica
- El esquema exacto de `enabledPlugins`/`extraKnownMarketplaces` puede variar entre
  versiones de Claude Code; se usa el shape de la doc oficial y se documenta verificar con
  `/plugin`. Si un miembro no tiene acceso a Fable, ajusta el modelo localmente.
- `gh` no está instalado en el entorno de trabajo: el PR se abre vía URL de comparación.

## Pendientes Abiertos y Gaps Detectados
- Fijar el modelo del main loop a Fable vía `settings.json` asume acceso de todo el equipo
  a Fable; documentado como override local si falta acceso.
- Verificación real del plugin Codex (instalación/segunda opinión) queda sujeta al primer
  clon con acceso al marketplace (confirmar con `/plugin`).

### Evidencia de gates (CA-10)
- Frontend: `cd Style-Busters-main && npm test` → **48/48**; `npm run build` → *Compiled* OK.
- Backend: `cd Base_Datos_StyleB && npm test` → **151 pasan (+10 expected-fail** intencionales).
- E2E Cypress no se ejecuta en el sandbox actual (limitación de Electron; ver `docs/testing.md`).

### Loop de cierre — iteración 1 (prueba del loop)
- `tech-reviewer` auditó el PR (rama↔`develop`) y emitió **CAMBIOS**. Re-despacho aplicado:
  - **settings.json** corregido: `enabledPlugins`/`extraKnownMarketplaces` a **objeto/mapa**
    (schema real confirmado en docs) y `"model": "fable"` (alias) — antes eran arrays (Codex no
    habría cargado).
  - `.agents/templates/pr-template.md` sincronizado con `.github/PULL_REQUEST_TEMPLATE.md`
    (tech-reviewer + Codex, gates del repo).
  - `.agents/checklists/pr-checklist.md` actualizado (tech-reviewer/Codex + convención `infra/…`).
  - `.agents/dispatch.md` §2 completado en las filas `refactor`/`security-patch`/`docs`/`infra`.
- Backlog derivado (fuera de alcance de este PR): `skills-map.md` referencia `skills-lock.json`
  y skills del harness bajo `Style-Busters-main/.claude/skills/**` hoy borradas en el working tree
  (deuda preexistente, no tocada por este PR).

### Loop de cierre — iteración 2 (cierre)
- `tech-reviewer` re-auditó la rama tras las correcciones (`46e1cc3d`): los 5 hallazgos de la
  iteración 1 quedaron **resueltos**; sin hallazgos nuevos bloqueantes. **Veredicto: APTO.**
- Nota no bloqueante: la fila `docs` de `dispatch.md` §2 omite `[Codex]` en el cierre, coherente
  porque `docs` no pasa por G4 (sus gates son G0/G1/G5); no requiere cambio.
- Loop convergido en **2 iteraciones** (tope 3). G4 (tech-reviewer APTO) cumplido; el merge a
  `develop` queda a cargo del usuario.

## Resultados (se completa al cerrar)
- Fecha de cierre:
- CAs cumplidos:
- CAs no cumplidos:
- Deuda técnica generada:
- Lecciones aprendidas:
- Pendientes abiertos confirmados:
- Gaps no resueltos:
- Trabajo fuera de alcance confirmado:
- Backlog derivado creado: sí | no
- Referencias a historias/tareas creadas:

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| Política de modelos + agentes ejecutables | | |
| Codex consultivo declarado | | |
| DoD con loop de cierre | | |
| Rama develop + PR | | |
| Verificación plugin Codex | | |
