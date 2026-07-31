# Spec: Configuración por entorno del backend para despliegue en Render (ENV-01)

## Metadata
- **Tipo:** infra
- **Complejidad:** M
- **Fecha:** 2026-07-30
- **Estado:** DONE
- **ID de backlog:** F3.6 (backlog.md, E3 · Alto)
- **Ejecutor:** subagente backend-builder

## Historia
Como responsable técnico quiero que `Base_Datos_StyleB/` lea la URI de MongoDB y la
URL del frontend desde variables de entorno centralizadas en `src/config/env.js`
(con validación estricta en producción), para eliminar el hardcodeo de
`localhost:27017` (known-issue [K02](../known-issues.md#K02), backlog F3.6) y dejar
el servicio listo para desarrollo local, pruebas y despliegue como servicio
independiente en Render, sin tocar código entre entornos.

## Contexto
`src/config/db.conf.js:9` hardcodea el fallback
`"mongodb://localhost:27017/StyleBusters"` e ignora `MONGODB_URI` del `.env`
(K02). `src/config/env.js` ya centraliza `nodeEnv`, `port` y `corsAllowedOrigins`
(con guarda de producción para CORS), pero no expone la URI de Mongo ni una
variable para la URL del frontend. `Base_Datos_StyleB/.env.example` quedó
desactualizado tras el spec de seguridad del 2026-07-07 (E1): no documenta
`NODE_ENV`, `CORS_ALLOWED_ORIGINS` ni una variable de frontend, y su comentario
sobre `MONGODB_URI` describe el bug K02 como vigente.

Esta tarea es la mitad **backend** de una petición que cruza frontend y
backend (migrar URLs/puertos hardcodeados a variables de entorno + preparar
despliegue en Render). Por regla `dispatch.md` §3 correspondería dividirla en
dos pendientes con rama y PR propios; el orchestrator decidió ejecutar ambos
pendientes (este, ENV-01/F3.6, y su hermano ENV-02/F5.2 — spec
`2026-07-30-infra-env-config-frontend.md`) en una **única rama**
`infra/env-config-render` y un único PR, por la fuerte dependencia documental
compartida (`docs/environment-variables.md` y `docs/render-deployment.md`
describen ambos servicios de Render como una unidad de despliegue). Se
documenta aquí como **desviación explícita y autorizada** de la regla
"1 pendiente = 1 spec = 1 rama = 1 PR" (SSDLC 11.2 / dispatch.md §3); cada
pendiente conserva su propio spec, sus propios CA y su propia verificación.

## Criterios de Aceptación
- [x] CA-1: `src/config/env.js` expone `mongodbUri`, leído de
  `process.env.MONGODB_URI`. En `nodeEnv === "production"` sin la variable
  definida, lanza `Error("Falta configurar MONGODB_URI en producción")` en
  tiempo de import (mismo patrón que la guarda existente de
  `CORS_ALLOWED_ORIGINS`). En `development`/`test` sin la variable, usa el
  default actual `"mongodb://localhost:27017/StyleBusters"`. Evidencia:
  `tests/unit/config/env.test.js` ampliado con ≥3 casos (falta en prod lanza;
  presente en prod no lanza y expone el valor; falta en dev/test usa el
  default) + `cd Base_Datos_StyleB && npm test` en verde.
- [x] CA-2: `src/config/env.js` expone `frontendUrl`, leído de
  `process.env.FRONTEND_URL` con default `"http://localhost:3000"`. El default
  de `corsAllowedOrigins` (cuando `CORS_ALLOWED_ORIGINS` no está definida) pasa
  a derivarse de `[frontendUrl]` en lugar de un segundo literal independiente,
  de modo que exista un único punto de verdad para la URL local del frontend.
  Evidencia: test que fija `FRONTEND_URL=https://styleb-front.onrender.com`
  sin `CORS_ALLOWED_ORIGINS` y verifica `env.corsAllowedOrigins` ===
  `[frontendUrl]`.
- [x] CA-3: `src/config/db.conf.js` deja de hardcodear la URI: importa `env`
  desde `./env.js` y usa `env.mongodbUri` en `mongoose.connect(...)`; elimina
  su propio `dotenv.config()` (redundante, ya lo ejecuta `env.js` al
  importarse). Evidencia: lectura del archivo tras el cambio + `npm test` sin
  regresiones (`connectDB` no se invoca en tests por el guard `isMain`, no
  requiere mocks nuevos).
- [x] CA-4: `server.js` no se modifica: el guard `isMain`
  (`process.argv[1] === fileURLToPath(import.meta.url)`), el bloque CORS por
  función de allowlist con `credentials: true`, y `app.listen(port, "0.0.0.0")`
  quedan intactos. Evidencia: diff de `server.js` vacío.
- [x] CA-5: `Base_Datos_StyleB/.env.example` queda completo y sin secretos
  reales: añade `NODE_ENV` (valores permitidos comentados:
  `development`/`test`/`production`), `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`
  (hoy ausentes); corrige el comentario obsoleto que describe `MONGODB_URI`
  como ignorada (K02 queda resuelto por CA-1/CA-3). Evidencia: diff del
  archivo.
- [x] CA-6: `scripts/e2e-server.js` sigue funcionando sin cambios funcionales
  (ya fija sus propios defaults de entorno, incluido `MONGODB_URI` efímero,
  antes de importar `server.js`). Evidencia: `cd Base_Datos_StyleB && node
  ./scripts/e2e-server.js` arranca y responde en `/api/products`; si el
  sandbox no permite ejecutarlo, documentar como pendiente de verificación en
  el job `e2e` de `ci.yml` (ver `docs/testing.md`).
- [x] CA-7: `docs/environment-variables.md` existe con la sección "Backend
  (`Base_Datos_StyleB/`)": cada variable (`NODE_ENV`, `PORT`, `MONGODB_URI`,
  `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `JWT_REFRESH_TOKEN`,
  `ADMIN_SECRET`) con default, obligatoriedad por entorno (dev/test/prod),
  dónde se lee (`env.js` centralizado vs. `process.env` directo en
  controllers) y nota explícita de que ninguna se expone al cliente.
- [x] CA-8: `docs/render-deployment.md` existe con la sección del servicio
  backend en Render: root directory `Base_Datos_StyleB/`, build command
  (`npm ci`), start command (`npm start` → `node server.js`), lista de
  variables a configurar en el dashboard (sin valores reales), y nota de que
  `PORT` la inyecta Render y `app.listen(port, "0.0.0.0")` ya es compatible.
- [x] CA-9: `cd Base_Datos_StyleB && npm test` y `npm run test:coverage` en
  verde, sin bajar el trinquete de cobertura existente.
- [x] CA-10: No se introduce ninguna dependencia npm nueva (solo `process.env`
  + módulos ya presentes: `dotenv`, `mongoose`).

## Consideraciones de Seguridad
- Amenazas STRIDE identificadas:
  - **Information Disclosure** (foco): `MONGODB_URI` puede incluir
    credenciales si en Render se usa un proveedor gestionado (p. ej. Atlas).
    `db.conf.js` solo loguea `connection.connection.host` (comportamiento ya
    existente, se preserva) — nunca la cadena de conexión completa.
    `.env.example` y `docs/environment-variables.md` /
    `docs/render-deployment.md` documentan **nombres** de variables, jamás
    valores reales.
  - **Spoofing / Elevation of Privilege** vía CORS mal configurado: sin
    cambios al mecanismo de allowlist por función; en `production` sigue
    siendo obligatorio definir `CORS_ALLOWED_ORIGINS` explícitamente (la
    guarda existente no se relaja). `FRONTEND_URL` solo aporta el default de
    **desarrollo** para `corsAllowedOrigins`; nunca sustituye la validación de
    producción.
  - **Tampering**: las variables de Render se gestionan en su dashboard, fuera
    del repositorio; control externo, documentado en `render-deployment.md`.
- Controles: guarda de arranque fail-fast en producción para `MONGODB_URI`
  (igual patrón que `CORS_ALLOWED_ORIGINS`); `.gitignore` ya excluye `.env*`
  (spec E1, 2026-07-07); sin logging de secretos.
- Inputs que requieren validación: ninguno nuevo (no hay input de usuario en
  este cambio, es config de arranque).
- Secrets involucrados: `MONGODB_URI` (puede llevar credenciales embebidas
  según el proveedor); se mantiene fuera de git y no se loguea completo.
- Superficie de ataque afectada: arranque del proceso backend
  (`env.js`, `db.conf.js`); no se tocan rutas, autenticación ni modelos.
- **Nota — cookies/`trust proxy`:** no aplica en este cambio. La
  autenticación es JWT Bearer vía `localStorage` (no hay cookies de sesión,
  Socket.IO/WebSockets, OAuth, callbacks ni emails en el código real). No se
  introducen cookies ni configuración de `trust proxy` como parte de esta
  tarea.

## Dependencias
- Internas: `src/config/env.js`, `src/config/db.conf.js`, `server.js` (solo
  lectura, sin cambios), `scripts/e2e-server.js`, `scripts/seed.js` (usa
  `connectDB`), `tests/unit/config/env.test.js`, `tests/setup.js` (sin
  cambios requeridos), `Base_Datos_StyleB/.env.example`. Spec hermano:
  `docs/specs/2026-07-30-infra-env-config-frontend.md` (ENV-02/F5.2).
- Externas: `dotenv`, `mongoose`; Render (plataforma de despliegue, fuera del
  repo).

## Decisiones de Diseño
- **`corsAllowedOrigins` deriva su default de `frontendUrl`** en lugar de
  mantener un segundo literal `"http://localhost:3000"` independiente: un
  único punto de verdad para "cuál es la URL local del frontend", que además
  responde directamente al requisito de `FRONTEND_URL` como base para
  "derivar el origen permitido por defecto".
- **`FRONTEND_URL` no aborta el arranque en producción si falta** (a
  diferencia de `MONGODB_URI` y `CORS_ALLOWED_ORIGINS`): hoy no tiene ningún
  consumidor crítico en runtime (no hay emails, redirecciones ni callbacks
  OAuth en el código real), así que forzar su presencia sería una
  restricción sin justificación funcional actual. Se documenta en
  `render-deployment.md` como variable **recomendada** para mantener
  paridad dev/prod, no como bloqueante. Si en el futuro se añade un
  consumidor crítico (p. ej. un link de verificación de email), esta
  decisión debe revisarse y endurecerse (ver Riesgos).
- **`db.conf.js` importa `env.js` en vez de leer `process.env` directamente**:
  mantiene un único punto de lectura/validación de variables de entorno
  (coherente con el patrón ya establecido para `port`/`corsAllowedOrigins`),
  y elimina la llamada duplicada a `dotenv.config()`.
- **No se abre ADR**: es un cambio de configuración de arranque, no de
  arquitectura ni de contratos entre módulos (no cambia rutas, modelos ni
  middlewares).
- **Rama compartida `infra/env-config-render`** con el spec hermano ENV-02
  (ver Contexto): desviación documentada y autorizada por el orchestrator.

## Riesgos y Deuda Técnica
- Si a futuro se agrega un flujo que dependa críticamente de `FRONTEND_URL`
  (emails transaccionales, redirecciones OAuth), la decisión de no bloquear
  el arranque en producción por su ausencia debe revisarse y endurecerse con
  una guarda análoga a `MONGODB_URI`/`CORS_ALLOWED_ORIGINS`.
- Si Render inyecta un `MONGODB_URI` mal formado, el arranque fallará rápido
  (fail-fast intencional); se documenta como comportamiento esperado en
  `render-deployment.md`, no como bug.
- `scripts/e2e-server.js` puede no ejecutarse en el sandbox de desarrollo
  (limitación ya documentada en `docs/testing.md` para Cypress); su
  verificación real queda sujeta al job `e2e` de `ci.yml`.
- Quedan fuera de alcance de este pendiente: [K21](../known-issues.md#K21)
  (cableado de `errorHandler`), [K12](../known-issues.md#K12) (expiraciones
  JWT hardcodeadas), rotación real de secretos y tokenización de tarjetas
  (F1.3) — ya tratados o pendientes en otros specs/backlog.

## Pendientes Abiertos y Gaps Detectados
- Funcionalidades faltantes: ninguna dentro del alcance de F3.6/ENV-01.
- Comportamientos inconsistentes detectados: ninguno nuevo; K21 y K12
  permanecen como deuda ya registrada, no se tocan aquí.
- Gaps entre frontend y backend: coordinación con ENV-02 (spec hermano) para
  que `FRONTEND_URL` (backend) y `REACT_APP_API_URL` (frontend) describan de
  forma consistente el mismo par de servicios Render en
  `docs/render-deployment.md`.
- Persistencia pendiente de migrar: no aplica.
- Decisiones aplazadas: endurecer `FRONTEND_URL` a obligatoria en producción
  si aparece un consumidor crítico futuro.
- Trabajo fuera de alcance en esta iteración: K21, K12, rotación de secretos
  (E1), tokenización de tarjetas (F1.3).
- Riesgos que requieren seguimiento: verificación real del despliegue en
  Render (fuera del alcance de un spec de código; requiere ejecución manual
  contra la plataforma).
- Items que deben convertirse en backlog (consolidado al cierre): endurecer
  `FRONTEND_URL` a obligatoria en producción si en el futuro aparece un
  consumidor crítico (emails, redirecciones, callbacks OAuth) — registrado en
  `docs/backlog.md`, épica E3. F3.6 marcada como resuelta y K02 cerrado en
  `docs/known-issues.md`.

## Resultados (se completa al cerrar)
- Fecha de cierre: 2026-07-30.
- CAs cumplidos: CA-1 a CA-10 (los 10 criterios de aceptación), verificados
  contra el código real en la rama `infra/env-config-render`
  (`src/config/env.js`, `src/config/db.conf.js`, `server.js`,
  `Base_Datos_StyleB/.env.example`, `tests/unit/config/env.test.js`) y
  mediante ejecución: `cd Base_Datos_StyleB && npm test` → 25 archivos, 230
  tests pass + 21 expected fail (251 total); `npm run test:coverage` → 79.18%
  statements / 73.07% branches / 84.61% funcs / 79% líneas, por encima del
  trinquete de `vitest.config.js` (74/60/80/74); `node
  ./scripts/e2e-server.js` arrancó y respondió en `GET /api/products` (CA-6,
  verificado con ejecución real, no quedó como pendiente documental).
- CAs no cumplidos: ninguno.
- Deuda técnica generada: ninguna nueva; se documenta explícitamente en
  `docs/environment-variables.md` la decisión aplazada de `FRONTEND_URL` (ver
  abajo).
- Lecciones aprendidas: mantener un único punto de verdad (`frontendUrl`) para
  el default de `corsAllowedOrigins` evita divergencia entre dos literales
  independientes; documentar la convención de CORS/`env.js` junto al
  procedimiento operativo (`docs/environment-variables.md`) facilita el
  cierre del known-issue K02 sin dejar ambigüedad sobre qué variable manda en
  cada entorno.
- Pendientes abiertos confirmados: ninguno dentro del alcance de CA-1 a CA-10.
- Gaps no resueltos: coordinación de nombres de variable entre
  `FRONTEND_URL` (backend) y `REACT_APP_API_URL` (frontend) — resuelta de
  forma documental en `docs/render-deployment.md` (ambas apuntan al mismo par
  de servicios Render); no requiere cambio de código adicional.
- Trabajo fuera de alcance confirmado: K21 (cableado de `errorHandler`), K12
  (expiraciones JWT hardcodeadas), rotación real de secretos y tokenización
  de tarjetas (F1.3) — no tocados, como estaba previsto en el spec.
- Backlog derivado creado: sí.
- Referencias a historias/tareas creadas: F3.6 (`docs/backlog.md`, E3) marcada
  como resuelta; K02 (`docs/known-issues.md`) cerrado; nuevo pendiente de
  backlog para la decisión aplazada de `FRONTEND_URL` (ver
  `docs/backlog.md`, épica E3).

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| `env.js`: `mongodbUri` + guarda de producción | Confirmado | Cerrar |
| `env.js`: `frontendUrl` + default derivado de CORS | Confirmado | Cerrar |
| `db.conf.js` lee `env.mongodbUri` (cierra K02) | Confirmado | Cerrar (K02 resuelto) |
| `.env.example` backend actualizado | Confirmado | Cerrar |
| `docs/environment-variables.md` (sección backend) | Confirmado | Cerrar |
| `docs/render-deployment.md` (sección backend) | Confirmado | Cerrar |
| Tests backend sin regresión + trinquete | Confirmado | Cerrar |
| `FRONTEND_URL` no obligatoria en producción (decisión de diseño) | Decisión aplazada | Backlog (endurecer si aparece consumidor crítico) |
| Verificación real de despliegue en Render | Requiere seguimiento | Acción humana (fuera de alcance de un spec de código) |
