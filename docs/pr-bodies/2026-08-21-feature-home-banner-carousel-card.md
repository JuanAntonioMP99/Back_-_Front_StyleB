## Descripción

Se modifica `Style-Busters-main/src/Components/BannerCarousel/BannerCarousel.css` para contener el carrusel principal del Home dentro de un marco tipo "card grande", centrado horizontalmente en escritorio, con tratamiento visual de borde, radio y sombra reutilizado de patrones ya existentes en el repo (sin colores nuevos). El cambio es acotado a un único archivo CSS, sin modificación de JSX, props, datos ni lógica.

## Spec

`docs/specs/2026-08-21-feature-home-banner-carousel-card.md` · **Backlog ID:** FE-HOME-BANNER-CARD-2026-08-21

## Tipo de cambio

- [x] Feature

## Criterios de aceptación

- [x] CA-1: El carrusel deja de ser edge-to-edge en escritorio — evidencia: `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md` (TC-1, cumplido)
- [x] CA-2: Tratamiento visual tipo "card" coherente con el repo, sin colores nuevos — evidencia: `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md` (TC-2, cumplido)
- [x] CA-3: No-regresión funcional del carrusel — evidencia: `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md` (TC-3, cumplido)
- [x] CA-4: Responsive sin introducir breakpoints nuevos — evidencia: `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md` (TC-4, cumplido)
- [x] CA-5: Cambio acotado a un único archivo, sin contenido inventado — evidencia: `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md` (TC-5, cumplido)

## Quality Gates

- [x] Lint/build — `npm run build` (Style-Busters-main): PASS — "The build folder is ready to be deployed." 8 warnings preexistentes de ESLint (ProductDetails.jsx, RegisterForm.jsx, SearchResultsList.jsx, CartContext.jsx, Layout.jsx, CheckoutPage.jsx, HomePage.jsx), ninguno en BannerCarousel.
- [x] Tests — `npm test` (Style-Busters-main): PASS — 50 archivos, 206 tests, 0 fallos (Duration 26.16s). Tests dirigidos (BannerCarousel): 1 archivo, 3 tests, 0 fallos.
- [ ] E2E — no ejecutado en esta auditoría (cambio CSS puro, sin JSX/lógica; no solicitado por orchestrator para pendiente XS).
- [x] Diff revisado — 1 archivo modificado (`BannerCarousel.css`), 6 inserciones / 2 eliminaciones; sin secrets, sin console.log, sin código temporal.
- [x] Prueba funcional — todos los CA (CA-1 a CA-5) verificados con evidencia en `docs/test-plans/2026-08-21-feature-home-banner-carousel-card.md`.

## Revisiones independientes

- [x] code-reviewer: aprobado
- [x] security-reviewer: aprobado (STRIDE N/A — cambio exclusivamente de presentación CSS, sin auth/API/datos/tokens)
- [x] anti-hallucination-reviewer: limpio (sin rutas/endpoints/librerías inventadas)
- [ ] tech-reviewer: FALTA (se ejecutará sobre el PR abierto tras publish)
- [ ] Segunda opinión (Codex): FALTA (no disponible en este entorno)

## Pendientes y backlog derivado

- [x] Pendientes abiertos registrados en el spec: detectado hallazgo de `.main-content` huérfano en `Layout.css` (CSS declarado pero nunca aplicado en JSX), fuera de alcance de este spec, candidato a backlog separado.
- [ ] Backlog accionable creado y referenciado: FALTA (no se menciona ID de backlog derivado para limpieza de `.main-content`)

## Consideraciones de seguridad

**Amenazas STRIDE evaluadas:** ninguna aplica — pendiente exclusivamente de presentación (archivo CSS único, sin tocar autenticación, autorización, validación de inputs, llamadas a API, manejo de tokens ni persistencia).

- **Spoofing:** N/A — no se modifica `AuthContext`, `ProtectedRoute` ni `utils/auth.js`.
- **Tampering:** N/A — no se modifica ningún payload de API; `BannerCarousel` no consume servicios.
- **Repudiation:** N/A — no se altera logging ni auditoría.
- **Information Disclosure:** N/A — no se agrega ni se quita ningún dato mostrado.
- **Denial of Service:** N/A — CSS estático puro, sin nuevos timers/listeners/llamadas de red.
- **Elevation of Privilege:** N/A — Home es público; no se modifica `ProtectedRoute` ni rutas protegidas.

**Inputs que requieren validación:** ninguno.  
**Secrets involucrados:** ninguno.  
**Superficie de ataque afectada:** ninguna.

## Razonamiento (Vibe Coding)

Se interviene `BannerCarousel.css` porque es el punto de mínimo cambio con efecto observable directo. Se descartó modificar `Layout.css` (cuya clase `.main-content` con `max-width` existe pero nunca se aplica en JSX, es CSS muerto) por ser fuera de alcance y no lograr efecto real. Se reutiliza `--container-width: 1200px` de `index.css` (token activo en `.cart`, `.search-results-fullwidth`, `.list-grid`), no `1400px` de `.main-content` huérfano. Se aplica `max-width`/`margin: 0 auto` + `border-radius`/`border`/`box-shadow` directamente en `.banner-carousel` (mismo patrón que `.product-card`) sin wrapper JSX adicional, minimizando el cambio. Se aceptan los tradeoffs: (1) efecto "card con borde" plenamente visible solo en viewports >1200px (no-regresión en mobile: sigue edge-to-edge); (2) `border-radius` uniforme en todos los breakpoints (patrón consistente con `.product-card`).

## Breaking changes

Ninguno. Cambio puramente de presentación (CSS); no se modifica contrato de API, props de componentes, estructura de datos ni rutas.

---

**Commits en esta rama:** 2  
- `d2c84283` — `style(home): contener banner-carousel en card centrada`  
- `14e9cfb6` — `test(docs): agregar plan de prueba para feature home-banner-carousel-card`

**Rama:** `feature/home-banner-carousel-card` (ya empujada a origin)
