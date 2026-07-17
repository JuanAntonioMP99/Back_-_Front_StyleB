# Definition of Done — Backend (`Base_Datos_StyleB/`)

Checklist que `backend-builder` debe cerrar antes de entregar evidencia al orchestrator.

## Funcional
- [ ] Todos los CA de API verificados con **requests reales** (curl / cliente HTTP) contra `localhost`.
- [ ] Status codes correctos (200/201/204/400/401/403/404/422/500 según corresponda).
- [ ] 404 responde `{ message: "X not found" }`; validación falla con 422 `{ errors: [...] }`.

## Arquitectura y patrón
- [ ] Patrón model → controller (`async (req,res,next)` + `try/catch` + `next(error)`) → route.
- [ ] Imports locales con extensión `.js` (ESM); `export` nombrado al final.
- [ ] Cadena de middlewares en orden: `authMiddleware → isAdmin → validators → validate → controller`.
- [ ] Validadores `express-validator` como constantes locales del archivo de rutas.
- [ ] No inventa campos: usa el esquema Mongoose real.

## Seguridad
- [ ] Sin secrets hardcodeados; se usa `process.env` (`JWT_SECRET`, `JWT_REFRESH_TOKEN`, `ADMIN_SECRET`, `PORT`).
- [ ] `.env*` en `.gitignore`.
- [ ] Passwords con `bcrypt` (saltRounds 10) y excluidos con `.select("-password")`.
- [ ] Rutas sensibles con `authMiddleware` (+ `isAdmin` donde aplique).
- [ ] Errores al cliente sin stack traces ni detalles internos.

## Calidad
- [ ] Type/lint/format del proyecto sin errores.
- [ ] Sin código temporal sin marcar.

## Evidencia
- [ ] Registro de request/response (status + payload) adjunto.
