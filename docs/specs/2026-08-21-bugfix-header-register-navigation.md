# Spec: El botón "Crear Cuenta" del Header no navega a /register

## Metadata
- **Tipo:** bugfix
- **Complejidad:** XS
- **Fecha:** 2026-08-21
- **Estado:** DONE
- **ID de backlog:** FE-HEADER-REGISTER-NAV-2026-08-21
- **Ejecutor:** orchestrator (Fable), a solicitud directa del usuario

## Historia

Como usuario que navega la SPA de `Style-Busters-main` sin sesión iniciada, quiero que el botón "Crear Cuenta" del menú de usuario del Header me lleve al formulario de registro, para poder crear una cuenta, en vez de que el botón no haga nada al hacer click.

- **Específica:** corregir `handleRegister` y los dos botones "Crear Cuenta" (dropdown de escritorio y menú móvil) en `Style-Busters-main/src/Layout/Header/Header.jsx` para que naveguen a la ruta `/register` ya existente, replicando el patrón ya usado por el botón "Iniciar Sesión" (`<Link to="/login">`).
- **Medible:** CA-1 y CA-2 verificables por lectura de código y por test automatizado (`Header.test.jsx`).
- **Alcanzable:** cambio acotado a 1 archivo de producto (`Header.jsx`) + 1 archivo de test (`Header.test.jsx`), sin tocar rutas, backend ni contratos.
- **Relevante:** el usuario (dueño del repo) reportó el bug directamente ("al dar click a ese botón, no hace nada").
- **Temporal:** complejidad XS — 3 ediciones puntuales en un único componente, sin cambio de comportamiento fuera de lo pedido.

## Contexto

El usuario reportó que el botón "Crear Cuenta" visible en el dropdown del Header no producía ninguna navegación al hacer click.

Exploración de código real (`Style-Busters-main/src/Layout/Header/Header.jsx`, `Style-Busters-main/src/App/App.jsx`) confirmó la causa raíz:

1. **`handleRegister` (antes de este fix) nunca invocaba navegación.** Solo ejecutaba `console.log("Redirigir a registro")` y cerraba los menús desplegables (`setIsUserMenuOpen(false)`, `setIsMobileMenuOpen(false)`) — un handler placeholder que quedó sin terminar.
2. **El botón estaba implementado como `<button onClick={handleRegister}>`, no como `<Link>`.** Esto ocurría en dos sitios: el dropdown de escritorio (dentro de `.user-dropdown` / `.auth-section`) y el menú móvil (`.mobile-auth-buttons`). En ambos casos, el botón "Iniciar Sesión" inmediatamente adyacente sí estaba correctamente implementado como `<Link to="/login" onClick={handleLogin}>`.
3. **La ruta de destino ya existe y está correctamente montada.** `App/App.jsx` importa `Register` de forma lazy (`const Register = lazy(() => import("../Pages/Register"))`) y la registra en `<Route path="/register" element={<Register />} />`. El problema no era la ausencia de la página ni de la ruta, sino que el botón nunca la invocaba.

## Criterios de Aceptación

- [x] **CA-1 — El botón "Crear Cuenta" navega a `/register`.** En `Header.jsx`, ambos botones "Crear Cuenta" (dropdown de escritorio, línea ~229, y menú móvil, línea ~356) se convierten de `<button onClick={handleRegister}>` a `<Link to="/register" onClick={handleRegister}>`, siguiendo exactamente el mismo patrón que el botón "Iniciar Sesión" adyacente (`<Link to="/login" onClick={handleLogin}>`). `handleRegister` se simplifica para solo cerrar los menús (`setIsUserMenuOpen(false)`, `setIsMobileMenuOpen(false)`), igual que `handleLogin`, eliminando el `console.log` placeholder. Verificable: `Header.jsx` no contiene ningún `<button onClick={handleRegister}>`; ambas instancias son `<Link to="/register">`.
- [x] **CA-2 — Cobertura de regresión automatizada.** `Header.test.jsx` (ya existente, con `MemoryRouter` + mocks de `AuthContext`/`CartContext`/`ThemeContext`) agrega un caso que abre el menú de usuario (click en el botón `aria-label="Menú de usuario"`) y verifica que el link con texto "Crear Cuenta" tenga `href="/register"`. Verificable: `npm test -- Header.test.jsx` pasa, incluyendo el nuevo caso.
- [x] **CA-3 — Sin regresión en el resto de la suite.** `npm test` (suite completa de `Style-Busters-main`) sigue en verde tras el cambio. Verificable: salida de `npm test`.

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna aplica — el cambio es exclusivamente de navegación cliente (JSX) hacia una ruta pública ya existente y ya accesible sin autenticación (`/register`, fuera de `<ProtectedRoute>`). Justificación por categoría:
  - **Spoofing:** N/A. No se toca `AuthContext`, `authService` ni el manejo de tokens.
  - **Tampering:** N/A. No se modifica ningún payload enviado a la API; `Register`/`RegisterForm` no se tocan.
  - **Repudiation:** N/A. No se toca logging ni auditoría.
  - **Information Disclosure:** N/A. No se expone ni se deja de exponer ningún dato; la ruta `/register` ya era pública antes de este fix.
  - **Denial of Service:** N/A. Cambio estático de JSX, sin bucles, timers ni llamadas de red nuevas.
  - **Elevation of Privilege:** N/A. `/register` no está protegida por `ProtectedRoute.jsx` ni antes ni después del cambio.
- **Controles de mitigación:** ninguno adicional requerido.
- **Inputs que requieren validación:** ninguno nuevo (no se toca `RegisterForm.jsx`).
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** ninguna.

## Dependencias

- **Internas** (`Style-Busters-main/src/` salvo que se indique lo contrario):
  - `Layout/Header/Header.jsx` — CA-1 (archivo objetivo)
  - `Layout/Header/Header.test.jsx` — CA-2
  - `App/App.jsx` (solo lectura de referencia — confirma que la ruta `/register` y el componente `Register` ya existen y están montados) — CA-1
  - `Layout/Header/Header.css` (solo lectura de referencia — confirma que `.auth-btn`/`.mobile-auth-btn` son selectores de clase, no de elemento `button`, por lo que el cambio de `<button>` a `<Link>` no requiere tocar CSS) — CA-1
- **Externas:** ninguna librería nueva. `@testing-library/user-event` (CA-2) ya es dependencia existente del proyecto (`package.json`, `devDependencies`).

## Decisiones de Diseño

- **Se reutiliza el patrón exacto de "Iniciar Sesión", no se inventa uno nuevo.** El botón "Iniciar Sesión" adyacente ya resolvía correctamente el mismo problema (`<Link to="/login" onClick={handleLogin}>`); "Crear Cuenta" se corrige replicando esa misma estructura en vez de introducir un mecanismo de navegación distinto (p. ej. `navigate()` imperativo, ya usado en otros handlers como `handleLogout`, pero no es el patrón usado por los botones de auth de este dropdown).
- **`handleRegister` se conserva como función** (no se elimina y se pasa `handleLogin` directamente) porque cierra ambos menús (`isUserMenuOpen`, `isMobileMenuOpen`), mismo comportamiento que `handleLogin` — mantiene la simetría entre ambos handlers de auth.

## Riesgos y Deuda Técnica

- Riesgo nulo: los selectores CSS afectados (`.auth-btn`, `.mobile-auth-btn` y sus variantes `.primary`/`.secondary`) son por clase, ya compartidos con el `<Link>` de "Iniciar Sesión" en el mismo contenedor — no hay riesgo de romper estilos.
- No se genera deuda técnica nueva.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna.
- **Comportamientos inconsistentes detectados:** ninguno nuevo, fuera de lo ya corregido.
- **Gaps entre frontend y backend:** ninguno.
- **Trabajo fuera de alcance en esta iteración:** ninguno.

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-08-21
- **Estado final:** DONE
- **CAs cumplidos:** CA-1, CA-2, CA-3 — los 3.
- **CAs no cumplidos:** ninguno.
- **Deuda técnica generada:** ninguna.
- **Lecciones aprendidas:** el botón quedó como un handler placeholder (`console.log`) nunca conectado a navegación real, mientras el botón adyacente ("Iniciar Sesión") sí seguía el patrón correcto — señal de que conviene revisar por consistencia los demás CTAs del Header que compartan el mismo bloque de código.
- **Pendientes abiertos confirmados:** ninguno.
- **Gaps no resueltos:** ninguno.
- **Backlog derivado creado:** no — el fix es completo dentro de este PR, sin pendientes derivados.
- **Referencias a historias/tareas creadas:**
  - Spec: [`docs/specs/2026-08-21-bugfix-header-register-navigation.md`](2026-08-21-bugfix-header-register-navigation.md) (este documento)
  - PR #14 — https://github.com/JuanAntonioMP99/Back_-_Front_StyleB/pull/14

## Matriz de cierre
| Item detectado | Detectado por | Estado | Acción |
|---|---|---|---|
| `handleRegister` sin navegación real (placeholder `console.log`) | Reporte directo del usuario + inspección de código (orchestrator) | Corregido | Cerrar |
| Botones "Crear Cuenta" como `<button>` en vez de `<Link to="/register">` (desktop + mobile) | Inspección de código (orchestrator) | Corregido | Cerrar |
