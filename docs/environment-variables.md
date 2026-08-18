# Variables de entorno — StyleBusters

> Fuente de verdad para toda variable de entorno consumida por el backend
> (`Base_Datos_StyleB/`) y el frontend (`Style-Busters-main/`), tal como se leen
> hoy en el código real. Deriva de los specs
> [`2026-07-30-infra-env-config-backend.md`](specs/2026-07-30-infra-env-config-backend.md)
> (ENV-01) y [`2026-07-30-infra-env-config-frontend.md`](specs/2026-07-30-infra-env-config-frontend.md)
> (ENV-02).

## Backend (`Base_Datos_StyleB/`)

| Variable | Obligatoria | Default | Dónde se lee | Descripción |
|---|---|---|---|---|
| `NODE_ENV` | No (pero si se define, el valor se valida) | `"development"` | `src/config/env.js` (`env.nodeEnv`) | Entorno de ejecución. Solo admite `"development"`, `"test"` o `"production"`: cualquier otro valor hace que `env.js` lance un `Error` en tiempo de import nombrando el valor recibido y los permitidos. Determina si se activan las guardas fail-fast de `CORS_ALLOWED_ORIGINS` y `MONGODB_URI`. La validación por lista cerrada existe para que un `NODE_ENV=Production` (o mal escrito) en Render **falle ruidosamente** en vez de degradar en silencio a modo desarrollo y saltarse ambas guardas. |
| `PORT` | No | `3000` | `src/config/env.js` (`env.port`), consumido en `server.js` (`app.listen(env.port, "0.0.0.0")`) | Puerto de escucha del servidor Express. En desarrollo local se fija a `4000` en `.env` (el frontend lo espera ahí). En Render, la plataforma inyecta su propio `PORT` (ver `docs/render-deployment.md`). |
| `MONGODB_URI` | **Sí, en producción** | `"mongodb://localhost:27017/StyleBusters"` (solo en `development`/`test`) | `src/config/env.js` (`env.mongodbUri`), consumido en `src/config/db.conf.js` (`mongoose.connect(env.mongodbUri)`) | Cadena de conexión a MongoDB. En `NODE_ENV === "production"`, si no está definida, `env.js` lanza `Error("Falta configurar MONGODB_URI en producción")` **en tiempo de import** (el proceso no llega a arrancar). En `development`/`test` sin definir, usa el default de `localhost`. |
| `FRONTEND_URL` | No (recomendada) | `"http://localhost:3000"` | `src/config/env.js` (`env.frontendUrl`) | URL del frontend. Único punto de verdad para el default de `CORS_ALLOWED_ORIGINS` cuando esta última no está definida (`corsAllowedOrigins` se deriva de `[frontendUrl]`). No aborta el arranque en producción si falta: hoy no tiene ningún consumidor crítico en runtime (no hay emails, redirecciones ni callbacks OAuth en el código real). Ver "Decisiones aplazadas" más abajo. |
| `CORS_ALLOWED_ORIGINS` | **Sí, en producción** | `[frontendUrl]` (lista de un elemento) | `src/config/env.js` (`env.corsAllowedOrigins`), consumido en `server.js` (función `corsOptions.origin`) | Lista de orígenes permitidos por CORS, separados por comas (se parsea con `trim` + `filter(Boolean)`, tolera espacios y comas colgantes). En `NODE_ENV === "production"`, si la lista queda vacía tras el parseo, `env.js` lanza `Error("Falta configurar CORS_ALLOWED_ORIGINS en producción")` en tiempo de import. `FRONTEND_URL` solo aporta el default de desarrollo; nunca sustituye esta validación de producción. |
| `JWT_SECRET` | Sí (para que la firma sea segura; el código no valida su presencia) | — | `process.env` directo en `authController.js` (`jwt.sign(...)`, `jwt.verify(...)` vía `authMiddleware.js`) | Secreto de firma del access token (`expiresIn: "1h"`). No se lee desde `src/config/env.js`: se accede directamente vía `process.env` donde se usa. |
| `JWT_REFRESH_TOKEN` | Sí (mismo criterio que `JWT_SECRET`) | — | `process.env` directo en `authController.js` (`jwt.sign({ userId }, ..., { expiresIn: "7d" })`) | Secreto de firma del refresh token, distinto de `JWT_SECRET`. |
| `ADMIN_SECRET` | Sí (si se deja vacío, cualquier registro sin `adminSecret` se crea como admin — [K01](known-issues.md#K01)) | — | `process.env` directo en `authController.js` (`register`) | Secreto que habilita el registro con `role: "admin"` cuando `adminSecret === process.env.ADMIN_SECRET`. |

**Lectura centralizada vs. directa:** `NODE_ENV`, `PORT`, `MONGODB_URI`, `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` pasan por `src/config/env.js` (evaluado una sola vez, en tiempo de import, con las guardas de producción descritas arriba). `JWT_SECRET`, `JWT_REFRESH_TOKEN` y `ADMIN_SECRET` se leen con `process.env` directamente en los controllers que los usan (no pasan por `env.js`); así lo documenta el propio comentario de `env.js`.

**Ninguna variable de backend se expone al cliente.** El backend no incrusta ninguna de estas variables en ninguna respuesta HTTP ni en ningún artefacto servido al navegador; todas viven exclusivamente en el proceso Node del servidor.

## Frontend (`Style-Busters-main/`)

| Variable | Obligatoria | Default | Dónde se lee | Descripción |
|---|---|---|---|---|
| `REACT_APP_API_URL` | **Sí, siempre** (sin fallback) | Ninguno | `src/Services/apiClient.js` (`process.env.REACT_APP_API_URL`) | URL base del cliente HTTP (`axios`). Si no está definida (`undefined` o cadena vacía) al cargarse el módulo, `apiClient.js` lanza un `Error` explícito — no hay fallback a `localhost` ni a ninguna URL de producción hardcodeada. |

### Convención: prefijo `REACT_APP_` y sufijo `/api`

El proyecto usa **Create React App / `react-scripts` 5.0.1**, no Vite ni Next.js. La única convención de variables públicas que el bundler de producción (`react-scripts build`) sustituye en el bundle es el prefijo **`REACT_APP_*`**; el acceso en código es siempre vía `process.env.REACT_APP_API_URL` (no hay ningún mecanismo `import.meta.env` en el código real — Vitest usa el plugin de Vite solo para transformar JSX en los tests, no para el build de producción).

**La URL incluye el sufijo `/api`** (p. ej. `http://localhost:4000/api`, no solo `http://localhost:4000`). Todos los servicios conectados a la API (`authService`, `productService`, `cartService`, `categoryService`) llaman **paths relativos sin repetir el prefijo** (`/auth/login`, `/products`, `/cart`, `/orders`, `/categories`); si `REACT_APP_API_URL` no incluyera `/api`, o si algún servicio futuro concatenara `/api` por su cuenta, las peticiones duplicarían el segmento (`/api/api/...`). Al añadir un servicio nuevo: usar siempre un path relativo, nunca anteponer `/api` de nuevo.

### Advertencia — `REACT_APP_*` es público

**Toda** variable con prefijo `REACT_APP_*` queda incrustada, en texto plano, en el bundle JavaScript servido al navegador (visible con solo abrir las herramientas de desarrollador). `REACT_APP_API_URL` es, por diseño, una URL pública y no un secreto, por lo que hoy no hay ningún riesgo de fuga. **Ninguna variable `REACT_APP_*` debe contener nunca un secreto** (API keys privadas, tokens de firma, credenciales, etc.): si un `REACT_APP_*` necesitara un valor sensible en el futuro, la variable no es el mecanismo adecuado (requeriría un backend intermediario).

### Sin fallback

`apiClient.js` no cae a ningún valor por defecto si falta `REACT_APP_API_URL`: lanza el error al importarse, de forma temprana y visible, en vez de apuntar en silencio a `localhost` (que fallaría en producción) o a una URL de producción hardcodeada (que reintroduciría el problema original).

## Variables solo de test / E2E

Estas variables no las lee el código de producción del frontend; solo existen para configurar herramientas de test/E2E:

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `CYPRESS_BASE_URL` | `Style-Busters-main/cypress.config.js` (`baseUrl`) | Mecanismo nativo de Cypress: sobreescribe `baseUrl` automáticamente. Default local si no está definida: `http://localhost:3000`. |
| `CYPRESS_API_URL` | `Style-Busters-main/cypress.config.js` (`env.apiUrl`, leído explícitamente como `process.env.CYPRESS_API_URL`) | Cypress **no** mapea automáticamente cualquier `CYPRESS_*` a `Cypress.env()` en minúsculas (`CYPRESS_API_URL` no cae solo en `Cypress.env("apiUrl")`); por eso `cypress.config.js` la lee explícitamente. Default local: `http://localhost:4000/api`. |
| `TEST_USER_EMAIL` | `Base_Datos_StyleB/scripts/e2e-server.js` (seed determinista) | Email del usuario sembrado para los E2E. Default: `e2e@styleb.test`. También se usa como valor fijo (`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`) dentro de `Style-Busters-main/cypress.config.js` (`env`). |
| `TEST_USER_PASSWORD` | `Base_Datos_StyleB/scripts/e2e-server.js` (seed determinista) | Password en texto plano del usuario E2E, hasheado antes de guardarse. Default: `Test1234!`. |

**Vitest y `REACT_APP_API_URL`:** Vitest **no carga archivos `.env`** (a diferencia del dev server de CRA). Por eso `Style-Busters-main/vitest.config.js` provee la variable directamente vía `test.env`:

```js
test: {
  env: {
    REACT_APP_API_URL: "http://localhost:4000/api",
  },
  // ...
}
```

Sin esa entrada, `apiClient.js` lanzaría al importarse durante los tests (no hay `.env` cargado por Vitest). Este mismo problema se blinda también en CI: `.github/workflows/ci.yml`, job `frontend-unit`, fija `REACT_APP_API_URL` a nivel de job (aplica a los pasos `test:coverage` y `CI=false npm run build`), como defensa explícita aunque el build de CRA/webpack no ejecute `apiClient.js` en tiempo de build (solo lo bundlea).

## Archivos `.env` locales

Cada proyecto tiene su propia plantilla `.env.example` versionada en git; `.env` está en `.gitignore` en ambos proyectos (no se sube nunca con valores reales).

- **Backend:** copiar `Base_Datos_StyleB/.env.example` a `Base_Datos_StyleB/.env` y completar `JWT_SECRET`, `JWT_REFRESH_TOKEN` y `ADMIN_SECRET` con valores propios; `MONGODB_URI`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `NODE_ENV` y `PORT` ya traen defaults de desarrollo utilizables tal cual.
- **Frontend:** copiar `Style-Busters-main/.env.example` a `Style-Busters-main/.env`; ya trae `REACT_APP_API_URL=http://localhost:4000/api` (default de desarrollo apuntando al backend local). Sin este paso, `npm start` arranca igual (CRA no valida nada en su propio proceso de arranque), pero la app lanzará el error de `apiClient.js` recién al cargarse en el navegador.

## Procedimiento: añadir un nuevo origen permitido a CORS

1. Editar `CORS_ALLOWED_ORIGINS` como lista separada por comas (el parseo de `env.js` tolera espacios y comas colgantes), añadiendo el nuevo origen sin quitar los existentes que se sigan necesitando.
2. **Local:** editar la línea `CORS_ALLOWED_ORIGINS=...` en `Base_Datos_StyleB/.env` y reiniciar el proceso (`npm run dev` o `npm start`), ya que `env.js` se evalúa una sola vez, en tiempo de import.
3. **Render:** editar la variable `CORS_ALLOWED_ORIGINS` en el dashboard del servicio backend (a confirmar en el dashboard: nombre exacto de la sección de variables de entorno) y reiniciar el servicio (Render reinicia el proceso al guardar cambios en variables de entorno de un Web Service; a confirmar en el dashboard si aplica algún paso adicional).

## Diferencias dev / test / producción

| Aspecto | `development` | `test` | `production` |
|---|---|---|---|
| `MONGODB_URI` sin definir | Usa default `localhost:27017/StyleBusters` | Usa default `localhost:27017/StyleBusters` (en la práctica, `tests/setup.js` fija su propia URI de `mongodb-memory-server` antes de que se lea) | **Arranque falla** (`Error` en tiempo de import) |
| `CORS_ALLOWED_ORIGINS` sin definir | Deriva de `frontendUrl` (`http://localhost:3000`) | Igual que development | **Arranque falla** (`Error` en tiempo de import) |
| `FRONTEND_URL` sin definir | Default `http://localhost:3000` | Default `http://localhost:3000` | Default `http://localhost:3000` (no bloquea el arranque; ver decisión aplazada) |
| `REACT_APP_API_URL` sin definir (frontend) | `apiClient.js` lanza al cargarse | Vitest la provee vía `test.env`; sin esa entrada también lanzaría | El build fallaría en runtime al primer uso de `apiClient` si no se fija antes del build (variable incrustada en tiempo de build) |
| Backend en Render | No aplica | No aplica | `NODE_ENV=production` activa ambas guardas fail-fast; Render inyecta su propio `PORT` |

## Decisión aplazada

`FRONTEND_URL` no aborta el arranque en producción si falta, porque hoy no tiene ningún consumidor crítico en runtime (no hay emails transaccionales, redirecciones ni callbacks OAuth en el código real). Si en el futuro se introduce un consumidor crítico de `FRONTEND_URL`, esta decisión debe revisarse y endurecerse con una guarda fail-fast análoga a la de `MONGODB_URI`/`CORS_ALLOWED_ORIGINS` (registrado en backlog, ver `docs/backlog.md`).
