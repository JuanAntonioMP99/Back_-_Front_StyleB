/// <reference types="cypress" />
import { knownUser } from "../../utils/testData";

describe("Login", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/auth/login").as("loginRequest");
    cy.visit("/login");
  });

  it("renderiza el formulario de login", () => {
    cy.get('[data-testid="login-email-input"]').should("be.visible");
    cy.get('[data-testid="login-password-input"]').should("be.visible");
    cy.get('[data-testid="login-submit-button"]').should("be.visible");
    cy.contains("a", /registrate/i).should("have.attr", "href", "/register");
  });

  it("no envía la petición con campos vacíos (validación nativa requerida)", () => {
    cy.get('[data-testid="login-submit-button"]').click();
    cy.location("pathname").should("eq", "/login");
    cy.get("@loginRequest.all").should("have.length", 0);
  });

  it("muestra mensaje ante credenciales incorrectas y no crea sesión", () => {
    const { email } = knownUser();
    cy.get('[data-testid="login-email-input"]').type(email);
    cy.get('[data-testid="login-password-input"]').type("contraseña-incorrecta");
    cy.get('[data-testid="login-submit-button"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 400);
    cy.contains(/email o contraseña incorrectos/i).should("be.visible");
    cy.location("pathname").should("eq", "/login");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.null;
    });
    // el botón deja de mostrar estado de carga
    cy.get('[data-testid="login-submit-button"]')
      .should("be.enabled")
      .and("contain", "Iniciar Sesión");
  });

  it("inicia sesión con credenciales válidas y redirige al home", () => {
    const { email, password } = knownUser();
    cy.get('[data-testid="login-email-input"]').type(email);
    cy.get('[data-testid="login-password-input"]').type(password, { log: false });
    cy.get('[data-testid="login-submit-button"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/");
    // información del usuario en la cabecera
    cy.contains(/hola,\s*usuario e2e/i).should("be.visible");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("authToken")).to.be.a("string");
    });
  });

  it("mantiene la sesión tras recargar y permite entrar a rutas protegidas", () => {
    cy.loginByApi();
    cy.visit("/");
    cy.contains(/hola,\s*usuario e2e/i).should("be.visible");

    cy.reload();
    cy.contains(/hola,\s*usuario e2e/i).should("be.visible");

    cy.visit("/profile");
    cy.location("pathname").should("eq", "/profile");
  });

  it("protege rutas privadas redirigiendo a login sin sesión", () => {
    cy.clearLocalStorage();
    cy.visit("/checkout");
    cy.location("pathname").should("eq", "/login");
    // no se muestran datos privados del checkout
    cy.get('[data-testid="checkout-confirm-button"]').should("not.exist");
  });
});
