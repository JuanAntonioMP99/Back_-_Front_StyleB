# Estrategia de pruebas — StyleBusters (full stack)

> Estrategia integral de calidad para el workspace (backend `Base_Datos_StyleB/` +
> frontend `Style-Busters-main/`). Consolida los cuatro niveles de prueba, sus
> responsabilidades y los criterios de aceptación. Documentos hermanos:
> [test-matrix.md](test-matrix.md) · [test-data.md](test-data.md) ·
> [running-tests.md](running-tests.md) · [known-issues.md](../known-issues.md) ·
> plan de la API [ecommerce-api-test-plan.md](../test-plans/ecommerce-api-test-plan.md).

## 1. Objetivo

Disponer de una red de seguridad automatizada, ejecutable y reproducible, que:

- permita refactorizar sin regresiones silenciosas (incluido cerrar los issues `K0x`);
- pruebe **cada cosa en el nivel que le corresponde** (no todo vía E2E);
- documente el comportamiento **real** del sistema, marcando en rojo (`it.fails`) lo que
  debería cambiar cuando se corrija un defecto conocido.

## 2. Pirámide de pruebas

```
        ▲  E2E (Cypress)           flujos críticos de usuario, pocos y estables
       ███                          register · login · checkout
      █████ Integración FE (MSW)   componente ↔ contexto ↔ servicio ↔ apiClient ↔ red
     ███████ Integración API        HTTP real (supertest) ↔ Mongo en memoria
    █████████ Unit (BE + FE)        reglas puras, middlewares, modelos, hooks, componentes
```

La distribución de referencia (60/25/15 unit/integración/E2E) se **ajusta a la arquitectura
real**: en el backend la lógica de negocio vive dentro de los controllers acoplada a Express
y Mongoose, así que la **integración vía supertest es el instrumento principal** del backend
(mayor valor por caso) y lo unitario se reserva a piezas puras (middlewares, `env.js`,
schemas). Ver justificación en §2 del plan de la API.

## 3. Responsabilidad de cada nivel

| Nivel | Herramientas | Qué prueba | Qué NO prueba |
|-------|--------------|------------|---------------|
| **Unit backend** | Vitest | Middlewares (`auth`, `isAdmin`, `validate`, `errorHandler`, `logger`), `env.js`, schemas Mongoose (required/enum/default/min-max) con `validateSync` | HTTP, wiring de rutas |
| **Integración API** | Vitest + supertest + mongodb-memory-server | Ruta + validadores + auth + controller + schema + respuesta, tal cual corre en prod; matriz de autorización; owner-checks; fuga de datos | UI, red del navegador |
| **Unit frontend** | Vitest + React Testing Library | Comportamiento visible de componentes, hooks y contextos (`AuthContext`, `CartContext`), utilidades; `ProtectedRoute` | Integración real con la API |
| **Integración FE** | Vitest + RTL + **MSW** | Componente ↔ contexto ↔ servicio ↔ **`apiClient` real** (interceptores, token, `classifyError`) contra red mockeada | Backend real, base de datos |
| **E2E** | Cypress | Flujos completos de usuario: registro, login, rutas protegidas, checkout en 4 fases | Casos negativos ya cubiertos abajo |

**Regla anti-duplicación:** un caso ya cubierto de forma fiable en unit/integración **no** se
reimplementa en Cypress. E2E se reserva a los caminos felices críticos y a la integración
visual real. La matriz justifica cada `No aplica`.

## 4. Datos de prueba

Estrategia común documentada en [test-data.md](test-data.md):

- **Backend:** factories en `tests/helpers/factories.js` (crean documentos reales en la Mongo
  en memoria); limpieza por `afterEach` (borra todas las colecciones); BD única por archivo.
- **Integración FE:** handlers MSW en `src/test/handlers.js` (forma real de la API);
  token de prueba en `src/test/token.js`.
- **E2E:** fixtures en `cypress/fixtures/` + `cypress/utils/testData.js`; comandos
  `cy.loginByApi()` / `cy.addProductToCart()`; la BD del backend E2E es efímera por arranque.

## 5. Alcance

**Dentro:** los dos proyectos del workspace, sus 8 recursos de API, autenticación/autorización,
catálogo, carrito, checkout y órdenes, y los contextos/servicios del frontend.

**Fuera (hoy):** pruebas de carga/rendimiento; `scripts/seed.js`; `addressController.js` (sin
rutas montadas, `K04`); pruebas de contrato formales FE↔BE (Fase 8, pendiente).

## 6. Cobertura como suelo, no como objetivo

Cada proyecto fija un **trinquete** en su `vitest.config.js`: umbrales que reflejan la cobertura
real medida y que **nunca bajan** (suben al cerrar cada bloque). El porcentaje es un piso
anti-regresión; la prioridad de los casos (seguridad, dinero, autorización, inventario) manda
sobre el número. Estado actual y valores en [test-matrix.md](test-matrix.md).

## 7. Integración continua

`.github/workflows/ci.yml` ejecuta en cada push/PR a `main`:

1. **backend** — `npm ci` + `npm run test:coverage` (unit + integración + trinquete), con caché
   del binario de mongod; publica `backend-coverage` como artefacto.
2. **frontend-unit** — `npm ci --legacy-peer-deps` + `npm run test:coverage` + build; publica
   `frontend-coverage`.
3. **e2e** — depende de que **backend** y **frontend-unit** pasen (`needs`); levanta backend
   efímero + CRA + Cypress headless; sube vídeos/capturas como artefacto si falla.

Ninguna etapa oculta errores: un fallo de test o del trinquete rompe el job.

## 8. Criterios de aceptación

La estrategia se considera integrada cuando: las pruebas existentes se conservan; unit e
integración están separadas; el frontend tiene unit + integración; los flujos críticos tienen
E2E; hay estrategia común de datos; existe matriz de trazabilidad; los scripts son consistentes;
hay documentación y pipeline de CI; **todas las suites se ejecutan** y los fallos se reportan
con honestidad; no hay pruebas deshabilitadas para simular éxito ni se declara terminado lo que
sigue fallando (los `it.fails` documentan defectos abiertos, no éxitos falsos).
