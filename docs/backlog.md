# Backlog priorizado — StyleBusters

> Derivado del diagnóstico (2026-07-07). Prioridad: **Crítico / Alto / Medio / Bajo**.
> Tipo: Bug · Refactor · Feature faltante · Alineación FE-BE · Deuda técnica · Documentación.
> Referencias `Kxx` → [known-issues.md](known-issues.md).

## Épicas

- **E1 · Seguridad e higiene del repo**
- **E2 · Autenticación real end-to-end**
- **E3 · Estabilización del backend (bugs)**
- **E4 · Fuente de verdad única (migración mock→API)**
- **E5 · Arranque y coherencia del frontend**
- **E6 · Documentación del proyecto**
- **E7 · Calidad (tests/CI)**

## E1 — Seguridad e higiene · Crítico
- F1.1 `.gitignore` + sacar `.env`/`node_modules`/`build`/`logs` de git · Deuda técnica · (K00)
- F1.2 Rotar `JWT_SECRET`/`JWT_REFRESH_TOKEN` y **añadir `ADMIN_SECRET`** al `.env`; `.env.example` · Deuda técnica · (K00, K01)
- F1.3 No persistir `cvv`; enmascarar/tokenizar `numCard` · Deuda técnica · (K10)

## E2 — Auth real · Crítico
- F2.1 Cablear `AuthContext` a `authService` + `utils/auth` (login/logout/token) · Alineación FE-BE · (K03)
- F2.2 Normalizar `user.id`/`_id` en toda la app · Bug · (K15)
- F2.3 Corregir la lógica de rol admin en `register` (exigir `ADMIN_SECRET` definido) · Bug · (K01)
- F2.4 `phone`: añadir al modelo o retirar del contrato · Bug · (K11)

## E3 — Estabilización backend · Alto
- F3.1 Direcciones: `import ...Address.js`, corregir `userId`, crear y montar `addressRoutes` · Bug · (K04)
- F3.2 Corregir `deletePaymentMethod` · Bug · (K05)
- F3.3 `WishList.products` → `ref: "Product"` · Bug · (K06)
- F3.4 `addProductToCart`: `populate("products.product")` + rutear o eliminar · Bug · (K07)
- F3.5 Proteger `POST/PUT/DELETE /products` con `auth + admin` · Alineación FE-BE · (K08)
- F3.6 `db.conf.js` desde `MONGODB_URI` · Deuda técnica · (K02)
- F3.7 Quitar middlewares duplicados en `POST /users` · Refactor
- F3.8 Corregir códigos HTTP (`createCart`, `updateOrderStatus`) · Bug · (K09)

## E4 — Fuente de verdad única · Alto/Medio
- F4.1 Carrito 100% API con caché local de invitado · Alineación FE-BE · (K14, K15)
- F4.2 Direcciones front → API · Feature faltante · (K14)
- F4.3 Pagos front → API · Feature faltante · (K14)
- F4.4 Crear orden real en checkout; historial desde API · Feature faltante · (K14)
- F4.5 `userService` → API · Alineación FE-BE
- F4.6 Wishlist: `wishlistService` + UI · Feature faltante · (K19)
- F4.7 JSON de `Data/` → `seeds/` de MongoDB · Refactor

## E5 — Arranque/coherencia FE · Crítico/Medio
- F5.1 Arreglar imports/rutas de `App.jsx` · Bug · (K13)
- F5.2 Config de API por env (`REACT_APP_API_URL`) · Alineación FE-BE
- F5.3 Eliminar/crear endpoint `/categories/:id/products` · Bug · (K18)
- F5.4 Limpiar `debugger;`, casing de imports, textos de contraseña · Bug · (K17)

## E6 — Documentación · Alto/Medio
- F6.1 README raíz + READMEs por proyecto · Documentación
- F6.2 Completar `docs/` (endpoints, data-model, business-rules) · Documentación
- F6.3 Alinear `SSDLC.md` al repo o marcarlo objetivo · Documentación

## E7 — Calidad · Medio/Bajo
- F7.1 Tests backend (auth, carrito, órdenes) · Feature faltante
- F7.2 CI mínima (lint + test) · Deuda técnica

## Orden de ejecución sugerido
1. **Crítico:** F1.1, F1.2, F1.3, F2.3, F5.1, F2.1
2. **Alto:** F3.1, F3.2, F3.3, F3.5, F3.6, F2.2, F5.2, F4.1–F4.4, F6.1
3. **Medio:** F3.4, F4.5, F4.6, F4.7, F5.3, F5.4, F6.2, F7.1
4. **Bajo:** F3.7, F3.8, F2.4, F6.3, F7.2
