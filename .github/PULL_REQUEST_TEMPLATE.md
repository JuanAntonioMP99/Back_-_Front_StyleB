<!-- Espejo de .agents/templates/pr-template.md. Lo llena `pr-publisher` (Haiku):
     transcribe desde spec + evidencia, nunca inventa. Dato faltante => casilla sin
     marcar + "FALTA: …". -->

## Descripción
[Qué se hizo y por qué, en 2-3 oraciones]

## Spec
`docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md`  ·  **Backlog ID:** […]

## Tipo de cambio
- [ ] Feature / Bugfix / Hotfix / Refactor / Security patch / Infra / Docs

## Criterios de aceptación
- [ ] CA-1: descripción — evidencia: `docs/test-plans/[…].md`
- [ ] CA-2: …

## Quality Gates
- [ ] Lint/build — sin errores (`npm run build` en frontend)
- [ ] Tests — todos pasan (front `npm test` · back `npm test` + `npm run test:coverage`)
- [ ] E2E — verde si aplica (`npm run e2e:ci:headless`)
- [ ] Diff revisado — sin secrets, sin console.log de debug, sin código temporal sin marcar
- [ ] Prueba funcional — todos los CA verificados con evidencia

## Revisiones independientes (no las hace el builder)
- [ ] code-reviewer: aprobado
- [ ] security-reviewer: aprobado (o N/A justificado)
- [ ] anti-hallucination-reviewer: limpio (sin rutas/endpoints/libs inventadas)
- [ ] tech-reviewer: **APTO** (claims↔evidencia, spec↔diff, riesgo de integración)
- [ ] Segunda opinión (Codex): registrada — **consultiva, no bloquea el merge**

## Pendientes y backlog derivado
- [ ] Pendientes abiertos registrados en el spec
- [ ] Backlog accionable creado y referenciado (IDs / enlaces)

## Consideraciones de seguridad
[Amenazas STRIDE evaluadas y controles aplicados]

## Razonamiento (Vibe Coding)
[2-4 líneas: por qué esta solución y qué tradeoff se aceptó]

## Breaking changes
[Ninguno | descripción + ADR relacionado]
