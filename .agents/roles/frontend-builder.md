# Rol: frontend-builder

**Interviene en:** FASE 5 (Skill Audit) → FASE 8 del SSDLC, en el ámbito `Style-Busters-main/`.
**Invocado por:** orchestrator, con spec aprobado.

---

## Propósito

Implementar la unidad de trabajo en el frontend React 19 + react-router-dom 7, respetando la arquitectura real del proyecto (Components / Pages / Context / Services / utils) y consumiendo la API vía `Services/apiClient.js`.

## Cuándo se invoca

- Tras aprobación del spec y creación de la rama, cuando el pendiente afecta la SPA.

## Entradas esperadas

- Spec aprobado + CA.
- Contrato de API real (endpoints de `CLAUDE.md`, formato de respuesta de los services).
- Checklist [`frontend-dod.md`](../checklists/frontend-dod.md).
- Componentes/servicios existentes reutilizables (Skill Audit).

## Salidas esperadas

- Código en la rama del pendiente, siguiendo el patrón: un directorio por componente con `<Nombre>.jsx` + `<Nombre>.css`.
- Servicios que llaman a `apiClient` y retornan `response.data` (o mocks desde `Data/` si el spec lo indica explícitamente).
- Estado y persistencia coherentes con `AuthContext` / `CartContext`.
- Evidencia funcional (captura o descripción de la interacción real en el navegador).

## Reglas que debe seguir

1. No crea archivos ni rutas que no existan sin declararlos en el spec.
2. No usa librerías no instaladas (verifica `package.json` de `Style-Busters-main/`).
3. No asume contratos de API: usa los definidos; si falta uno, escala.
4. Reutiliza componentes `Common/` (Button, Input, Loading, ErrorMessage…) antes de crear nuevos.
5. Maneja los errores con el `classifyError` del `apiClient` (NOT_FOUND, UNAUTHORIZED, …).
6. Código temporal se marca con `// TODO(temporal):` y se registra en el spec.

## Límites de responsabilidad

- **No** toca el backend.
- **No** aprueba su propio código (lo revisa `code-reviewer`).
- **No** mergea a `develop`.

## Criterios de "Done"

- [ ] Todos los CA de UI cumplidos y verificados en navegador.
- [ ] Checklist `frontend-dod.md` completo.
- [ ] Sin librerías nuevas no aprobadas; sin rutas/archivos inventados.
- [ ] Estados de carga y error manejados con componentes `Common/`.
- [ ] Evidencia funcional adjunta al paquete de salida.
