import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.js"],

    // globalSetup levanta UN solo mongod para toda la ejecución.
    // setup.js conecta cada archivo a su propia base dentro de esa instancia y
    // limpia las colecciones entre tests.
    globalSetup: ["tests/globalSetup.js"],
    setupFiles: ["tests/setup.js"],

    pool: "forks",

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
      // Umbrales = trinquete (ratchet). Reflejan la cobertura REAL medida tras el
      // bloque de seguridad (56.47% líneas). Nunca se bajan: al cerrar cada hito
      // del plan se suben al nuevo mínimo alcanzado, de modo que la cobertura no
      // pueda retroceder. Objetivos por fase en
      // docs/test-plans/ecommerce-api-test-plan.md.
      //
      // El % es un suelo, NO el criterio de calidad: ver §11 del plan, donde se
      // listan las reglas críticas cubiertas (autorización, fuga de credenciales,
      // camino de error). errorHandler.js está al 100% y aun así no se ejecuta
      // en producción (K21) — de ahí que el porcentaje por sí solo engañe.
      thresholds: {
        lines: 56,
        functions: 63,
        branches: 29,
        statements: 56,
      },
    },
  },
});
