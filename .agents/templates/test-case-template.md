# Plan de Prueba: [nombre-corto]

- **Spec:** `docs/specs/[…].md`  ·  **Backlog ID:** […]
- **Fecha:** YYYY-MM-DD
- **Autor (rol):** qa-test-designer
- **Ámbito:** backend `Base_Datos_StyleB/` | frontend `Style-Busters-main/`

## Entorno de prueba
- Backend: `http://localhost:4000/api` (según `apiClient`) / API en `PORT`.
- DB: `mongodb://localhost:27017/StyleBusters`.
- Datos de prueba: [describir o referenciar].

## Casos de prueba

### TC-1 — [mapea a CA-1]
- **Precondición:** […]
- **Pasos:**
  1. […]
  2. […]
- **Dato de entrada:** […]
- **Resultado esperado:** […]
- **Resultado real:** […]
- **Estado:** ✅ cumplido | ⚠️ parcial | ❌ no cumplido

### TC-2 — [caso negativo / error]
- **Precondición:** […]
- **Pasos:** […]
- **Resultado esperado:** [status de error correcto, sin fuga de info]
- **Resultado real:** […]
- **Estado:** […]

## Quality gates (evidencia)
```
# comando : resultado
type-check :
lint       :
format     :
tests      :
build      :
```

## Veredicto
| CA | Caso | Estado |
|----|------|--------|
| CA-1 | TC-1 | |
| CA-2 | TC-2 | |

**Resumen:** [todos cumplidos | N parciales | M no cumplidos → devolver al builder]
