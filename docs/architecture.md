# Arquitectura — StyleBusters

> Estado: **proyecto en desarrollo, incompleto**. Este documento describe el **estado actual real** (código observado), no un estado objetivo. Última revisión: 2026-07-07.

## Visión general

Monorepo con **dos proyectos independientes** (no hay workspace raíz que los una):

| | Backend | Frontend |
|---|---|---|
| Carpeta | `Base_Datos_StyleB/` | `Style-Busters-main/` |
| Stack | Express 5 + Mongoose 9 (ESM) | React 19 + react-router-dom 7 (CRA) |
| Puerto | `PORT=4000` (`.env`) | 3000 (dev server CRA) |
| Arranque | `npm run dev` (nodemon) | `npm start` |

El frontend habla con el backend vía `apiClient` (axios, `baseURL: http://localhost:4000/api`). El puerto **coincide** con `PORT=4000` del backend.

## Backend

- **Router central** en `src/routes/index.js`, montado bajo `/api` en `server.js`.
- **Modelos** (`src/models/`): User, Product, Category, Cart, Order, Address, PaymentMethod, WishList.
- **Auth**: JWT Bearer. Access token 1h, refresh 7d (expiraciones **hardcodeadas** en `authController.js`, no se leen de `.env`). Password con bcrypt (saltRounds 10).
- **Middlewares**: `authMiddleware`, `isAdmin`, `validate` (express-validator), `errorHandler` (log a `logs/error.log`), `logger`.
- **CORS**: restringido a `http://localhost:3000`.
- **BD**: `db.conf.js` conecta a `mongodb://localhost:27017/StyleBusters` **hardcodeado**; **ignora** `MONGODB_URI` del `.env` (que apunta a `ecommerce-db-fusion`). → Ver [known-issues](known-issues.md#K02).

## Frontend

- **HTTP**: `Services/apiClient.js` (axios) con interceptores de token (`Authorization: Bearer` desde `localStorage.authToken`) y de clasificación de errores (`classifyError`).
- **Servicios conectados a la API**: `authService`, `productService`, `cartService`, `categoryService`.
- **Servicios mock** (JSON local + `setTimeout`): `paymentService`, `shippingService`, `userService`.
- **Estado**: Context API — `AuthContext` (login **simulado**, ver [known-issues](known-issues.md#K03)) y `CartContext` (carrito local + sync API).
- **Utilitarios**: `utils/auth.js` (token) **sin uso**; `utils/storageHelpers.js` (localStorage + normalizadores).

## Fuente de verdad (estado actual)

Hoy **no hay fuente de verdad única**. Coexisten backend/MongoDB, `localStorage` y JSON mock según el módulo. Ver [state-and-persistence.md](state-and-persistence.md).

## Variables de entorno (backend `.env`)

| Variable | Usada por el código | Nota |
|----------|---------------------|------|
| `PORT` | sí (`server.js`) | 4000 |
| `MONGODB_URI` | **no** | `db.conf.js` hardcodea la URI |
| `JWT_SECRET` | sí | valor débil versionado |
| `JWT_REFRESH_TOKEN` | sí | versionado |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | **no** | el código hardcodea "1h"/"7d" |
| `ADMIN_SECRET` | sí (`authController`) | **NO existe en `.env`** → ver [K01](known-issues.md#K01) |
