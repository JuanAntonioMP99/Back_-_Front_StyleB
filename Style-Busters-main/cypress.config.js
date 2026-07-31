const { defineConfig } = require("cypress");

// Credenciales de prueba: se pueden sobreescribir con variables de entorno
// CYPRESS_TEST_USER_EMAIL / CYPRESS_TEST_USER_PASSWORD o un cypress.env.json
// (este último está en .gitignore para no versionar secretos reales).
//
// baseUrl/apiUrl: defaults locales, sobreescribibles con las variables
// estándar de Cypress. CYPRESS_BASE_URL sobreescribe baseUrl automáticamente
// (mecanismo nativo de Cypress). CYPRESS_API_URL, en cambio, NO cae solo en
// env.apiUrl (Cypress solo mapea automáticamente CYPRESS_BASE_URL a baseUrl;
// cualquier otra variable CYPRESS_* arbitraria termina en
// Cypress.env("API_URL"), no en Cypress.env("apiUrl")): por eso se lee
// explícitamente process.env.CYPRESS_API_URL aquí, con el default local si no
// está definida.
module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/e2e.js",
    fixturesFolder: "cypress/fixtures",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    retries: { runMode: 2, openMode: 0 },
    env: {
      apiUrl: process.env.CYPRESS_API_URL || "http://localhost:4000/api",
      TEST_USER_EMAIL: "e2e@styleb.test",
      TEST_USER_PASSWORD: "Test1234!",
    },
    setupNodeEvents(on, config) {
      // Punto de extensión para tasks de Node (p. ej. limpieza de BD) si se
      // necesitara en el futuro. Hoy la BD es efímera por arranque del backend.
      return config;
    },
  },
});
