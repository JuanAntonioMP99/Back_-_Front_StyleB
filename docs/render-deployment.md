# Despliegue en Render — StyleBusters

> Describe cómo desplegar los dos servicios independientes del repo
> (`Base_Datos_StyleB/` y `Style-Busters-main/`) en Render, como dos servicios
> separados. Deriva de los specs
> [`2026-07-30-infra-env-config-backend.md`](specs/2026-07-30-infra-env-config-backend.md)
> (ENV-01, CA-8) y [`2026-07-30-infra-env-config-frontend.md`](specs/2026-07-30-infra-env-config-frontend.md)
> (ENV-02, CA-13). Nombres de variables documentados; **ningún valor real**.
> Todo lo marcado como "a confirmar en el dashboard" no está verificado contra
> Render directamente (fuera del alcance de un cambio de código).

## Servicio backend (`Base_Datos_StyleB/`)

- **Tipo de servicio:** Web Service.
- **Root directory:** `Base_Datos_StyleB`.
- **Build command:** `npm ci`.
- **Start command:** `npm start` (definido en `Base_Datos_StyleB/package.json` como `node server.js`).
- **Variables a configurar en el dashboard** (nombres, sin valores reales — ver `docs/environment-variables.md` para default/obligatoriedad de cada una):
  - `NODE_ENV=production`
  - `MONGODB_URI`
  - `FRONTEND_URL`
  - `CORS_ALLOWED_ORIGINS`
  - `JWT_SECRET`
  - `JWT_REFRESH_TOKEN`
  - `ADMIN_SECRET`
- **`PORT`:** no se configura manualmente. Render inyecta su propia variable `PORT` al proceso; `server.js` ya la usa vía `env.port` y llama `app.listen(port, "0.0.0.0")` (escuchar en `0.0.0.0`, no solo en `localhost`, ya es compatible con el modelo de red de Render).
- **`NODE_ENV=production`:** activa las guardas fail-fast de `src/config/env.js` — el proceso **no arranca** si faltan `MONGODB_URI` o `CORS_ALLOWED_ORIGINS` (lanzan `Error` en tiempo de import), en vez de arrancar en silencio con un default de `localhost` inservible en producción. El valor debe escribirse **exactamente** `production` (en minúsculas): `env.js` valida `NODE_ENV` contra la lista cerrada `development` / `test` / `production` y aborta el arranque con un error explícito ante cualquier otro valor, de modo que una errata en el dashboard no pueda desactivar las guardas en silencio.

## Servicio frontend (`Style-Busters-main/`)

- **Tipo de servicio:** Static Site.
- **Root directory:** `Style-Busters-main`.
- **Build command:** `npm ci --legacy-peer-deps && npm run build`.
- **Publish directory:** `build`.
- **Variable a configurar:** `REACT_APP_API_URL`, apuntando a la URL del backend ya desplegado en Render, **incluyendo el sufijo `/api`** (p. ej. `https://<tu-backend>.onrender.com/api`; ver convención en `docs/environment-variables.md`).

> **Advertencia — rebuild + redeploy obligatorio:** las variables `REACT_APP_*`
> de Create React App se incrustan **en tiempo de build** (el proceso
> `react-scripts build` las sustituye en el bundle JavaScript estático). Cambiar
> `REACT_APP_API_URL` en el dashboard de Render **no tiene ningún efecto** sobre
> el sitio ya desplegado hasta que se dispare un **rebuild + redeploy**
> completo del Static Site. No basta con "guardar" la variable.

## Orden de despliegue

Existe una dependencia circular documental entre ambos servicios: el frontend necesita conocer la URL del backend (`REACT_APP_API_URL`) y el backend necesita conocer la URL del frontend (`FRONTEND_URL` / `CORS_ALLOWED_ORIGINS`) para autorizarla en CORS. En Render, el nombre de host de un servicio (`https://<nombre-elegido>.onrender.com`) normalmente se conoce **antes** de terminar el primer despliegue (se define al crear el servicio), lo que permite resolver el ciclo de dos formas:

1. **Desplegar el backend primero, con la URL prevista del frontend:** al crear el servicio backend en Render, fijar `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` con la URL que tendrá el Static Site del frontend (conocida de antemano por el nombre elegido para el servicio, aunque el frontend aún no exista). Luego crear el servicio frontend con `REACT_APP_API_URL` apuntando a la URL ya conocida del backend.
2. **Desplegar en cualquier orden y actualizar `CORS_ALLOWED_ORIGINS` después:** si la URL final de alguno de los dos servicios cambia (por ejemplo, Render asigna un nombre distinto al solicitado), actualizar `CORS_ALLOWED_ORIGINS` en el dashboard del backend con la URL real del frontend y reiniciar el servicio backend (ver procedimiento en `docs/environment-variables.md`). Si cambia la URL del backend, hay que además actualizar `REACT_APP_API_URL` en el frontend y disparar un rebuild + redeploy (ver advertencia arriba).

En cualquiera de los dos casos, el paso final de verificación es el mismo: confirmar que el origen del frontend desplegado está en `CORS_ALLOWED_ORIGINS` del backend desplegado (ver sección de verificación post-despliegue).

## Ejemplos de URLs

| Servicio | Entorno | Ejemplo |
|---|---|---|
| Frontend | Local | `http://localhost:3000` |
| Backend | Local | `http://localhost:4000` (la API vive bajo `/api`, p. ej. `http://localhost:4000/api/products`) |
| Frontend | Render | `https://<tu-frontend>.onrender.com` |
| Backend | Render | `https://<tu-backend>.onrender.com` (la API vive bajo `/api`, p. ej. `https://<tu-backend>.onrender.com/api`) |

Los placeholders `<tu-frontend>` / `<tu-backend>` son marcadores de posición; el nombre real del subdominio de Render se define al crear cada servicio (a confirmar en el dashboard).

## Cookies / `trust proxy` — no aplica hoy

Esta sección **no aplica** al estado actual del código: la autenticación es JWT Bearer transportado en el header `Authorization` (el token se guarda en `localStorage` del navegador, inyectado por el interceptor de `apiClient.js`). No hay cookies de sesión, WebSockets/Socket.IO, flujos OAuth ni envío de emails en el código real de ninguno de los dos proyectos. En consecuencia, hoy no hace falta configurar `app.set("trust proxy", 1)` en `server.js`, ni atributos de cookie (`sameSite: "none"`, `secure: true`).

Si en el futuro se introdujeran cookies de sesión (o cualquier mecanismo que dependa de la IP/protocolo real del cliente detrás del proxy inverso de Render), habría que revisar:
- `app.set("trust proxy", 1)` en `server.js`, para que Express confíe en las cabeceras `X-Forwarded-*` que añade el proxy de Render (necesario para que `req.secure`/`req.ip` reflejen la conexión real del cliente).
- Atributos de cookie `sameSite: "none"` y `secure: true` si el frontend y el backend siguen sirviéndose desde orígenes distintos (subdominios `.onrender.com` diferentes), condición necesaria para que el navegador acepte cookies cross-site sobre HTTPS.

## Verificación post-despliegue

Comprobar que el CORS del backend desplegado autoriza al frontend y rechaza orígenes no autorizados, usando un endpoint real y existente de la API (`GET /api/products`, público, sin autenticación):

```bash
# Origen autorizado (debe estar en CORS_ALLOWED_ORIGINS del backend):
# responde 200 con el listado de productos y cabecera Access-Control-Allow-Origin.
curl -i -H "Origin: https://<tu-frontend>.onrender.com" \
  https://<tu-backend>.onrender.com/api/products

# Origen NO autorizado: el callback de corsOptions.origin en server.js llama a
# next(new Error(...)); responde 500 con {"status":"error","message":"Internal
# Server Error"} y SIN cabecera Access-Control-Allow-Origin.
curl -i -H "Origin: https://origen-no-autorizado.example.com" \
  https://<tu-backend>.onrender.com/api/products
```

Verificado localmente contra `node ./scripts/e2e-server.js` con `CORS_ALLOWED_ORIGINS=http://localhost:3000`: el origen autorizado responde `200` con `Access-Control-Allow-Origin: http://localhost:3000`; el origen no autorizado responde `500` con el body `{"status":"error","message":"Internal Server Error"}` y sin esa cabecera. Distinguir por la **presencia/ausencia de la cabecera `Access-Control-Allow-Origin`** además del código de estado (`200` vs `500`), ya que ambas señales son consistentes con el comportamiento real del middleware `cors` en este `server.js`.
