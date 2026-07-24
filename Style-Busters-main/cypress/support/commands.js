/// <reference types="cypress" />

/**
 * cy.loginByApi({ email, password })
 * Inicia sesión directamente contra la API real (POST /auth/login) sin pasar por
 * la UI, y guarda el token en localStorage (clave "authToken", igual que la app).
 * Usa cy.session() para cachear la sesión entre tests. No expone la contraseña
 * en los logs (log:false).
 */
Cypress.Commands.add("loginByApi", (credentials = {}) => {
  const email = credentials.email || Cypress.env("TEST_USER_EMAIL");
  const password = credentials.password || Cypress.env("TEST_USER_PASSWORD");
  const apiUrl = Cypress.env("apiUrl");

  cy.session(
    [email],
    () => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/auth/login`,
        body: { email, password },
        log: false,
      }).then(({ status, body }) => {
        expect(status, "login status").to.eq(200);
        expect(body.token, "login debe devolver token").to.be.a("string");
        window.localStorage.setItem("authToken", body.token);
      });
    },
    {
      validate() {
        // La sesión es válida mientras exista el token.
        cy.window().then((win) => {
          expect(win.localStorage.getItem("authToken")).to.be.a("string");
        });
      },
      cacheAcrossSpecs: true,
    },
  );
});

/**
 * cy.getFirstProduct() -> devuelve (yields) el primer producto del catálogo real.
 */
Cypress.Commands.add("getFirstProduct", () => {
  const apiUrl = Cypress.env("apiUrl");
  return cy
    .request(`${apiUrl}/products`)
    .then(({ body }) => {
      const list = Array.isArray(body) ? body : body.products || [];
      expect(list.length, "el catálogo debe tener productos sembrados").to.be.greaterThan(0);
      return list[0];
    });
});

/**
 * cy.addProductToCart({ productId?, quantity }) — agrega un producto al carrito
 * DESDE LA UI (visita el detalle y pulsa "Agregar al carrito"), validando la
 * integración visual del carrito (contador). Si no se pasa productId, usa el
 * primer producto del catálogo real.
 *
 * Devuelve el producto agregado para usarlo en aserciones posteriores.
 */
Cypress.Commands.add("addProductToCart", (options = {}) => {
  const { productId, quantity = 1 } = options;

  const addFromDetail = (product) => {
    cy.visit(`/product/${product._id}`);
    cy.get('[data-testid="product-detail"]', { timeout: 10000 }).should("be.visible");
    for (let i = 0; i < quantity; i += 1) {
      cy.get('[data-testid="add-to-cart-button"]').click();
    }
    cy.get('[data-testid="cart-count"]').should("contain", String(quantity));
    return cy.wrap(product, { log: false });
  };

  if (productId) {
    const apiUrl = Cypress.env("apiUrl");
    return cy
      .request(`${apiUrl}/products/${productId}`)
      .then(({ body }) => addFromDetail(body));
  }
  return cy.getFirstProduct().then(addFromDetail);
});
