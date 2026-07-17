# docs/ — Memoria documental del proyecto

Artefactos versionados que produce la capa de subagentes (`.agents/`) durante el SSDLC.

| Carpeta | Contenido | Rol productor |
|---------|-----------|---------------|
| `specs/` | Specs por pendiente (`[fecha]-[tipo]-[nombre].md`) | spec-writer / docs-keeper |
| `test-plans/` | Planes de prueba con evidencia por CA | qa-test-designer |
| `adrs/` | Architecture Decision Records (`ADR-NNNN-*.md`) | architecture-reviewer |
| `contracts/` | Contratos de API (endpoints, payloads, códigos) | docs-keeper |
| `runbooks/` | Guías operativas (arranque, despliegue, incidentes) | release-observability / docs-keeper |
| `threat-models/` | Modelados STRIDE consolidados por dominio | security-reviewer |

Plantillas base en [`.agents/templates/`](../.agents/templates/).
