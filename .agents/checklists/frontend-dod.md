# Definition of Done — Frontend (`Style-Busters-main/`)

Checklist que `frontend-builder` debe cerrar antes de entregar evidencia al orchestrator.

## Funcional
- [ ] Todos los CA de UI del spec verificados **en el navegador** (no solo en teoría).
- [ ] Estados de carga (`Loading`) y error (`ErrorMessage`) manejados.
- [ ] Errores de API tratados con `classifyError` del `apiClient` (NOT_FOUND, UNAUTHORIZED, FORBIDDEN, VALIDATION, …).

## Arquitectura y patrón
- [ ] Un directorio por componente: `<Nombre>.jsx` + `<Nombre>.css`.
- [ ] Reutiliza `Components/Common/` (Button, Input, Loading, Badge, Icon) antes de crear nuevos.
- [ ] Estado global vía `AuthContext` / `CartContext`; hooks (`useAuth`, `useCart`) usados dentro de su provider.
- [ ] Servicios llaman a `apiClient` y retornan `response.data` (o mock desde `Data/` solo si el spec lo pide).

## Anti-alucinación
- [ ] Sin rutas/archivos inexistentes.
- [ ] Sin librerías fuera de `package.json` de `Style-Busters-main/`.
- [ ] Endpoints consumidos existen según `CLAUDE.md` / backend real.

## Calidad
- [ ] Sin `console.log` de debug.
- [ ] Código temporal marcado con `// TODO(temporal):` y anotado en el spec.
- [ ] Lint/format del proyecto sin errores.

## Evidencia
- [ ] Captura o descripción reproducible de la interacción real.
