## Descripción

Se cierra el hallazgo de seguridad K00 ("Secretos versionados") después de verificación independiente completa contra el repositorio real. Se confirma que no hay credenciales activas (`.env` real) trackeadas en git, que el `.gitignore` y `git ls-files` reflejan el estado real, que el historial completo (`git log --all --full-history`) no contiene la credencial Atlas actual, y se documenta el cierre en `known-issues.md` con referencia a comandos reproducibles. Se actualiza además `docs/backlog.md` para marcar el ítem F1.1 (E1) como resuelto, alineando su formato con otros hallazgos ya cerrados (F3.5, F3.6, F5.2).

## Spec

`docs/specs/2026-08-21-docs-known-issues-k00-resolved.md` · **Backlog ID:** DOCS-K00-VERIFIED-2026-08-21

## Tipo de cambio

- [x] Docs

## Criterios de aceptación

- [x] **CA-1:** El texto de cierre de K00 en `docs/known-issues.md` es verificable y preciso — evidencia: spec que ejecuta y confirma cada afirmación (`.gitignore` existente, `git ls-files` sin `.env` trackeado, ausencia de credencial Atlas en `git log --all -p`, commits `b57c1c3c`/`3c5802da` con contenido exacto) contra el repositorio real. Verificable: reproducir comandos en `HEAD` de esta rama.
- [x] **CA-2:** Trazabilidad documental del cierre — evidencia: spec referenciado desde `known-issues.md` como documento de auditoría, no solo afirmación en el propio markdown. Verificable: `git log` muestra primero el spec, luego el cambio a `known-issues.md`.

## Quality Gates

- [x] Lint/build — N/A (cambio documental únicamente, no toca código)
- [x] Tests — N/A
- [x] E2E — N/A
- [x] Diff revisado — sin secrets, sin código temporal, sin artefactos de debug. Cambios: `docs/known-issues.md` (K00 tachado + nota RESUELTO), `docs/backlog.md` (F1.1 tachado + nota RESUELTO), adición del spec.
- [x] Prueba funcional — ambos CAs verificables reproduciendo comandos de git en esta rama (`git ls-files`, `git log --all --full-history -- '**/.env'`, `git show b57c1c3c`, `git show 3c5802da`, `git merge-base --is-ancestor 3c5802da f4f774f6`).

## Revisiones independientes

- [ ] code-reviewer: N/A (tipo docs, no código)
- [ ] security-reviewer: N/A (tipo docs; cambio acerca de K00 pero documental, no introduce exposición)
- [x] anti-hallucination-reviewer: **LIMPIO** — verificación independiente completa sin imprecisiones encontradas en `.gitignore`, commits trackeados, historial completo, ausencia de credencial Atlas vigente.
- [ ] tech-reviewer: FALTA — aún sin despacho, pero spec audita todas las claims contra el repositorio real
- [ ] Segunda opinión (Codex): N/A (tipo docs)

## Pendientes y backlog derivado

- [x] Pendientes abiertos registrados en el spec — único pendiente explícito: actualizar `docs/backlog.md` (`F1.1`) con tachado `RESUELTO` → **completado en commit `ee40bb63`**
- [x] Backlog accionable creado y referenciado — DOCS-K00-VERIFIED-2026-08-21

## Consideraciones de seguridad

**Amenaza central (STRIDE: Information Disclosure):** K00 documenta secretos versionados.

**Controles confirmados:**
- `.gitignore` existe en raíz e ignora `.env`, `.env.*` (excepto `.env.example`), `node_modules/`, `build/`, `dist/`, `coverage/`, `logs/`.
- `git ls-files` no contiene `Base_Datos_StyleB/.env` ni `Style-Busters-main/.env` (solo sus `.env.example`); tampoco hay `node_modules/` ni `build/` en el índice.
- Historial completo (`git log --all -p -- '**/.env'`): solo 2 commits tocaron archivos `.env` (`b57c1c3c` que añadió `Base_Datos_StyleB/.env`, `3c5802da` que lo eliminó), ambos previos al `.gitignore` (`f4f774f6`).
- Contenido de `b57c1c3c`: `MONGODB=mongodb://localhost:27017/StyleBusters` (URI **local**, no Atlas), `JWT_SECRET`/`JWT_REFRESH_TOKEN` valores hex largos, `ADMIN_SECRET=mi_clave_super_secreta_123` — ninguno vigente en el `.env` actual en disco.
- Búsqueda de credencial Atlas actual (`mongodb+srv://jamp992112_db_user:...`) en historial completo: no aparece en ningún commit.
- Conclusión: no hay secretos activos trackeados, la credencial Atlas real nunca fue commiteada, los secretos que sí lo fueron (`b57c1c3c`) ya no están en uso (valores distintos a los del `.env` actual).

**Riesgo residual documentado (no accionable en este spec):** valores hexadecimales de `JWT_SECRET`/`JWT_REFRESH_TOKEN` del commit `b57c1c3c` permanecen legibles en el historial de git. No se reescribe porque no hay secreto vigente expuesto — es decisión de diseño explícita en el spec, registrada para futuro análisis de costo/beneficio si se decide reescribir historia.

**Amenazas STRIDE restantes:** N/A — tampoco hay toque a código de runtime, configuración sensible, ni introducción de exposición.

## Razonamiento (Vibe Coding)

La documentación de seguridad (`known-issues.md`) es la fuente de verdad del estado de riesgo del proyecto. Un hallazgo cerrado debe serlo con evidencia verificable, no solo afirmación. K00 fue crítico (E1, secretos versionados) y el cierre requería auditar cada claim (`.gitignore` existente, archivos `.env` no trackeados, ausencia de credencial Atlas en historia) contra los comandos de git que las respaldan. El spec documenta esos comandos y sus resultados, quedando disponible para auditar después sin depender únicamente del texto en `known-issues.md`. Tradeoff aceptado: el spec añade complejidad documental (93 líneas) a cambio de trazabilidad duradera del cierre de un hallazgo crítico.

## Breaking changes

Ninguno.

---

**Commits en esta rama:**

```
ee40bb63 docs: marcar F1.1 como resuelto en backlog (K00)
57f180bb docs: marcar K00 como resuelto (verificado)
55e7665d docs: spec docs-known-issues-k00-resolved
```

**Diff resumido:**

```
docs/backlog.md                                    |  2 +-
docs/known-issues.md                               |  2 +-
docs/specs/2026-08-21-docs-known-issues-k00-resolved.md | 93 ++++++++++++++++++++++
3 files changed, 95 insertions(+), 2 deletions(-)
```
