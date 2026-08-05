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
    // Se limita el número de workers en paralelo: cada archivo de integración abre
    // su propia conexión de mongoose contra el mongod compartido, y con demasiados
    // forks simultáneos un worker puede morir por presión de recursos
    // ("Worker exited unexpectedly"). Con maxForks: 2 el suite es estable y sigue
    // aprovechando algo de paralelismo. El aislamiento lo da el dbName único por
    // archivo (tests/setup.js), no el orden de ejecución.
    poolOptions: {
      forks: { minForks: 1, maxForks: 2 },
    },

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
      // Umbrales = trinquete (ratchet). Reflejan la cobertura REAL medida. Nunca
      // se bajan: al cerrar cada hito del plan se suben al nuevo mínimo alcanzado,
      // de modo que la cobertura no pueda retroceder. Objetivos por fase en
      // docs/test-plans/ecommerce-api-test-plan.md.
      //
      // Subidos el 2026-07-30 tras completar la integración por recurso (Products,
      // Categories, Users, Cart, Orders, Payment Methods, Wishlist): cobertura
      // medida 78.9% líneas / 71.83% branches / 84.61% funcs / 79.07% stmts. Los
      // suelos se fijan por debajo del mínimo observado entre corridas para
      // absorber la varianza natural del conteo de branches sin volverse frágiles.
      //
      // El % es un suelo, NO el criterio de calidad: ver §11 del plan, donde se
      // listan las reglas críticas cubiertas (autorización, fuga de credenciales,
      // camino de error). errorHandler.js está al 100% y aun así no se ejecuta
      // en producción (K21) — de ahí que el porcentaje por sí solo engañe.
      thresholds: {
        lines: 74,
        functions: 80,
        branches: 60,
        statements: 74,
      },
    },
  },
});
