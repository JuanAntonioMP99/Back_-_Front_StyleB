# Cómo ejecutar las pruebas — StyleBusters

> Comandos listos para copiar. El workspace tiene **dos `package.json`** independientes;
> cada comando indica desde qué carpeta se ejecuta.
>
> **Nota Windows:** todos los scripts invocan los binarios vía `node ./node_modules/...`
> (funciona en cualquier ruta). Usar `npm run ...`, **no** `npx`.

## Backend — `Base_Datos_StyleB/`

Runner: Vitest 4 + supertest + mongodb-memory-server. No requiere MongoDB instalado ni `.env`
(el `setup.js` provee el entorno). La primera ejecución descarga el binario de mongod (~100 MB).

```bash
cd Base_Datos_StyleB

npm test                  # unit + integración
npm run test:unit         # solo tests/unit
npm run test:integration  # solo tests/integration
npm run test:watch        # modo watch
npm run test:coverage     # con cobertura + trinquete (umbrales de vitest.config.js)
```

Estado esperado: verde, con **casos rojos a propósito** (`it.fails`) que documentan defectos
`K0x`/owner-checks. Vitest los reporta como *expected fail*; no rompen el suite.

## Frontend — `Style-Busters-main/`

Runner unit/integración: Vitest 4 + React Testing Library + **MSW** (jsdom).

```bash
cd Style-Busters-main

npm test                  # unit + integración (MSW)
npm run test:watch        # modo watch
npm run test:coverage     # con cobertura + trinquete
```

## E2E — `Style-Busters-main/` (Cypress)

Cypress orquesta backend efímero + CRA + specs. **No corre en este entorno Windows/sandbox**;
sí en CI (Linux, Electron headless).

```bash
cd Style-Busters-main

npm run e2e:ci:headless   # backend efímero + CRA + Cypress headless (lo que corre en CI)
npm run e2e:open          # backend efímero + CRA + Cypress interactivo (local)
npm run cypress:open      # solo Cypress (requiere backend y CRA ya levantados)
```

## Todo el stack (dos terminales)

No hay workspace raíz que una ambos proyectos, así que se ejecutan por separado:

```bash
# Terminal 1
cd Base_Datos_StyleB && npm run test:coverage

# Terminal 2
cd Style-Busters-main && npm run test:coverage
```

## En CI

`.github/workflows/ci.yml` ejecuta automáticamente en push/PR a `main`: job **backend**
(coverage), job **frontend-unit** (coverage + build) y job **e2e** (Cypress), este último solo
si los dos anteriores pasan. Los reportes de cobertura y los artefactos de Cypress (en fallo)
quedan disponibles como artefactos del workflow.

## Documentos relacionados

- Estrategia: [strategy.md](strategy.md)
- Matriz de trazabilidad: [test-matrix.md](test-matrix.md)
- Datos de prueba: [test-data.md](test-data.md)
- Issues conocidos: [../known-issues.md](../known-issues.md)
- Plan de la API: [../test-plans/ecommerce-api-test-plan.md](../test-plans/ecommerce-api-test-plan.md)
