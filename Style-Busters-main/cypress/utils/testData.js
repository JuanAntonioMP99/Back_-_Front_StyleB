// Generadores de datos de prueba para E2E.
// Cada ejecución usa datos únicos para evitar colisiones entre corridas.

/** Genera un usuario único basado en timestamp (para el flujo de registro). */
export function makeUniqueUser(overrides = {}) {
  const stamp = Date.now();
  return {
    name: "Usuario Cypress",
    email: `cypress-${stamp}@example.com`,
    password: "Test1234!",
    ...overrides,
  };
}

/** Usuario de prueba conocido (sembrado por el backend E2E). */
export function knownUser() {
  return {
    email: Cypress.env("TEST_USER_EMAIL"),
    password: Cypress.env("TEST_USER_PASSWORD"),
  };
}
