# Spec: Verificar y cerrar K00 ("Secretos versionados") en known-issues.md

## Metadata
- **Tipo:** docs
- **Complejidad:** XS
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** DOCS-K00-VERIFIED-2026-08-21
- **Ejecutor:** docs-keeper (Sonnet), a solicitud directa del orchestrator

## Historia

Como mantenedor del repo que consulta `docs/known-issues.md` como fuente de verdad del estado de seguridad del proyecto, quiero que el hallazgo `K00` ("Secretos versionados") refleje el estado real y verificado del repositorio, para no arrastrar en la documentación una alerta de seguridad crítica que ya no aplica ni dejar sin evidencia una afirmación de cierre.

- **Específica:** verificar de forma independiente (sin asumir el texto ya redactado en el working directory) cada afirmación sobre `.gitignore`, archivos trackeados y el historial de git relacionados con `K00`, y dejar constancia en `known-issues.md`.
- **Medible:** CA-1 y CA-2 verificables por comandos de git reproducibles.
- **Alcanzable:** cambio acotado a `docs/known-issues.md` (tachado + nota de resolución) y este spec; sin tocar código.
- **Relevante:** `K00` es un hallazgo 🔴 crítico de seguridad (E1); su estado documentado debe ser preciso.
- **Temporal:** complejidad XS — verificación de comandos de git + edición de una línea de un documento.

## Contexto

El working directory traía, sin commitear, una edición de `docs/known-issues.md` que tachaba `K00` y lo marcaba `RESUELTO`, con una explicación detallada (existencia de `.gitignore`, ausencia de `.env`/`node_modules`/`build` en el índice de git, ausencia de la credencial real de MongoDB Atlas en el historial, y detalle de los 2 commits que sí tocaron `Base_Datos_StyleB/.env`).

Se verificó cada afirmación de forma independiente contra el repositorio real:

1. **`.gitignore` en la raíz.** Existe y contiene exactamente: `node_modules/`, `build/`, `dist/`, `coverage/`, `.env`, `.env.*` con excepción `!.env.example`, `logs/`, `*.log`, `npm-debug.log*`, y entradas de SO/editor.
2. **`git ls-files`.** Solo aparecen `Base_Datos_StyleB/.env.example`, `Style-Busters-main/.env.example` y `Style-Busters-main/cypress.env.json.example`. Ni `Base_Datos_StyleB/.env` ni `Style-Busters-main/.env` están trackeados. No hay ninguna ruta `node_modules/` ni `build/`/`dist/` en el índice.
3. **Historial completo (`git log --all --full-history -- '**/.env'`).** Solo 2 commits tocaron alguna vez un archivo `.env`: `b57c1c3c` ("Creacion del repo", 2026-07-01 21:26:23) que **añadió** `Base_Datos_StyleB/.env`, y `3c5802da` ("Actualizacion prompts", 2026-07-07 21:37:22) que lo **eliminó**. El `.gitignore` se añadió después, en `f4f774f6` ("Prompts", 2026-07-07 21:39:29) — confirmado con `git merge-base --is-ancestor 3c5802da f4f774f6`. Ambos commits del `.env` son, por tanto, previos al `.gitignore`.
4. **Contenido de `b57c1c3c`.** `Base_Datos_StyleB/.env` con `PORT=3000`, `MONGODB=mongodb://localhost:27017/StyleBusters` (URI **local**, no Atlas), `JWT_SECRET`/`JWT_REFRESH_TOKEN` (hex largos), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `ADMIN_SECRET=mi_clave_super_secreta_123`.
5. **Búsqueda de la credencial Atlas real.** El `.env` local actual (untracked, en disco) usa `MONGODB_URI=mongodb+srv://jamp992112_db_user:...` (Atlas). Se buscó `mongodb+srv`/el usuario Atlas en todo el historial (`git log --all -p -- '**/.env'`) sin resultado: nunca se commiteó esa credencial, porque el único `.env` que llegó a versionarse (`b57c1c3c`) usaba una URI local, ya eliminada en `3c5802da`.
6. **Comparación de secretos.** Los valores de `JWT_SECRET`/`JWT_REFRESH_TOKEN`/`ADMIN_SECRET` del `.env` local actual (`secret_token`, `secret_refresh_token`, un hex distinto) **no coinciden** con los que se commitearon en `b57c1c3c` — nunca se restauraron ni se reutilizaron tras la eliminación.

Todas las afirmaciones del texto propuesto se confirmaron exactas; no se encontró ninguna imprecisión que corregir.

## Criterios de Aceptación

- [x] **CA-1 — El texto de cierre de `K00` en `docs/known-issues.md` es verificable y preciso.** El hallazgo queda tachado (`~~...~~`) con nota `**RESUELTO** (verificado 2026-08-21)` que enumera: `.gitignore` existente con las reglas reales, `git ls-files` sin `.env`/`node_modules`/`build`, ausencia de la credencial Atlas en el historial completo, y los 2 commits (`b57c1c3c`, `3c5802da`) que tocaron `Base_Datos_StyleB/.env` antes del `.gitignore`. Verificable: reproduciendo los comandos de la sección Contexto contra `HEAD` de esta rama.
- [x] **CA-2 — Trazabilidad documental del cierre.** Este spec queda referenciado como evidencia de la verificación (commits separados: primero el spec, luego el cambio a `known-issues.md`), de modo que el cierre de `K00` no depende solo de la afirmación en el propio `known-issues.md` sino de un documento de spec con el detalle de comandos ejecutados. Verificable: `git log` muestra ambos commits en orden.

## Consideraciones de Seguridad

- **Relevancia:** SÍ aplica, aunque el cambio es documental — `K00` es un hallazgo de seguridad crítico (E1, secretos versionados) y su estado documentado debe reflejar la exposición real de credenciales.
- **Amenazas STRIDE:**
  - **Information Disclosure:** foco central de esta verificación. Se confirmó que no hay secretos activos (`.env` real) trackeados en git, y que la credencial Atlas actualmente en uso nunca fue commiteada. Los secretos que sí se commitearon en su momento (`b57c1c3c`) ya no están vigentes (valores distintos a los del `.env` actual) y el archivo fue eliminado en `3c5802da`, antes de introducirse el `.gitignore`.
  - **Tampering/Spoofing/Repudiation/DoS/Elevation of Privilege:** N/A — no se toca código ni configuración de runtime.
- **Nota de riesgo residual (no accionable en este spec):** los valores hexadecimales de `JWT_SECRET`/`JWT_REFRESH_TOKEN` commiteados en `b57c1c3c` permanecen legibles en el historial de git (no se reescribió), aunque ya no están en uso. No se reescribe el historial porque no hay secreto vigente expuesto; esto es una decisión de diseño documentada, no un pendiente sin resolver.
- **Secrets involucrados:** ninguno se introduce ni se expone en este cambio; el cambio es puramente documental sobre hallazgos ya conocidos.

## Dependencias

- **Internas:**
  - `docs/known-issues.md` — CA-1 (archivo objetivo)
  - `.gitignore` (raíz) — solo lectura, evidencia de CA-1
- **Externas:** ninguna.

## Decisiones de Diseño

- **No se reescribe el historial de git** para eliminar los commits `b57c1c3c`/`3c5802da`: los valores expuestos en su momento ya no coinciden con ningún secreto vigente en el `.env` local actual, por lo que reescribir historia no reduce riesgo real y sí generaría fricción operativa (rebase de rama compartida).
- **Se deja el texto de la modificación original tal cual estaba en el working directory**, tras confirmar que cada afirmación es exacta — no se detectó ninguna imprecisión que justificara reescribirlo.

## Riesgos y Deuda Técnica

- Ninguna deuda técnica nueva. Riesgo residual documentado (secretos históricos ya no vigentes visibles en `git log`) queda explícito en la sección de Seguridad, no oculto.

## Pendientes Abiertos y Gaps Detectados

- **Fuera de alcance de este spec (no tocado):** `docs/backlog.md` referencia `K00` en `F1.1` (`.gitignore` + sacar `.env`/`node_modules`/`build`/`logs` de git) sin el tachado `RESUELTO` que sí llevan `F3.5`/`F3.6`/`F5.2` para otros hallazgos ya cerrados. Actualizar `F1.1` en `backlog.md` con el mismo patrón queda fuera del alcance explícito de esta tarea (limitada a `known-issues.md` + este spec) y se deja para un pendiente posterior si se decide alinear el formato.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21
- **Estado final:** DONE
- **CAs cumplidos:** CA-1, CA-2 — ambos. Todas las afirmaciones del texto de cierre de `K00` se verificaron de forma independiente contra el repositorio real (`.gitignore`, `git ls-files`, `git log --all --full-history`, contenido de los commits `b57c1c3c`/`3c5802da`, ausencia de la credencial Atlas en el historial) y coinciden exactamente con lo documentado; no se requirió ninguna corrección al texto.
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna.
- **Lecciones aprendidas:** el texto de cierre generado antes de esta verificación resultó ser preciso en todos sus detalles verificables (existencia y contenido de `.gitignore`, archivos trackeados, commits exactos, ausencia de la credencial Atlas), lo que confirma que redactar cierres de `known-issues.md` con comandos de verificación explícitos (`git ls-files`, `git log --all --full-history`) permite auditar después la afirmación sin volver a confiar ciegamente en el texto.
- **Pendientes abiertos confirmados:** actualizar `docs/backlog.md` (`F1.1`) con el tachado `RESUELTO` correspondiente a `K00`, siguiendo el mismo patrón que `F3.5`/`F3.6`/`F5.2` — explícitamente fuera de alcance de este spec.
- **Gaps no resueltos:** ninguno dentro del alcance de este spec.
- **Backlog derivado creado:** no se crea un ID de backlog nuevo — el pendiente de `F1.1` en `backlog.md` ya existe y solo requiere una edición de formato (tachado + nota), no una tarea nueva.
- **Referencias a historias/tareas creadas:**
  - Spec: [`docs/specs/2026-08-21-docs-known-issues-k00-resolved.md`](2026-08-21-docs-known-issues-k00-resolved.md) (este documento)
  - Hallazgo cerrado: [`docs/known-issues.md#K00`](../known-issues.md)
  - Backlog relacionado (no actualizado en este spec): [`docs/backlog.md`](../backlog.md), ítem `F1.1` (E1)

## Matriz de cierre
| Item detectado | Detectado por | Estado | Acción |
|---|---|---|---|
| Afirmación de `.gitignore` existente y sus reglas | Verificación directa (docs-keeper), lectura de `.gitignore` | Confirmado exacto | Cerrar |
| Afirmación de que `.env` no está trackeado (solo `.env.example`) | Verificación directa (docs-keeper), `git ls-files` | Confirmado exacto | Cerrar |
| Afirmación de ausencia de `node_modules/`/`build/` en el índice | Verificación directa (docs-keeper), `git ls-files` | Confirmado exacto | Cerrar |
| Afirmación de que la credencial Atlas real no aparece en el historial | Verificación directa (docs-keeper), `git log --all -p` | Confirmado exacto | Cerrar |
| Afirmación sobre los commits `b57c1c3c`/`3c5802da` (contenido, orden respecto al `.gitignore`) | Verificación directa (docs-keeper), `git show`, `git merge-base --is-ancestor` | Confirmado exacto | Cerrar |
| `docs/backlog.md` (`F1.1`) sin tachado `RESUELTO` para `K00` | Inspección de código durante esta verificación (docs-keeper) | Detectado, fuera de alcance | Backlog: alinear `F1.1` en una tarea `docs` posterior |
