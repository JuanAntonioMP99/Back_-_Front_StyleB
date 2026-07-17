import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.js"],

    // setup.js arranca/para el mongodb-memory-server y limpia colecciones
    // entre tests. Ver tests/setup.js.
    setupFiles: ["tests/setup.js"],

    // Cada archivo de test levanta su propio mongodb-memory-server (setup.js).
    // fileParallelism:false los ejecuta de uno en uno: evita N instancias de
    // mongod compitiendo por RAM y hace los tiempos deterministas.
    // Si el suite crece y la duración molesta, subir a fileParallelism:true.
    pool: "forks",
    fileParallelism: false,

    // Descargar el binario de MongoDB la primera vez puede tardar.
    testTimeout: 20000,
    hookTimeout: 60000,

    restoreMocks: true,
    clearMocks: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.js", "server.js"],
      exclude: ["src/config/db.conf.js", "**/node_modules/**"],
      // Umbrales = trinquete (ratchet). Reflejan la cobertura REAL de la Fase 0
      // (medida: 32.22% líneas). Nunca se bajan: al cerrar cada fase del plan se
      // suben al nuevo mínimo alcanzado, de modo que la cobertura no pueda
      // retroceder. Objetivos por fase en
      // docs/test-plans/ecommerce-api-test-plan.md.
      thresholds: {
        lines: 32,
        functions: 15,
        branches: 11,
        statements: 31,
      },
    },
  },
});
