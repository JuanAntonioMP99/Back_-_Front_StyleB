/// <reference types="cypress" />
import { makeUniqueUser } from "../../utils/testData";

describe("Registro", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/auth/register").as("registerRequest");
    cy.visit("/register");
  });

  it("renderiza el formulario completo", () => {
    cy.get('[data-testid="register-name-input"]').should("be.visible");
    cy.get('[data-testid="register-email-input"]').should("be.visible");
    cy.get('[data-testid="register-password-input"]').should("be.visible");
    cy.get('[data-testid="register-confirm-password-input"]').should("be.visible");
    cy.get('[data-testid="register-submit-button"]').should("be.visible");
    cy.contains("a", /inicia sesión/i).should("have.attr", "href", "/login");
  });

  it("valida campos obligatorios y no envía la petición", () => {
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-name-error"]').should("be.visible");
    cy.get('[data-testid="register-email-error"]').should("be.visible");
    cy.get('[data-testid="register-password-error"]').should("be.visible");

    cy.location("pathname").should("eq", "/register");
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("rechaza un correo con formato inválido", () => {
    cy.get('[data-testid="register-name-input"]').type("Ada");
    cy.get('[data-testid="register-email-input"]').type("no-es-correo");
    cy.get('[data-testid="register-password-input"]').type("Test1234!");
    cy.get('[data-testid="register-confirm-password-input"]').type("Test1234!");
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-email-error"]').should("contain", "formato");
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("rechaza contraseñas que no coinciden", () => {
    cy.get('[data-testid="register-name-input"]').type("Ada");
    cy.get('[data-testid="register-email-input"]').type("ada@example.com");
    cy.get('[data-testid="register-password-input"]').type("Test1234!");
    cy.get('[data-testid="register-confirm-password-input"]').type("Otra9999!");
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="register-confirm-password-error"]').should(
      "contain",
      "no coinciden",
    );
    cy.get("@registerRequest.all").should("have.length", 0);
  });

  it("registra un usuario nuevo y redirige a login", () => {
    const user = makeUniqueUser();

    cy.get('[data-testid="register-name-input"]').type(user.name);
    cy.get('[data-testid="register-email-input"]').type(user.email);
    cy.get('[data-testid="register-password-input"]').type(user.password);
    cy.get('[data-testid="register-confirm-password-input"]').type(user.password);
    cy.get('[data-testid="register-submit-button"]').click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 201);
    cy.location("pathname").should("eq", "/login");
    cy.contains(/cuenta creada exitosamente/i).should("be.visible");
  });

  it("muestra error comprensible si el usuario ya existe y no queda cargando", () => {
    const user = makeUniqueUser();
    const apiUrl = Cypress.env("apiUrl");

    // Precondición: crear el usuario vía API para provocar el conflicto.
    cy.request({
      method: "POST",
      url: `${apiUrl}/auth/register`,
      body: { name: user.name, email: user.email, password: user.password },
    });

    cy.get('[data-testid="register-name-input"]').type(user.name);
    cy.get('[data-testid="register-email-input"]').type(user.email);
    cy.get('[data-testid="register-password-input"]').type(user.password);
    cy.get('[data-testid="register-confirm-password-input"]').type(user.password);
    cy.get('[data-testid="register-submit-button"]').click();

    cy.wait("@registerRequest").its("response.statusCode").should("eq", 400);
    cy.get('[data-testid="register-email-error"]').should(
      "contain",
      "ya está registrado",
    );
    // No debe quedar en estado de carga infinito.
    cy.get('[data-testid="register-submit-button"]')
      .should("be.enabled")
      .and("contain", "Crear cuenta");
  });
});
