/// <reference types="cypress" />

// Flujo de checkout en 4 fases. El checkout de esta app está organizado en un
// único CheckoutPage con secciones (acordeones): (1) carrito, (2) dirección,
// (3) método de pago y (4) revisión + confirmación. Se prueban esos 4 bloques.
//
// Nota: dirección y método de pago se cargan desde datos MOCK del front
// (shippingService/paymentService leen JSON local) y vienen preseleccionados por
// defecto. La orden final SÍ se crea de forma real contra POST /api/orders.

describe("Checkout", () => {
  beforeEach(() => {
    cy.loginByApi();
    cy.getFirstProduct().then((product) => {
      cy.wrap(product).as("product");
    });
  });

  // ---------------------------------------------------------------------------
  context("Fase 1: carrito y productos", () => {
    beforeEach(function () {
      cy.addProductToCart({ productId: this.product._id, quantity: 1 });
      cy.visit("/cart");
    });

    it("muestra el producto agregado con nombre y subtotal", function () {
      cy.get(`[data-testid="cart-item-${this.product._id}"]`).should("be.visible");
      cy.contains(this.product.name).should("be.visible");
      cy.get('[data-testid="cart-subtotal"]').should(
        "contain",
        this.product.price.toFixed(2),
      );
    });

    it("permite aumentar y disminuir la cantidad y actualiza el subtotal", function () {
      const id = this.product._id;
      cy.get(`[data-testid="cart-item-increase-${id}"]`).click();
      cy.get(`[data-testid="cart-item-quantity-${id}"]`).should("contain", "2");
      cy.get('[data-testid="cart-subtotal"]').should(
        "contain",
        (this.product.price * 2).toFixed(2),
      );

      cy.get(`[data-testid="cart-item-decrease-${id}"]`).click();
      cy.get(`[data-testid="cart-item-quantity-${id}"]`).should("contain", "1");
    });

    it("elimina el producto y previene el checkout con carrito vacío", function () {
      cy.get(`[data-testid="cart-item-remove-${this.product._id}"]`).click();
      cy.contains(/tu carrito está vacío/i).should("be.visible");
      cy.get('[data-testid="cart-checkout-button"]').should("not.exist");
    });

    it("tiene un botón para continuar al checkout", () => {
      cy.get('[data-testid="cart-checkout-button"]').should("be.enabled").click();
      cy.location("pathname").should("eq", "/checkout");
    });
  });

  // ---------------------------------------------------------------------------
  context("Fase 2 y 3: dirección y método de pago", () => {
    beforeEach(function () {
      cy.addProductToCart({ productId: this.product._id, quantity: 1 });
      cy.visit("/checkout");
    });

    it("muestra la dirección de envío preseleccionada (Fase 2)", () => {
      cy.contains(/dirección de envío/i).should("be.visible");
      // Dirección por defecto del mock (shipping-address.json -> "Home").
      cy.contains(".selected-address", /home/i).should("exist");
    });

    it("muestra el método de pago preseleccionado (Fase 3)", () => {
      cy.contains(/método de pago/i).should("be.visible");
      // Pago por defecto del mock (paymentMethods.json -> "Bancomer", termina en 5555).
      cy.contains(".selected-payment", /bancomer/i).should("exist");
      cy.contains(".selected-payment", /5555/).should("exist");
    });
  });

  // ---------------------------------------------------------------------------
  context("Fase 4: revisión y confirmación", () => {
    beforeEach(function () {
      cy.intercept("POST", "**/api/orders").as("createOrder");
      cy.addProductToCart({ productId: this.product._id, quantity: 2 });
      cy.visit("/checkout");
    });

    it("muestra el resumen con el total del pedido", function () {
      cy.get('[data-testid="checkout-order-summary"]').should("be.visible");
      cy.get('[data-testid="checkout-total"]').should(
        "contain",
        (this.product.price * 2).toFixed(2),
      );
    });

    it("crea una única orden real, redirige a confirmación y vacía el carrito", function () {
      cy.get('[data-testid="checkout-confirm-button"]', { timeout: 10000 })
        .should("be.enabled")
        .click();

      cy.wait("@createOrder").then(({ request, response }) => {
        expect(response.statusCode).to.eq(201);
        // El payload contiene los datos esperados del contrato POST /orders.
        expect(request.body.user).to.be.a("string");
        expect(request.body.products).to.have.length(1);
        expect(request.body.products[0]).to.include({
          productId: this.product._id,
          quantity: 2,
        });
        expect(request.body.paymentMethod).to.be.a("string");
        expect(request.body.totalPrice).to.eq(this.product.price * 2);
      });

      // Redirección a confirmación con número de orden.
      cy.location("pathname").should("eq", "/order-confirmation");
      cy.get('[data-testid="order-success"]').should("be.visible");
      cy.get('[data-testid="order-number"]').invoke("text").should("have.length.greaterThan", 0);

      // El carrito quedó vacío.
      cy.get('[data-testid="cart-count"]').should("contain", "0");

      // Sólo se creó UNA orden.
      cy.get("@createOrder.all").should("have.length", 1);

      // Recargar la confirmación no duplica la orden (se pierde el state -> vuelve al home).
      cy.reload();
      cy.location("pathname").should("eq", "/");
      cy.get("@createOrder.all").should("have.length", 1);
    });

    it("evita órdenes duplicadas al reintentar el botón de compra", function () {
      cy.get('[data-testid="checkout-confirm-button"]', { timeout: 10000 })
        .should("be.enabled")
        .click();
      // Tras el primer click el botón se deshabilita (guard de doble envío).
      cy.get('[data-testid="checkout-confirm-button"]').should("not.exist");
      cy.wait("@createOrder");
      cy.get("@createOrder.all").should("have.length", 1);
    });
  });
});
