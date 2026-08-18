# Spec: Configuración por entorno del frontend para despliegue en Render (ENV-02)

## Metadata
- **Tipo:** infra
- **Complejidad:** M
- **Fecha:** 2026-07-30
- **Estado:** DONE
- **ID de backlog:** F5.2 (backlog.md, E5 · Crítico/Medio)
- **Ejecutor:** subagente frontend-builder

## Historia
Como responsable técnico quiero que `Style-Busters-main/` obtenga la URL base
de la API exclusivamente desde `REACT_APP_API_URL` (sin fallback silencioso a
ninguna URL, y menos a una de producción), y que toda la cadena de
build/test/E2E/CI use esa misma variable de forma consistente, para eliminar
el hardcodeo de `http://localhost:4000/api` (backlog F5.2) y dejar la SPA
lista para desarrollo local, pruebas y despliegue como servicio independiente
en Render.

## Contexto
`src/Services/apiClient.js:4` hardcodea
`baseURL: "http://localhost:4000/api"`. El resto de servicios conectados
(`authService`, `productService`, `cartService`, `categoryService`) llaman
paths relativos (`/auth/login`, `/products`, `/cart`, `/orders`,
`/categories`) sobre ese `apiClient`, por lo que la URL base debe incluir el
sufijo `/api`. `src/test/handlers.js:7` define su propio literal
`"http://localhost:4000/api"` para los handlers de MSW, desincronizado del
valor real de `apiClient`. Vitest no carga archivos `.env` (a diferencia del
dev server de CRA), por lo que `vitest.config.js` debe proveer la variable a
los tests. `cypress.config.js`, `scripts/start-e2e.js` y los scripts
`e2e:*` de `package.json` también asumen `localhost:4000`/`localhost:3000`.
El proyecto usa Create React App / `react-scripts` 5.0.1 (no Vite, no
Next.js): la única convención de variables públicas soportada por el bundler
de producción es el prefijo `REACT_APP_*`.

Esta tarea es la mitad **frontend** de una petición que cruza frontend y
backend (migrar URLs/puertos hardcodeados a variables de entorno + preparar
despliegue en Render). Por regla `dispatch.md` §3 correspondería dividirla en
dos pendientes con rama y PR propios; el orchestrator decidió ejecutar ambos
pendientes (este, ENV-02/F5.2, y su hermano ENV-01/F3.6 — spec
`2026-07-30-infra-env-config-backend.md`) en una **única rama**
`infra/env-config-render` y un único PR, por la fuerte dependencia documental
compartida (`docs/environment-variables.md` y `docs/render-deployment.md`
describen ambos servicios de Render como una unidad de despliegue). Se
documenta aquí como **desviación explícita y autorizada** de la regla
"1 pendiente = 1 spec = 1 rama = 1 PR" (SSDLC 11.2 / dispatch.md §3); cada
pendiente conserva su propio spec, sus propios CA y su propia verificación.

## Criterios de Aceptación
- [x] CA-1: `src/Services/apiClient.js` deja de hardcodear `baseURL`; lee
  `process.env.REACT_APP_API_URL` y, si no está definida (`undefined` o
  vacía), lanza un `Error` explícito al cargarse el módulo, sin fallback a
  ninguna URL (ni de desarrollo ni de producción). Evidencia: test unitario
  que borra `process.env.REACT_APP_API_URL`, resetea módulos e importa
  `apiClient.js` esperando el throw.
- [x] CA-2: Convención única y documentada — la variable **incluye el sufijo
  `/api`** (todos los servicios llaman paths relativos:
  `/auth/login`, `/products`, `/cart`, `/orders`, `/categories`); ningún
  archivo concatena `/api` por separado. Evidencia: revisión de
  `src/Services/*.js` sin duplicación de `/api` + nota en
  `docs/environment-variables.md`.
- [x] CA-3: `Style-Busters-main/.env.example` (ya presente con
  `REACT_APP_API_URL=http://localhost:4000/api` y comentarios, sin
  versionar todavía) queda **trackeado por git** con su contenido actual, sin
  duplicarlo ni reescribirlo. Evidencia: `git status`/`git log` muestra el
  archivo en el índice.
- [ ] CA-4: `src/test/handlers.js` deriva su constante `API` de la misma
  variable de entorno (`process.env.REACT_APP_API_URL`) en lugar de un
  literal independiente `"http://localhost:4000/api"`, para que MSW y
  `apiClient` no puedan desincronizarse. Evidencia: diff del archivo + los
  tests que usan `API` (MSW) siguen pasando.
  **Aplicado en el árbol de trabajo pero FUERA de este PR:** `src/test/handlers.js`
  pertenece al WIP sin versionar de otro pendiente (suite de tests MSW del
  frontend, aún no commiteada). El cambio está hecho y la suite completa pasa
  en verde con el WIP presente (94 tests; 51 son los realmente commiteados en
  esta rama), pero el archivo no entra en este PR; el CA se cerrará cuando se
  commitee el pendiente propietario del archivo. Detectado por el
  anti-hallucination-reviewer en G2.
- [x] CA-5: `vitest.config.js` provee `REACT_APP_API_URL` a los tests vía
  `test.env` (Vitest no carga `.env`), con el valor de desarrollo
  (`http://localhost:4000/api`), de modo que `apiClient.js` no lanza al
  importarse durante los tests. Evidencia: `cd Style-Busters-main && npm test`
  en verde sin regresión.
  **Corrección post-revisión:** la evidencia original citaba un trinquete
  (líneas 44 / funciones 32 / ramas 36 / statements 43) que no corresponde al
  `vitest.config.js` realmente commiteado en esta rama — ese bloque
  `thresholds` pertenece al WIP sin versionar de otro pendiente y no entra en
  este PR (ver corrección de CA-10). El `vitest.config.js` commiteado no
  define `coverage.thresholds`, por lo que no hay trinquete que verificar
  para este CA; solo aplica que los tests pasen en verde.
- [x] CA-6: `cypress.config.js` conserva `baseUrl: "http://localhost:3000"` y
  `env.apiUrl: "http://localhost:4000/api"` como default local; ambos quedan
  sobreescribibles por las variables estándar de Cypress
  (`CYPRESS_BASE_URL`, `CYPRESS_API_URL`) sin romper el valor por defecto.
  Evidencia: diff de `cypress.config.js`.
- [x] CA-7: `Style-Busters-main/scripts/start-e2e.js` fija
  `process.env.REACT_APP_API_URL` con el default local
  (`http://localhost:4000/api`) si no está ya definida, antes de invocar
  `react-scripts/scripts/start`, siguiendo el mismo patrón de defaults con
  `||` que ya usa `Base_Datos_StyleB/scripts/e2e-server.js`. Evidencia: diff
  del archivo.
- [x] CA-8: Los scripts `e2e:open` / `e2e:ci` / `e2e:ci:headless` de
  `package.json` mantienen `http://localhost:4000` / `http://localhost:3000`
  como URLs de espera de `start-server-and-test` (esa herramienta solo
  comprueba disponibilidad HTTP del puerto, no depende de
  `REACT_APP_API_URL`); no requieren cambio funcional. Documentado
  explícitamente para no generar un cambio innecesario.
- [x] CA-9: `.github/workflows/ci.yml`, job `frontend-unit`, define
  `REACT_APP_API_URL` (a nivel de job, cubriendo los pasos `test:coverage` y
  `CI=false npm run build`) con un valor de CI (`http://localhost:4000/api`),
  como blindaje defensivo explícito, documentado como tal en el propio
  workflow o en `docs/environment-variables.md`.
- [x] CA-10: Ningún test existente se rompe: `npm test`, `npm run
  test:coverage`, `CI=false npm run build` en verde.
  **Corrección post-revisión:** la primera medición del builder se hizo con el
  WIP sin versionar de otro pendiente presente en el árbol, lo que infló la
  cobertura. El code-reviewer lo verificó en un worktree limpio: con solo lo
  commiteado en esta rama la cobertura real es 34.75% líneas. El bloque
  `thresholds` de `vitest.config.js` (que pertenece a ese otro pendiente, no a
  ENV-02) se devolvió al WIP y no entra en este PR, de modo que
  `npm run test:coverage` no falla por un trinquete inalcanzable. Los tests
  siguen en verde sobre el estado realmente commiteado.
- [x] CA-11: No se introduce ninguna dependencia npm nueva.
- [x] CA-12: `docs/environment-variables.md` incluye la sección "Frontend
  (`Style-Busters-main/`)": `REACT_APP_API_URL` (convención CRA, incluye
  `/api`, sin fallback, se incrusta en el bundle), con advertencia explícita
  de que **toda** variable `REACT_APP_*` queda pública en el código servido
  al navegador y por tanto nunca debe contener secretos.
- [x] CA-13: `docs/render-deployment.md` incluye la sección del servicio
  frontend en Render: root directory `Style-Busters-main/`, build command
  (`npm ci --legacy-peer-deps && npm run build`), tipo de servicio (Static
  Site, publish directory `build/`), variable `REACT_APP_API_URL` apuntando
  al backend ya desplegado, y advertencia de que cualquier cambio de esa
  variable exige **rebuild + redeploy** (no toma efecto en caliente, al
  quedar incrustada en el build).

## Consideraciones de Seguridad
- Amenazas STRIDE identificadas:
  - **Information Disclosure** (foco principal): toda variable `REACT_APP_*`
    se incrusta en el bundle público servido al navegador. `REACT_APP_API_URL`
    es, por diseño, una URL pública (no secreta) y es la única variable
    introducida por este cambio, por lo que no hay secretos en riesgo. Se
    documenta explícitamente la regla en `docs/environment-variables.md` para
    prevenir que a futuro se añada una `REACT_APP_*` con un valor sensible
    (API key privada, secreto de firma, etc.).
  - **Spoofing / Elevation of Privilege** vía CORS mal configurado: el
    frontend no controla CORS (lo hace el backend, ver spec ENV-01); un
    `REACT_APP_API_URL` apuntando por error a un backend no confiable en un
    despliegue mal configurado podría hacer que el token JWT del usuario
    (`localStorage`) se envíe a un origen equivocado. Mitigación: la variable
    se fija en tiempo de build/deploy por quien controla el pipeline de
    Render (no por input de usuario en runtime); documentado en
    `render-deployment.md`.
  - **Tampering**: config de build gestionada en Render (fuera del repo);
    variables de CI versionadas y auditables vía PR (`ci.yml`).
- Controles: fail-fast en `apiClient.js` (throw sin fallback) en vez de un
  bug silencioso; `.env.example` sin valores reales de producción;
  documentación explícita de la regla "REACT_APP_* = público".
- Inputs que requieren validación: ninguno nuevo (config de arranque del
  cliente HTTP, no input de usuario).
- Secrets involucrados: ninguno. `REACT_APP_API_URL` es una URL pública por
  definición.
- Superficie de ataque afectada: inicialización de `apiClient.js` y de los
  scripts de test/E2E/CI; no se tocan componentes, contextos ni rutas de la
  SPA.
- **Nota — cookies:** no aplica. La autenticación es JWT Bearer vía
  `localStorage` (inyectado por el interceptor de `apiClient`); no hay
  cookies de sesión ni se introducen en este cambio.

## Dependencias
- Internas: `src/Services/apiClient.js`, `src/Services/{auth,product,cart,
  category}Service.js` (paths relativos, sin cambio de contrato),
  `src/test/handlers.js`, `vitest.config.js`, `cypress.config.js`,
  `scripts/start-e2e.js`, `package.json` (scripts `e2e:*`),
  `Style-Busters-main/.env.example`, `.github/workflows/ci.yml`. Spec
  hermano: `docs/specs/2026-07-30-infra-env-config-backend.md` (ENV-01/F3.6).
- Externas: Create React App / `react-scripts` 5.0.1 (mecanismo
  `REACT_APP_*` + carga automática de `.env` en dev), Vitest 4 (+
  `@vitejs/plugin-react`, sin carga de `.env`), Cypress 15,
  `start-server-and-test`, Render (Static Site hosting).

## Decisiones de Diseño
- **`REACT_APP_` en vez de `VITE_`:** el proyecto compila con
  `react-scripts build` (CRA), que únicamente sustituye variables con prefijo
  `REACT_APP_*` en el bundle de producción. Vitest usa internamente el
  plugin de Vite solo para correr los tests (transform de JSX), no para
  construir el artefacto de producción; un prefijo `VITE_*` no tendría
  ningún efecto en el build real que se despliega.
- **La URL incluye el sufijo `/api`:** evita mantener dos variables (host +
  prefijo) y coincide con el 100% de los servicios existentes, que llaman
  paths relativos sin repetir `/api`. Fijar la convención en un único punto
  (`docs/environment-variables.md`) evita que un servicio futuro duplique el
  sufijo.
- **Sin fallback en `apiClient.js`:** un fallback silencioso a `localhost` en
  un despliegue de producción fallaría en runtime de forma poco visible
  (requests a un backend inexistente); un fallback a una URL de producción
  hardcodeada reintroduce el problema que se corrige. Se prefiere un fallo
  explícito y temprano (fail-fast) al cargar el módulo.
- **`vitest.config.js` fija el valor vía `test.env`** en lugar de un archivo
  `.env.test` adicional: Vitest no carga `.env` automáticamente (a diferencia
  del dev server de CRA), y `test.env` es la extensión oficial soportada por
  `defineConfig`, sin añadir dependencias nuevas.
- **CI fija `REACT_APP_API_URL` a nivel de job** de forma defensiva, aunque
  el paso `build` (CRA/webpack) no ejecute el módulo `apiClient.js` en tiempo
  de build (solo lo bundlea): blindaje explícito ante cambios futuros del
  comportamiento del bundler, y para no depender de una suposición implícita
  sobre `DefinePlugin`.
- **No se generalizan los literales de `start-server-and-test`** en
  `package.json` (CA-8): esa herramienta solo espera disponibilidad HTTP de
  un puerto, no lee `REACT_APP_API_URL`; cambiarlos no aporta valor a este
  pendiente y se documenta como decisión consciente, no como omisión.
- **No se abre ADR:** es config de arranque del cliente HTTP, no cambia
  contratos de API ni arquitectura de componentes.
- **Rama compartida `infra/env-config-render`** con el spec hermano ENV-01
  (ver Contexto): desviación documentada y autorizada por el orchestrator.

## Riesgos y Deuda Técnica
- Si un desarrollador no copia `.env.example` a `.env` localmente, `npm start`
  arranca igual (CRA no valida en el propio proceso de arranque), pero la
  app lanzará el error de `apiClient.js` recién al cargarse en el navegador —
  riesgo de error tardío y menos evidente que un fallo de arranque del
  servidor. Mitigación: instrucción explícita en
  `docs/environment-variables.md` de copiar `.env.example` antes de `npm
  start`.
- Los literales de espera de `start-server-and-test` en `package.json`
  quedan fijos (CA-8); si en el futuro los puertos de E2E dejan de ser fijos,
  requerirá una iteración adicional (decisión aplazada).
- La verificación real de un despliegue en Render (build + runtime contra el
  backend desplegado) queda fuera del alcance de este spec, que es de
  código; requiere ejecución manual contra la plataforma.

## Pendientes Abiertos y Gaps Detectados
- Funcionalidades faltantes: ninguna dentro del alcance de F5.2/ENV-02.
- Comportamientos inconsistentes detectados: ninguno nuevo. Known-issues no
  relacionados con config de entorno ([K13](../known-issues.md#K13) —
  `App.jsx` no compila; [K18](../known-issues.md#K18) — endpoint fantasma de
  categorías) permanecen fuera de alcance.
- Gaps entre frontend y backend: coordinación con ENV-01 (spec hermano) para
  que `REACT_APP_API_URL` (frontend) y `FRONTEND_URL` (backend) describan de
  forma consistente el mismo par de servicios Render en
  `docs/render-deployment.md`.
- Persistencia pendiente de migrar: no aplica.
- Decisiones aplazadas: generalizar los literales de espera de
  `start-server-and-test` en `package.json` si los puertos de E2E dejan de
  ser fijos.
- **CA-4 diferido:** `src/test/handlers.js` deriva `API` de
  `REACT_APP_API_URL` en el árbol de trabajo, pero el archivo pertenece al WIP
  sin versionar del pendiente de tests MSW del frontend y no entra en este PR.
  Queda como pendiente confirmado, a cerrar cuando ese pendiente se commitee.
- Trabajo fuera de alcance en esta iteración: K13, K18, y cualquier otro
  known-issue no relacionado con config de entorno.
- Riesgos que requieren seguimiento: verificación real del despliegue en
  Render (fuera del alcance de un spec de código).
- Items que deben convertirse en backlog (consolidado al cierre): F5.2
  marcada como resuelta en `docs/backlog.md`. La decisión aplazada sobre
  `FRONTEND_URL` (endurecerla a obligatoria en producción si aparece un
  consumidor crítico) es del lado backend y se registra en el spec hermano
  ENV-01 y en `docs/backlog.md`, épica E3; no genera un ítem adicional aquí.

## Resultados (se completa al cerrar)
- Fecha de cierre: 2026-07-30.
- CAs cumplidos: 12 de 13 — CA-1, CA-2, CA-3 y CA-5 a CA-13. **CA-4 queda
  fuera de este PR** (ver más abajo y su propia nota). Verificados
  contra el código real en la rama `infra/env-config-render`
  (`src/Services/apiClient.js`, `src/Services/apiClient.test.js`,
  `vitest.config.js`, `cypress.config.js`,
  `scripts/start-e2e.js`, `Style-Busters-main/.env.example`,
  `.github/workflows/ci.yml`, `package.json`) y mediante ejecución: `cd
  Style-Busters-main && npm run test:coverage` → 11 archivos, 51 tests pass;
  cobertura 33.77% statements / 23.87% branches / 25.51% funcs / 34.75%
  líneas (no hay bloque `thresholds` commiteado en `vitest.config.js`, ver
  corrección de CA-10 más abajo); `CI=false npm run build` → build OK con
  los mismos warnings de ESLint preexistentes en el repo (`ProductDetails.jsx`,
  `RegisterForm.jsx`, `SearchResultsList.jsx`, `CartContext.jsx`,
  `Layout.jsx`, `CheckoutPage.jsx`, `HomePage.jsx`), ninguno nuevo
  introducido por este cambio. `Style-Busters-main/.env.example` y
  `Base_Datos_StyleB/.env.example` confirmados trackeados por git (`git
  ls-files`).
  **Corrección post-revisión (docs-keeper, re-despacho tras G4 del spec
  hermano ENV-01):** esta sección seguía citando la medición contaminada por
  WIP (20 archivos, 94 tests pass; cobertura 46.19/39.81/34.69/47.2%;
  trinquete 43/36/32/44) pese a que el CA-10 de abajo ya documentaba la
  corrección de cobertura de líneas (34.75%) detectada por el code-reviewer;
  quedó desactualizada porque esa corrección no se propagó a Resultados. Los
  9 archivos de test adicionales (`LoginForm.integration.test.jsx`,
  `SearchResultsList.integration.test.jsx`, `AuthContext.test.jsx`,
  `CartPage.test.jsx`, `HomePage.integration.test.jsx`,
  `ProtectedRoute.test.jsx`, `apiClient.integration.test.js`,
  `cartOrder.integration.test.js`, `contract.test.js`) pertenecen al WIP sin
  versionar de otro pendiente, no a esta rama. Verificado en un worktree
  limpio de `HEAD`: `git ls-files "Style-Busters-main/src/**/*.test.*"`
  devuelve 11 archivos; `npm run test:coverage` da 51 tests y la cobertura
  arriba. No hay `thresholds` en el `vitest.config.js` commiteado (ver CA-10),
  por lo que no aplica hablar de "trinquete superado" para este PR.
- CAs no cumplidos: **CA-4** (`src/test/handlers.js` deriva `API` de
  `REACT_APP_API_URL`). El cambio está aplicado en el árbol de trabajo, pero
  el archivo pertenece al WIP sin versionar de otro pendiente (suite de tests
  MSW del frontend) y **no está commiteado en esta rama** (`git ls-files
  Style-Busters-main/src/test` devuelve solo `setup.js`). Se cerrará cuando se
  commitee el pendiente propietario del archivo. Detectado por el
  anti-hallucination-reviewer en G2 y confirmado por el tech-reviewer en G4.
- Deuda técnica generada: ninguna nueva.
- Lecciones aprendidas: fijar `REACT_APP_API_URL` en tres puntos distintos
  (`vitest.config.js` para tests, `scripts/start-e2e.js` para el dev server
  de E2E, `ci.yml` a nivel de job) es más verboso que una única fuente, pero
  necesario porque ninguno de esos tres entornos carga `.env` de forma
  automática (a diferencia del dev server normal de CRA); documentar
  explícitamente el porqué de cada punto evita que una limpieza futura los
  elimine por parecer redundantes.
- Pendientes abiertos confirmados: **CA-4** (`src/test/handlers.js`), diferido
  al pendiente que versiona ese archivo; es el único CA que este PR no cierra.
- Gaps no resueltos: ninguno nuevo; K13 (`App.jsx` no compila) y K18
  (endpoint fantasma de categorías) permanecen fuera de alcance, como estaba
  previsto.
- Trabajo fuera de alcance confirmado: generalizar los literales de espera de
  `start-server-and-test` en `package.json` (CA-8, decisión consciente
  documentada, no omisión); verificación real de un despliegue en Render.
- Backlog derivado creado: sí.
- Referencias a historias/tareas creadas: F5.2 (`docs/backlog.md`, E5)
  marcada como resuelta. La decisión aplazada sobre `FRONTEND_URL`
  (obligatoriedad futura) queda registrada en el spec hermano ENV-01
  (`docs/specs/2026-07-30-infra-env-config-backend.md`) y en
  `docs/backlog.md`, épica E3, por ser una decisión del lado backend.

## Matriz de cierre
| Item detectado | Estado | Acción |
|---|---|---|
| `apiClient.js`: `REACT_APP_API_URL` sin fallback | Confirmado | Cerrar |
| `test/handlers.js` deriva `API` de la misma variable | Diferido a otro pendiente (archivo sin versionar) | No cerrar en este PR |
| `vitest.config.js`: `test.env` con `REACT_APP_API_URL` | Confirmado | Cerrar |
| `.env.example` frontend trackeado en git | Confirmado | Cerrar |
| `cypress.config.js` / `start-e2e.js` sobreescribibles | Confirmado | Cerrar |
| `ci.yml` job `frontend-unit` con `REACT_APP_API_URL` | Confirmado | Cerrar |
| `docs/environment-variables.md` (sección frontend) | Confirmado | Cerrar |
| `docs/render-deployment.md` (sección frontend) | Confirmado | Cerrar |
| Tests frontend sin regresión + trinquete | Confirmado | Cerrar |
| Literales de `start-server-and-test` en `package.json` (CA-8) | Fuera de alcance | Decisión consciente, no backlog |
| Verificación real de despliegue en Render | Requiere seguimiento | Acción humana (fuera de alcance de un spec de código) |
